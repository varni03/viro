import { useState, useEffect } from "react";
import { COLORS, PageHeader, InsightBanner } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";
const RED = "#ff5a5a", AMBER = "#f0a83c", GREEN = "#34d399";
const PALETTE = ["#ffffff", "#34d399", "#f0a83c", "#ff5a5a", "rgba(255,255,255,0.55)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.28)"];
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
const lbl = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontWeight: 600, marginBottom: 12 };
const num = v => { const n = Number(v); return isNaN(n) ? 0 : n; };

function applyFilter(rows, f) {
  if (!f || !f.field) return rows;
  return rows.filter(r => String(r[f.field] ?? "").toLowerCase() === String(f.equals ?? "").toLowerCase());
}
function groupCounts(rows, key) {
  const m = {};
  rows.forEach(r => { const k = r[key] ?? "—"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([label, value]) => ({ label: String(label), value })).sort((a, b) => b.value - a.value).slice(0, 8);
}

function Metric({ block, rows, field }) {
  const r = applyFilter(rows, block.filter);
  let v = 0;
  if (block.agg === "sum") v = r.reduce((s, x) => s + num(x[block.field]), 0);
  else if (block.agg === "avg") v = r.length ? r.reduce((s, x) => s + num(x[block.field]), 0) / r.length : 0;
  else v = r.length;
  const isCurrency = field?.type === "currency";
  const display = (isCurrency ? "$" : "") + (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1)) + (block.suffix || "");
  return (
    <div className="vg-card" style={{ ...card, padding: "18px 20px", ...(block.accent ? { background: "rgba(255,255,255,0.06)" } : {}) }}>
      {block.accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" }} />}
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 11 }}>{block.label}</div>
      <div style={{ fontFamily: MONO, fontSize: block.accent ? 34 : 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: block.danger && v > 0 ? RED : "#fff" }}>{display}</div>
    </div>
  );
}

