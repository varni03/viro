import { useState, useEffect } from "react";
import { COLORS, severityColor } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";

/* ────────────────────────────────────────────────────────────
   DynamicDashboard — renders a dashboard from JSON config.
   Visual language matches the Fable prototype:
   frosted glass, hover lift, monospace data, severity-only color.
   Config shape is unchanged from the previous renderer.
──────────────────────────────────────────────────────────── */

const STYLE_ID = "viro-dyn-styles";
function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    .vdyn-card{
      background:rgba(255,255,255,0.05);
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:16px;padding:20px;position:relative;overflow:hidden;
      transition:border-color .2s cubic-bezier(.16,1,.3,1),
                 background .2s cubic-bezier(.16,1,.3,1),
                 transform .2s cubic-bezier(.16,1,.3,1),
                 box-shadow .2s cubic-bezier(.16,1,.3,1);
    }
    .vdyn-card:hover{
      background:rgba(255,255,255,0.07);
      border-color:rgba(255,255,255,0.16);
      transform:translateY(-1px);
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
    }
    .vdyn-kpi-accent::before{
      content:"";position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
    }
    .vdyn-bfill{transition:width 1s cubic-bezier(.16,1,.3,1)}
    .vdyn-fstage{
      flex:1 1 150px;background:rgba(255,255,255,0.035);
      border:1px solid rgba(255,255,255,0.08);border-radius:12px;
      padding:14px 15px;position:relative;
      transition:border-color .2s ease, background .2s ease;
    }
    .vdyn-fstage.hot{border-color:rgba(255,68,68,0.35);background:rgba(255,68,68,0.05)}
    .vdyn-fstage::after{
      content:"→";position:absolute;right:-13px;top:50%;
      transform:translateY(-50%);color:rgba(255,255,255,0.3);font-size:13px;z-index:2;
    }
    .vdyn-fstage:last-child::after{display:none}
    .vdyn-row tr:hover td{background:rgba(255,255,255,0.03)}
    .vdyn-block{position:relative}
    .vdyn-ask{
      position:absolute;top:12px;right:12px;z-index:3;
      width:26px;height:26px;border-radius:8px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:12px;
      background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);
      opacity:0;transform:translateY(-2px);
      transition:opacity .18s cubic-bezier(.16,1,.3,1),
                 transform .18s cubic-bezier(.16,1,.3,1),
                 background .18s ease;
    }
    .vdyn-block:hover .vdyn-ask{opacity:1;transform:translateY(0)}
    .vdyn-ask:hover{background:rgba(255,255,255,0.16);color:#fff}
    .vdyn-insight{
      margin-top:14px;padding-top:12px;
      border-top:1px solid rgba(255,255,255,0.06);
      font-size:12px;line-height:1.5;color:rgba(255,255,255,0.62);
      display:flex;gap:7px;align-items:flex-start;
      animation:vdyn-fade .4s cubic-bezier(.16,1,.3,1);
    }
    .vdyn-insight .spark{color:rgba(255,255,255,0.45);flex-shrink:0}
    @keyframes vdyn-fade{from{opacity:0}to{opacity:1}}
    .vdyn-overlay{
      position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.55);
      backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;
      animation:vdyn-fade .15s ease;
    }
    .vdyn-modal{
      width:460px;max-width:calc(100vw - 40px);
      background:rgba(20,21,23,0.96);backdrop-filter:blur(20px);
      border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:22px;
      box-shadow:0 20px 60px rgba(0,0,0,0.5);
    }
  `;
  document.head.appendChild(el);
}

const lbl = {
  fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)", marginBottom: 12, fontWeight: 600,
};
function fmt(v, suffix = "") {
  if (v === null || v === undefined) return "—";
  return `${v}${suffix}`;
}
function pick(obj, path) {
  if (!obj) return undefined;
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
function Empty() {
  return (
    <div style={{ height: 130, display: "flex", alignItems: "center",
      justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
      No data yet
    </div>
  );
}
function InsightLine({ text }) {
  if (!text) return null;
  return (
    <div className="vdyn-insight">
      <span className="spark">✦</span>
      <span>{text}</span>
    </div>
  );
}

/* ── Generic query block: AI writes SQL + picks any chart ──────── */
const PALETTE = ["#ffffff", "#ff8800", "#eab308", "#22c55e", "#ff4444",
  "rgba(255,255,255,0.55)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.28)"];
const num = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

function ChartTable(rows, cols) {
  return (
    <table className="vdyn-row" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 6 }}>
      <thead><tr>{cols.map(c => (
        <th key={c} style={{ textAlign: "left", padding: "0 12px 10px", fontSize: 9.5,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{c}</th>
      ))}</tr></thead>
      <tbody>{rows.map((r, ri) => (
        <tr key={ri}>{cols.map(c => (
          <td key={c} style={{ padding: "11px 12px", borderTop: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.82)" }}>{String(r[c] ?? "")}</td>
        ))}</tr>
      ))}</tbody>
    </table>
  );
}
function ChartBar(rows, x, y) {
  const max = Math.max(...rows.map(r => num(r[y])), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 170, marginTop: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{r[y]}</div>
          <div style={{ width: "100%", height: `${(num(r[y]) / max) * 120}px`, minHeight: 2,
            borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.4))" }} />
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 5, maxWidth: "100%",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(r[x])}</div>
        </div>
      ))}
    </div>
  );
}
function ChartLine(rows, x, y) {
  const w = 520, h = 160, pad = 12;
  const ys = rows.map(r => num(r[y]));
  const max = Math.max(...ys, 1), min = Math.min(...ys, 0), span = (max - min) || 1;
  const pts = rows.map((r, i) => {
    const px = pad + (i * (w - 2 * pad)) / Math.max(rows.length - 1, 1);
    const py = h - pad - ((num(r[y]) - min) / span) * (h - 2 * pad);
    return [px, py];
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`;
  return (
    <div style={{ marginTop: 8 }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 170 }} preserveAspectRatio="none">
        <path d={area} fill="rgba(255,255,255,0.06)" />
        <path d={d} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
        <span>{String(rows[0]?.[x] ?? "")}</span><span>{String(rows[rows.length - 1]?.[x] ?? "")}</span>
      </div>
    </div>
  );
}
function ChartPie(rows, x, y) {
  const total = rows.reduce((s, r) => s + num(r[y]), 0) || 1;
  let acc = 0;
  const segs = rows.map((r, i) => {
    const start = (acc / total) * 360; acc += num(r[y]); const end = (acc / total) * 360;
    return { color: PALETTE[i % PALETTE.length], start, end, label: String(r[x]), val: num(r[y]) };
  });
  const grad = segs.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(",");
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
      <div style={{ width: 130, height: 130, borderRadius: "50%", flexShrink: 0,
        background: `conic-gradient(${grad})`, position: "relative" }}>
        <div style={{ position: "absolute", inset: "24%", borderRadius: "50%", background: "#0c0d0e" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 130, flex: 1 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function ChartKpi(rows, y, block) {
  const v = rows.length ? rows[0][y] : "—";
  return (
    <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 10,
      fontVariantNumeric: "tabular-nums" }}>{fmt(v, block.suffix || "")}</div>
  );
}

function QueryBlock({ block, company }) {
  const [rows, setRows] = useState(null);
  const [cols, setCols] = useState([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    setRows(null); setErr(false);
    fetch(`${API}/analytics/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql: block.sql, company_id: company.company_id }),
    })
      .then(r => r.json())
      .then(res => { if (!alive) return; if (res.error) setErr(true); setRows(res.data || []); setCols(res.columns || []); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [block.sql, company.company_id]);

  let body;
  if (err) {
    body = <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Couldn't run this query</div>;
  } else if (rows === null) {
    body = <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</div>;
  } else if (!rows.length) {
    body = <Empty />;
  } else {
    const x = block.x && cols.includes(block.x) ? block.x : cols[0];
    const y = block.y && cols.includes(block.y)
      ? block.y
      : (cols.find(c => c !== x && rows.some(r => !isNaN(Number(r[c])))) || cols[1] || cols[0]);
    const chart = block.chart || "table";
    body = chart === "bar" ? ChartBar(rows, x, y)
      : chart === "line" ? ChartLine(rows, x, y)
      : chart === "pie" ? ChartPie(rows, x, y)
      : chart === "kpi" ? ChartKpi(rows, y, block)
      : ChartTable(rows, cols);
  }

  return (
    <div className="vdyn-card">
      <div style={lbl}>{block.label}</div>
      {body}
    </div>
  );
}

const BLOCKS = {
  kpi(block, data, insight) {
    const raw = block.field ? pick(data, block.field) : data;
    return (
      <div className={"vdyn-card" + (block.accent ? " vdyn-kpi-accent" : "")}
           style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{block.label}</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.035em",
          lineHeight: 1, fontVariantNumeric: "tabular-nums",
          color: block.danger && Number(raw) > 0 ? COLORS.critical : "#fff", marginBottom: 8 }}>
          {fmt(raw, block.suffix || "")}
        </div>
        {block.sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{block.sub}</div>}
        <InsightLine text={insight} />
      </div>
    );
  },

  pipeline(block, data, insight) {
    const rows = Array.isArray(data) ? data : [];
    const stages = block.stages || [];
    const agg = {};
    rows.forEach(r => {
      const s = r[block.stage_field || "current_stage"];
      if (!agg[s]) agg[s] = { count: 0, critical: 0 };
      agg[s].count += 1;
      agg[s].critical += Number(r.critical_open || 0);
    });
    return (
      <div className="vdyn-card">
        <div style={lbl}>{block.label}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {stages.map((st, i) => {
            const a = agg[st.number] || { count: 0, critical: 0 };
            const blocked = a.critical > 0;
            const isLast = i === stages.length - 1;
            return (
              <div key={i} className={"vdyn-fstage" + (blocked ? " hot" : "")}>
                <div style={{ fontFamily: "monospace", fontSize: 10,
                  color: "rgba(255,255,255,0.3)", marginBottom: 7 }}>STAGE {st.number}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 11,
                  color: "rgba(255,255,255,0.85)" }}>{st.name}</div>
                <div style={{ fontSize: 23, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                  {a.count}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}> {block.unit || "items"}</span>
                </div>
                <div style={{ marginTop: 9, fontSize: 10.5, fontWeight: 600,
                  color: blocked ? COLORS.critical : (isLast ? COLORS.low : "rgba(255,255,255,0.3)") }}>
                  {blocked
                    ? `● ${a.critical} blocked — critical`
                    : (isLast ? `ready to ship` : `on pace`)}
                </div>
              </div>
            );
          })}
        </div>
        <InsightLine text={insight} />
      </div>
    );
  },

  ranked_bars(block, data, insight) {
    const rows = Array.isArray(data) ? [...data] : [];
    rows.sort((a, b) => (Number(pick(b, block.value)) || 0) - (Number(pick(a, block.value)) || 0));
    const top = rows.slice(0, block.limit || 6);
    const max = Math.max(...top.map(r => Number(pick(r, block.value)) || 0), 1);
    return (
      <div className="vdyn-card">
        <div style={lbl}>{block.label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {top.map((r, i) => {
            const v = Number(pick(r, block.value)) || 0;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>
                    {block.prefix || ""}{pick(r, block.name)}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)",
                  borderRadius: 3, overflow: "hidden" }}>
                  <div className="vdyn-bfill" style={{
                    height: "100%", width: `${(v / max) * 100}%`, borderRadius: 3,
                    background: i === 0
                      ? `linear-gradient(90deg, ${COLORS.critical}, ${COLORS.high})`
                      : "rgba(255,255,255,0.5)",
                  }} />
                </div>
              </div>
            );
          })}
          {!top.length && <Empty />}
        </div>
        <InsightLine text={insight} />
      </div>
    );
  },

  table(block, data, insight) {
    const rows = Array.isArray(data) ? data.slice(0, block.limit || 8) : [];
    return (
      <div className="vdyn-card">
        <div style={lbl}>{block.label}</div>
        {rows.length ? (
          <table className="vdyn-row" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {block.columns.map(c => (
                  <th key={c.field} style={{ textAlign: "left", padding: "0 12px 10px",
                    fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {block.columns.map(c => {
                    const val = pick(r, c.field);
                    return (
                      <td key={c.field} style={{ padding: "11px 12px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.82)" }}>
                        {c.type === "severity"
                          ? <span style={{
                              fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em",
                              textTransform: "uppercase", padding: "3px 9px", borderRadius: 5,
                              color: severityColor(val),
                              background: severityColor(val) + "1f",
                              border: `1px solid ${severityColor(val)}40`,
                            }}>{val}</span>
                          : c.mono
                            ? <span style={{ fontFamily: "monospace", fontSize: 11.5 }}>{val}</span>
                            : String(val ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty />}
        <InsightLine text={insight} />
      </div>
    );
  },
};

// Compact a block's source data before sending it to the insight model.
function compact(sd) {
  if (Array.isArray(sd)) return sd.slice(0, 12);
  return sd;
}
function buildCards(config, data) {
  const cards = [];
  (config.sections || []).forEach((section, si) => {
    (section.blocks || []).forEach((block, bi) => {
      const sd = block.source ? data[block.source] : null;
      cards.push({
        key: `${si}-${bi}`,
        label: block.label || block.type,
        type: block.type,
        data: compact(sd),
      });
    });
  });
  return cards;
}

export default function DynamicDashboard({ company, config }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({});
  const [ask, setAsk] = useState(null); // { key, label, summary, loading, answer }

  useEffect(() => { ensureStyles(); }, []);

  useEffect(() => {
    if (!company || !config?.sources) { setLoading(false); return; }
    setLoading(true);
    setInsights({});
    const cid = company.company_id;
    const entries = Object.entries(config.sources);
    Promise.all(
      entries.map(([key, path]) =>
        fetch(API + path.replace("{cid}", cid))
          .then(r => r.json())
          .then(d => [key, d])
          .catch(() => [key, null])
      )
    ).then(results => {
      setData(Object.fromEntries(results));
      setLoading(false);
    });
  }, [company, config]);

  // Insight layer — one batch call → a one-sentence insight per card.
  useEffect(() => {
    if (loading || !company || !config?.sections) return;
    const cards = buildCards(config, data);
    fetch(`${API}/dashboard/insights/${company.company_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    })
      .then(r => r.json())
      .then(res => setInsights(res.insights || {}))
      .catch(() => {});
  }, [loading, data, company, config]);

  const runCardAction = (action) => {
    if (!ask || !company) return;
    setAsk(a => ({ ...a, loading: true, answer: null }));
    fetch(`${API}/ai/card-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: company.company_id,
        action,
        label: ask.label,
        summary: ask.summary,
      }),
    })
      .then(r => r.json())
      .then(res => setAsk(a => ({ ...a, loading: false, answer: res.answer || "No response." })))
      .catch(() => setAsk(a => ({ ...a, loading: false, answer: "Couldn't reach the AI service." })));
  };

  if (!config) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", color: "rgba(255,255,255,0.4)" }}>No dashboard configured yet.</div>;
  }
  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", color: "rgba(255,255,255,0.4)" }}>Loading…</div>;
  }

  const subtitle = (config.subtitle_template || "")
    .replace("{company}", company.name)
    .replace("{industry}", company.industry || "");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em",
          margin: 0, marginBottom: 5 }}>{config.title || "Dashboard"}</h1>
        {subtitle && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>{subtitle}</p>}
      </div>

      {config.sections.map((section, si) => (
        <div key={si} style={{ display: "grid", gridTemplateColumns: section.cols || "1fr",
          gap: section.gap || 14, marginBottom: 14 }}>
          {section.blocks.map((block, bi) => {
            const key = `${si}-${bi}`;
            if (block.type === "query") {
              return (
                <div key={bi} className="vdyn-block">
                  <QueryBlock block={block} company={company} />
                  <button
                    className="vdyn-ask"
                    title="Ask about this"
                    onClick={() => setAsk({
                      key,
                      label: block.label || "Chart",
                      summary: { label: block.label, sql: block.sql, chart: block.chart },
                      loading: false,
                      answer: null,
                    })}
                  >✦</button>
                </div>
              );
            }
            const renderer = BLOCKS[block.type];
            const sourceData = block.source ? data[block.source] : null;
            return (
              <div key={bi} className="vdyn-block">
                {renderer
                  ? renderer(block, sourceData, insights[key])
                  : <div className="vdyn-card"><span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Unknown block: {block.type}</span></div>}
                {renderer && (
                  <button
                    className="vdyn-ask"
                    title="Ask about this"
                    onClick={() => setAsk({
                      key,
                      label: block.label || block.type,
                      summary: compact(sourceData),
                      loading: false,
                      answer: null,
                    })}
                  >✦</button>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {ask && (
        <div className="vdyn-overlay" onClick={() => setAsk(null)}>
          <div className="vdyn-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{ask.label}</div>
              <span onClick={() => setAsk(null)} style={{ cursor: "pointer",
                color: "rgba(255,255,255,0.4)", fontSize: 16, lineHeight: 1 }}>✕</span>
            </div>

            {!ask.answer && !ask.loading && (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
                  What do you want to know?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => runCardAction("explain")} style={{
                    flex: 1, background: "rgba(255,255,255,0.95)", color: "#08090a",
                    border: "none", borderRadius: 10, padding: "11px 14px",
                    fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Explain this
                  </button>
                  <button onClick={() => runCardAction("alert")} style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 14px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Alert me when this changes
                  </button>
                </div>
              </>
            )}

            {ask.loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                color: "rgba(255,255,255,0.5)", fontSize: 13, padding: "8px 0" }}>
                <span className="spark" style={{ animation: "vdyn-fade 0.8s ease-in-out infinite alternate" }}>✦</span>
                Thinking…
              </div>
            )}

            {ask.answer && (
              <div style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.85)",
                whiteSpace: "pre-wrap" }}>
                {ask.answer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const SUPPORTED_BLOCKS = Object.keys(BLOCKS);