function Breakdown({ block, rows }) {
  const data = groupCounts(applyFilter(rows, block.filter), block.group_by);
  if (block.chart === "donut") {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let acc = 0;
    const segs = data.map((d, i) => { const start = acc / total * 360; acc += d.value; return { ...d, color: PALETTE[i % PALETTE.length], start, end: acc / total * 360 }; });
    const grad = segs.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(",");
    return (
      <div className="vg-card" style={{ ...card, padding: 18 }}>
        <div style={lbl}>{block.label}</div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: `conic-gradient(${grad})`, position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: "24%", borderRadius: "50%", background: "#0c0d0e" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120 }}>
            {segs.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                <span className="vg-mono" style={{ fontFamily: MONO, fontWeight: 700, color: "#fff" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="vg-card" style={{ ...card, padding: 18 }}>
      <div style={lbl}>{block.label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {data.map((d, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700 }}>{d.value}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(d.value / max) * 100}%`, borderRadius: 3, background: i === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)", transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
            </div>
          </div>
        ))}
        {!data.length && <Empty />}
      </div>
    </div>
  );
}

function Trend({ block, rows }) {
  const buckets = {};
  rows.forEach(r => { const d = r[block.date_field]; if (!d) return; const day = String(d).slice(0, 10); buckets[day] = (buckets[day] || 0) + 1; });
  const pts = Object.entries(buckets).sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-14);
  const w = 520, h = 150, pad = 12;
  const ys = pts.map(p => p[1]); const max = Math.max(...ys, 1), min = Math.min(...ys, 0), span = (max - min) || 1;
  const coords = pts.map((p, i) => [pad + (i * (w - 2 * pad)) / Math.max(pts.length - 1, 1), h - pad - ((p[1] - min) / span) * (h - 2 * pad)]);
  const d = coords.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  return (
    <div className="vg-card" style={{ ...card, padding: 18 }}>
      <div style={lbl}>{block.label}</div>
      {pts.length < 2 ? <Empty /> : (
        <>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 150 }} preserveAspectRatio="none">
            <path d={`${d} L${coords[coords.length - 1][0].toFixed(1)},${h - pad} L${coords[0][0].toFixed(1)},${h - pad} Z`} fill="rgba(255,255,255,0.06)" />
            <path d={d} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
            <span>{pts[0]?.[0]?.slice(5)}</span><span>{pts[pts.length - 1]?.[0]?.slice(5)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function LowStock({ block, rows, entity }) {
  const low = rows.filter(r => num(r[block.qty_field]) <= num(r[block.reorder_field]));
  const nameKey = (entity.fields || [])[0]?.key;
  return (
    <div className="vg-card" style={{ ...card, padding: 18 }}>
      <div style={lbl}>{block.label}</div>
      {low.length === 0 ? (
        <div style={{ color: GREEN, fontSize: 13, padding: "14px 0" }}>✓ Everything's stocked.</div>
      ) : low.slice(0, 8).map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{String(r[nameKey] ?? "—")}</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: RED }}>{r[block.qty_field]} / {r[block.reorder_field]}</span>
        </div>
      ))}
    </div>
  );
}

function Recent({ block, rows, entity }) {
  const fields = (block.fields || (entity.fields || []).slice(0, 4).map(f => f.key));
  const fdefs = (entity.fields || []);
  const labelFor = k => fdefs.find(f => f.key === k)?.label || k;
  const data = rows.slice(0, block.limit || 6);
  return (
    <div className="vg-card" style={{ ...card, padding: 18 }}>
      <div style={lbl}>{block.label}</div>
      {data.length === 0 ? <Empty /> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr>{fields.map(k => <th key={k} style={{ textAlign: "left", padding: "0 10px 9px", fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{labelFor(k)}</th>)}</tr></thead>
          <tbody>{data.map((r, ri) => <tr key={ri}>{fields.map(k => <td key={k} style={{ padding: "9px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.82)" }}>{String(r[k] ?? "—")}</td>)}</tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

function Empty() {
  return <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.28)", fontSize: 13 }}>No data yet</div>;
}

export default function GenerativeDashboard({ company, entities, onNavigate }) {
  const [config, setConfig] = useState(null);
  const [recs, setRecs] = useState(null);
  const [regen, setRegen] = useState(false);
  const entById = Object.fromEntries(entities.map(e => [e.entity_id, e]));

  useEffect(() => {
    let alive = true;
    Promise.all(entities.map(e =>
      fetch(`${API}/records/${company.company_id}/${e.entity_id}`).then(r => r.json()).then(rows => [e.entity_id, Array.isArray(rows) ? rows : []]).catch(() => [e.entity_id, []])
    )).then(res => { if (alive) setRecs(Object.fromEntries(res)); });
    return () => { alive = false; };
  }, [company.company_id, entities]);

  useEffect(() => {
    let alive = true;
    setConfig(null);
    fetch(`${API}/entities/dashboard/${company.company_id}`).then(r => r.json())
      .then(d => { if (alive) setConfig(d.config || { title: "Overview", sections: [] }); })
      .catch(() => { if (alive) setConfig({ title: "Overview", sections: [] }); });
    return () => { alive = false; };
  }, [company.company_id]);

  const regenerate = async () => {
    setRegen(true);
    try { const d = await fetch(`${API}/entities/dashboard/${company.company_id}/regenerate`, { method: "POST" }).then(r => r.json()); if (d.config) setConfig(d.config); } catch {}
    setRegen(false);
  };

  if (config === null || recs === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "rgba(255,255,255,0.5)", gap: 14 }}>
        <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 20 }}>◴</span>
        <div style={{ fontSize: 14 }}>Designing {company.name}'s dashboard…</div>
      </div>
    );
  }

  const rowsFor = id => recs[id] || [];
  const renderBlock = (b, i) => {
    const entity = entById[b.entity];
    if (!entity) return null;
    const rows = rowsFor(b.entity);
    const field = (entity.fields || []).find(f => f.key === b.field);
    const inner =
      b.type === "metric" ? <Metric block={b} rows={rows} field={field} />
      : b.type === "breakdown" ? <Breakdown block={b} rows={rows} />
      : b.type === "trend" ? <Trend block={b} rows={rows} />
      : b.type === "lowstock" ? <LowStock block={b} rows={rows} entity={entity} />
      : b.type === "recent" ? <Recent block={b} rows={rows} entity={entity} />
      : null;
    return <div key={i} style={{ position: "relative", animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) both", animationDelay: `${i * 40}ms` }}>{inner}</div>;
  };

  const summary = entities.map(e => ({ entity: e.name_plural, count: (recs[e.entity_id] || []).length, low_stock: 0 }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageHeader title={config.title || "Overview"} subtitle={`${company.name} · designed for your operation`} />
        <button onClick={regenerate} disabled={regen} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: COLORS.muted, fontSize: 13, cursor: regen ? "not-allowed" : "pointer", marginTop: 4, fontFamily: "inherit" }}>
          {regen ? "Redesigning…" : "✦ Redesign"}
        </button>
      </div>

      <InsightBanner companyId={company.company_id} page="Overview" summary={summary} />

      {(config.sections || []).map((section, si) => (
        <div key={si} style={{ display: "grid", gridTemplateColumns: section.cols || "1fr", gap: 14, marginBottom: 14 }}>
          {(section.blocks || []).map(renderBlock)}
        </div>
      ))}

      {(!config.sections || config.sections.length === 0) && (
        <div style={{ ...card, padding: 40, textAlign: "center", color: COLORS.muted }}>Add some records, then hit ✦ Redesign and Viro will build your dashboard.</div>
      )}
    </div>
  );
}
