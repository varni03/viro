import { useState, useEffect, useMemo, useRef } from "react";
import { COLORS, PageHeader } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";
const RED = "#ff5a5a", GREEN = "#34d399";
const PALETTE = ["#ffffff", "#34d399", "#f0a83c", "#ff5a5a", "rgba(255,255,255,0.55)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.28)"];
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
const lbl = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontWeight: 600, marginBottom: 12 };
const num = v => { const n = Number(v); return isNaN(n) ? 0 : n; };

/* ── data helpers (all client-side, zero AI cost) ─────────────── */
function applyFilter(rows, f) {
  if (!f || !f.field) return rows;
  return rows.filter(r => String(r[f.field] ?? "").toLowerCase() === String(f.equals ?? "").toLowerCase());
}
function groupCounts(rows, key) {
  const m = {};
  rows.forEach(r => { const k = r[key] ?? "—"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([label, value]) => ({ label: String(label), value })).sort((a, b) => b.value - a.value).slice(0, 8);
}
function recDate(r) {
  const raw = r.created_at || "";
  const d = new Date(String(raw).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}
const RANGES = [["today", "Today", 1], ["7d", "7 days", 7], ["30d", "30 days", 30], ["all", "All", null]];
function inRange(r, range) {
  if (range === "all") return true;
  const days = RANGES.find(x => x[0] === range)?.[2];
  const d = recDate(r);
  if (!d || !days) return true;
  return (Date.now() - d.getTime()) < days * 86400000;
}
function sparkSeries(rows, days = 14) {
  const buckets = {};
  rows.forEach(r => { const d = recDate(r); if (d) { const k = d.toISOString().slice(0, 10); buckets[k] = (buckets[k] || 0) + 1; } });
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push(buckets[k] || 0);
  }
  return out;
}

/* ── tiny visuals ─────────────────────────────────────────────── */
// Numbers that count to their value — the dashboard feels alive.
function Tick({ v, format }) {
  const [disp, setDisp] = useState(v);
  const prev = useRef(v);
  useEffect(() => {
    const from = prev.current, to = v;
    prev.current = v;
    if (from === to) { setDisp(to); return; }
    const t0 = performance.now(), dur = 550;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisp(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  return <>{format(disp)}</>;
}

// The morning briefing — Viro writes your day before you ask (1 AI call/day, cached).
function Briefing({ company, user }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true); setText("");
    fetch(`${API}/ai/briefing/${company.company_id}`)
      .then(r => r.json())
      .then(d => { if (alive) { setText(d.briefing || ""); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [company.company_id]);

  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  if (!loading && !text) return null;
  return (
    <div style={{
      position: "relative", overflow: "hidden", marginBottom: 20, padding: "20px 22px",
      borderRadius: 18, background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)" }} />
      <div style={{ position: "absolute", top: -70, right: -40, width: 220, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{dateStr} · Briefing</div>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
        {greet}{user?.first_name ? `, ${user.first_name}` : ""}.
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: "rgba(255,255,255,0.4)", fontSize: 13.5 }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◴</span> Reading your operation…
        </div>
      ) : (
        <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "rgba(255,255,255,0.85)", maxWidth: 760 }}>
          <span style={{ color: "rgba(255,255,255,0.45)", marginRight: 8 }}>✦</span>{text}
        </div>
      )}
    </div>
  );
}

function Spark({ series }) {
  if (!series.some(v => v > 0)) return null;
  const w = 120, h = 26, max = Math.max(...series, 1);
  const coords = series.map((v, i) => [(i / (series.length - 1)) * w, h - (v / max) * (h - 4) - 1]);
  const pts = coords.map(c => c.join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 22, marginTop: 10 }} preserveAspectRatio="none">
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="rgba(255,255,255,0.07)" />
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2" fill="#fff" />
    </svg>
  );
}
function Empty() {
  return <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.28)", fontSize: 13 }}>No data in this range</div>;
}

/* ── blocks (Overview) ────────────────────────────────────────── */
function Metric({ block, rows, field, onDrill }) {
  const r = applyFilter(rows, block.filter);
  let v = 0;
  if (block.agg === "sum") v = r.reduce((s, x) => s + num(x[block.field]), 0);
  else if (block.agg === "avg") v = r.length ? r.reduce((s, x) => s + num(x[block.field]), 0) / r.length : 0;
  else v = r.length;
  const isCurrency = field?.type === "currency";
  const fmt = (x) => (isCurrency ? "$" : "") + (Number.isInteger(v) ? Math.round(x).toLocaleString() : x.toFixed(1)) + (block.suffix || "");
  return (
    <div className="vg-card" onClick={() => onDrill(block.label, r)} style={{ ...card, padding: "18px 20px", cursor: "pointer", position: "relative", overflow: "hidden", ...(block.accent ? { background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" } : {}) }}>
      {block.accent && <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)" }} />
        <div style={{ position: "absolute", top: -50, right: -30, width: 140, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(36px)", pointerEvents: "none" }} />
      </>}
      {block.danger && v > 0 && <div style={{ position: "absolute", top: -50, right: -30, width: 140, height: 120, borderRadius: "50%", background: RED + "22", filter: "blur(36px)", pointerEvents: "none" }} />}
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 11 }}>{block.label}</div>
      <div style={{ fontFamily: MONO, fontSize: block.accent ? 34 : 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: block.danger && v > 0 ? RED : "#fff" }}>
        <Tick v={v} format={fmt} />
      </div>
      <Spark series={sparkSeries(r)} />
    </div>
  );
}
function Breakdown({ block, rows, onDrill }) {
  const scoped = applyFilter(rows, block.filter);
  const data = groupCounts(scoped, block.group_by);
  const drillSeg = (label) => onDrill(`${block.label} · ${label}`, scoped.filter(r => String(r[block.group_by] ?? "—") === label));
  if (block.chart === "donut") {
    const total = data.reduce((s, d) => s + d.value, 0);
    const R = 44, C = 2 * Math.PI * R;
    let acc = 0;
    const segs = data.map((d, i) => {
      const frac = total ? d.value / total : 0;
      const seg = { ...d, color: PALETTE[i % PALETTE.length], frac, offset: acc };
      acc += frac;
      return seg;
    });
    return (
      <div className="vg-card" style={{ ...card, padding: 18 }}>
        <div style={lbl}>{block.label}</div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="11" />
              {segs.map((s, i) => (
                <circle key={i} cx="60" cy="60" r={R} fill="none" stroke={s.color} strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(s.frac * C - 4, 0.6)} ${C}`}
                  strokeDashoffset={-(s.offset * C)}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dasharray .8s cubic-bezier(.16,1,.3,1), stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)" }} />
              ))}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{total}</span>
              <span style={{ fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>total</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120 }}>
            {segs.map((s, i) => (
              <div key={i} onClick={() => drillSeg(s.label)} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: "#fff" }}>{s.value}</span>
              </div>
            ))}
            {!data.length && <Empty />}
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
          <div key={i} onClick={() => drillSeg(d.label)} style={{ cursor: "pointer" }}>
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
function Trend({ block, rows, drawKey }) {
  const gid = useMemo(() => "tg" + Math.abs([...(block.label || "t")].reduce((a, c) => a + c.charCodeAt(0), 0)), [block.label]);
  const buckets = {};
  rows.forEach(r => { const d = r[block.date_field] || r.created_at; if (!d) return; const day = String(d).slice(0, 10); buckets[day] = (buckets[day] || 0) + 1; });
  const pts = Object.entries(buckets).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-14);
  const w = 520, h = 150, pad = 12;
  const ys = pts.map(p => p[1]); const max = Math.max(...ys, 1), min = Math.min(...ys, 0), span = (max - min) || 1;
  const coords = pts.map((p, i) => [pad + (i * (w - 2 * pad)) / Math.max(pts.length - 1, 1), h - pad - ((p[1] - min) / span) * (h - 2 * pad)]);
  const d = coords.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  return (
    <div className="vg-card" style={{ ...card, padding: 18 }}>
      <div style={lbl}>{block.label}</div>
      {pts.length < 2 ? <Empty /> : (
        <>
          <svg key={drawKey} viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 150 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <filter id={gid + "glow"} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.55" />
              </filter>
            </defs>
            <path d={`${d} L${last[0].toFixed(1)},${h - pad} L${coords[0][0].toFixed(1)},${h - pad} Z`} fill={`url(#${gid})`} />
            <path d={d} className="vg-draw" pathLength="1" fill="none" stroke="#fff" strokeWidth="2"
              vectorEffect="non-scaling-stroke" filter={`url(#${gid}glow)`} strokeLinecap="round" />
            <circle cx={last[0]} cy={last[1]} r="3.5" fill="#fff" filter={`url(#${gid}glow)`} />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
            <span>{pts[0]?.[0]?.slice(5)}</span><span>{pts[pts.length - 1]?.[0]?.slice(5)}</span>
          </div>
        </>
      )}
    </div>
  );
}
function LowStock({ block, rows, entity, onDrill }) {
  const low = rows.filter(r => num(r[block.qty_field]) <= num(r[block.reorder_field]));
  const nameKey = (entity.fields || [])[0]?.key;
  return (
    <div className="vg-card" style={{ ...card, padding: 18 }}>
      <div style={lbl}>{block.label}</div>
      {low.length === 0 ? (
        <div style={{ color: GREEN, fontSize: 13, padding: "14px 0" }}>✓ Everything's stocked.</div>
      ) : low.slice(0, 8).map((r, i) => (
        <div key={i} onClick={() => onDrill(block.label, low)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{String(r[nameKey] ?? "—")}</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: RED }}>{r[block.qty_field]} / {r[block.reorder_field]}</span>
        </div>
      ))}
    </div>
  );
}
function Recent({ block, rows, entity, onDrill }) {
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
          <tbody>{data.map((r, ri) => (
            <tr key={ri} onClick={() => onDrill(block.label, rows)} style={{ cursor: "pointer" }}>
              {fields.map(k => <td key={k} style={{ padding: "9px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.82)" }}>{String(r[k] ?? "—")}</td>)}
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

/* ── Board view: auto-kanban over any select field, drag to move ── */
function BoardView({ entities, recsFor, onDrill, onMove }) {
  const candidates = useMemo(() => entities
    .map(e => ({ e, sel: (e.fields || []).find(f => f.type === "select" && (f.options || []).length) }))
    .filter(c => c.sel), [entities]);
  const [pick, setPick] = useState(0);
  if (!candidates.length) {
    return <div style={{ ...card, padding: 40, textAlign: "center", color: COLORS.muted }}>
      Board view needs an entity with a status-style dropdown field (e.g. Orders with a Status). None found yet.
    </div>;
  }
  const { e, sel } = candidates[Math.min(pick, candidates.length - 1)];
  const rows = recsFor(e.entity_id);
  const nameKey = (e.fields || [{}])[0]?.key;
  const moneyKey = (e.fields || []).find(f => f.type === "currency")?.key;
  const cols = sel.options || [];
  return (
    <div>
      {candidates.length > 1 && (
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
          {candidates.map((c, i) => (
            <button key={i} onClick={() => setPick(i)} className="vg-pill-btn" style={{
              background: i === pick ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${i === pick ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
              color: i === pick ? "#fff" : "rgba(255,255,255,0.55)" }}>
              {c.e.icon} {c.e.name_plural || c.e.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 12 }}>
        {cols.map(col => {
          const colRows = rows.filter(r => String(r[sel.key] ?? "") === col);
          return (
            <div key={col}
              onDragOver={ev => ev.preventDefault()}
              onDrop={ev => { ev.preventDefault(); const rid = ev.dataTransfer.getData("rid"); if (rid) onMove(e, rid, sel.key, col); }}>
              <div style={{ ...card, borderRadius: "12px 12px 0 0", padding: "12px 15px", borderBottom: "2px solid rgba(255,255,255,0.16)" }}>
                <div style={{ ...lbl, marginBottom: 3 }}>{col}</div>
                <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700 }}>{colRows.length}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 8, minHeight: 180 }}>
                {colRows.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.22)", fontSize: 12 }}>Drop here</div>
                ) : colRows.map((r, i) => (
                  <div key={r.record_id || i} draggable
                    onDragStart={ev => ev.dataTransfer.setData("rid", r.record_id)}
                    onClick={() => onDrill(`${e.name_plural} · ${col}`, colRows)}
                    className="viro-btn"
                    style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "10px 12px", marginBottom: 6, cursor: "grab" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: moneyKey ? 4 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(r[nameKey] ?? "—")}</div>
                    {moneyKey && <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>${num(r[moneyKey]).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>Drag a card between columns to update its {sel.label?.toLowerCase() || "status"}.</div>
    </div>
  );
}

/* ── Data view: dense sortable/filterable explorer ─────────────── */
function DataView({ entities, recsFor, onDrill }) {
  const [pick, setPick] = useState(0);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const e = entities[Math.min(pick, entities.length - 1)];
  if (!e) return null;
  const fields = (e.fields || []).slice(0, 6);
  let rows = recsFor(e.entity_id);
  const needle = filter.trim().toLowerCase();
  if (needle) rows = rows.filter(r => fields.some(f => String(r[f.key] ?? "").toLowerCase().includes(needle)));
  if (sort.key) {
    rows = [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      const an = Number(av), bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * sort.dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * sort.dir;
    });
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {entities.map((x, i) => (
          <button key={x.entity_id} onClick={() => { setPick(i); setSort({ key: null, dir: 1 }); }} className="vg-pill-btn" style={{
            background: i === pick ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${i === pick ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
            color: i === pick ? "#fff" : "rgba(255,255,255,0.55)" }}>
            {x.icon} {x.name_plural || x.name}
          </button>
        ))}
        <input value={filter} onChange={ev => setFilter(ev.target.value)} placeholder="Filter…"
          style={{ marginLeft: "auto", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "8px 13px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit", width: 200 }} />
      </div>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {fields.map(f => (
                <th key={f.key} onClick={() => setSort(s => ({ key: f.key, dir: s.key === f.key ? -s.dir : 1 }))}
                  style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: sort.key === f.key ? "#fff" : "rgba(255,255,255,0.32)", textAlign: "left", padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                  {f.label}{sort.key === f.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={fields.length} style={{ padding: 26, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Nothing here</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.record_id || i} className="vdyn-row" onClick={() => onDrill(e.name_plural || e.name, [r])} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                  {fields.map((f, ci) => (
                    <td key={f.key} style={{ padding: "11px 15px", color: ci === 0 ? "#fff" : "rgba(255,255,255,0.72)", fontWeight: ci === 0 ? 600 : 400, fontFamily: (f.type === "number" || f.type === "currency") ? MONO : "inherit" }}>
                      {f.type === "currency" && r[f.key] !== undefined && r[f.key] !== "" ? "$" + num(r[f.key]).toLocaleString() : String(r[f.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>{rows.length} rows · click a header to sort</div>
    </div>
  );
}

/* ── styles ───────────────────────────────────────────────────── */
const VG_STYLE = "viro-vg-styles";
function ensureVgStyles() {
  if (typeof document === "undefined" || document.getElementById(VG_STYLE)) return;
  const el = document.createElement("style");
  el.id = VG_STYLE;
  el.textContent = `
    .vg-block{position:relative}
    .vg-card{transition:border-color .2s ease,background .2s ease,transform .2s cubic-bezier(.16,1,.3,1)}
    .vg-block:hover .vg-card{border-color:rgba(255,255,255,0.14)}
    .vg-ask{position:absolute;top:11px;right:11px;z-index:3;width:24px;height:24px;border-radius:7px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:11px;background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);opacity:0;transition:opacity .18s ease}
    .vg-block:hover .vg-ask{opacity:1}
    .vg-ask:hover{background:rgba(255,255,255,0.16);color:#fff}
    .vg-overlay{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:24px}
    .vg-modal{width:460px;max-width:100%;background:rgba(20,21,23,0.97);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,0.5)}
    .vg-pill-btn{border-radius:9px;padding:7px 13px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease;white-space:nowrap}
    @keyframes vg-slide{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
    .vg-drill{position:fixed;top:0;right:0;bottom:0;width:440px;max-width:92vw;z-index:120;
      background:rgba(16,17,19,0.98);border-left:1px solid rgba(255,255,255,0.12);
      box-shadow:-30px 0 80px rgba(0,0,0,0.5);display:flex;flex-direction:column;
      animation:vg-slide .28s cubic-bezier(.16,1,.3,1)}
  `;
  document.head.appendChild(el);
}

/* ── main ─────────────────────────────────────────────────────── */
export default function GenerativeDashboard({ company, entities, onNavigate, nonce, user }) {
  const [config, setConfig] = useState(null);
  const [recs, setRecs] = useState(null);
  const [regen, setRegen] = useState(false);
  const [ask, setAsk] = useState(null);
  const [view, setView] = useState("overview");
  const [range, setRange] = useState("all");
  const [drill, setDrill] = useState(null); // { title, rows, entity }
  const [lastSync, setLastSync] = useState(null);
  const entById = Object.fromEntries(entities.map(e => [e.entity_id, e]));

  useEffect(() => { ensureVgStyles(); }, []);

  // Live data — loads immediately, then silently refreshes every 60s.
  useEffect(() => {
    let alive = true;
    const load = () => Promise.all(entities.map(e =>
      fetch(`${API}/records/${company.company_id}/${e.entity_id}`).then(r => r.json()).then(rows => [e.entity_id, Array.isArray(rows) ? rows : []]).catch(() => [e.entity_id, []])
    )).then(res => { if (alive) { setRecs(Object.fromEntries(res)); setLastSync(new Date()); } });
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [company.company_id, entities]);

  useEffect(() => {
    let alive = true;
    setConfig(null);
    fetch(`${API}/entities/dashboard/${company.company_id}`).then(r => r.json())
      .then(d => { if (alive) setConfig(d.config || { title: "Overview", sections: [] }); })
      .catch(() => { if (alive) setConfig({ title: "Overview", sections: [] }); });
    return () => { alive = false; };
  }, [company.company_id, nonce]);

  const regenerate = async () => {
    setRegen(true);
    try { const d = await fetch(`${API}/entities/dashboard/${company.company_id}/regenerate`, { method: "POST" }).then(r => r.json()); if (d.config) setConfig(d.config); } catch {}
    setRegen(false);
  };

  const runAsk = () => {
    if (!ask) return;
    setAsk(a => ({ ...a, loading: true, answer: null }));
    fetch(`${API}/ai/card-action`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: company.company_id, action: "explain", label: ask.label, summary: ask.summary }),
    }).then(r => r.json())
      .then(res => setAsk(a => ({ ...a, loading: false, answer: res.answer || "No response." })))
      .catch(() => setAsk(a => ({ ...a, loading: false, answer: "Couldn't reach the AI service." })));
  };

  // Board drag → persist the status change (optimistic).
  const moveRecord = (entity, recordId, key, value) => {
    setRecs(prev => {
      const rows = (prev[entity.entity_id] || []).map(r => r.record_id === recordId ? { ...r, [key]: value } : r);
      return { ...prev, [entity.entity_id]: rows };
    });
    const row = (recs[entity.entity_id] || []).find(r => r.record_id === recordId);
    if (!row) return;
    const data = {};
    (entity.fields || []).forEach(f => { if (row[f.key] !== undefined) data[f.key] = row[f.key]; });
    data[key] = value;
    fetch(`${API}/records/${recordId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) }).catch(() => {});
  };

  if (config === null || recs === null) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite", color: "rgba(255,255,255,0.5)" }}>◴</span>
          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)" }}>Designing {company.name}'s dashboard…</span>
        </div>
        <div className="vg-skel" style={{ height: 96, marginBottom: 18 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 14 }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="vg-skel" style={{ height: 108, animationDelay: `${i * 120}ms` }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <div className="vg-skel" style={{ height: 220 }} />
          <div className="vg-skel" style={{ height: 220, animationDelay: "160ms" }} />
        </div>
      </div>
    );
  }

  const scopedFor = (id) => (recs[id] || []).filter(r => inRange(r, range));
  const openDrill = (entity) => (title, rows) => setDrill({ title, rows, entity });

  const renderBlock = (b, i) => {
    const entity = entById[b.entity];
    if (!entity) return null;
    const rows = scopedFor(b.entity);
    const field = (entity.fields || []).find(f => f.key === b.field);
    const drillFn = openDrill(entity);
    const inner =
      b.type === "metric" ? <Metric block={b} rows={rows} field={field} onDrill={drillFn} />
      : b.type === "breakdown" ? <Breakdown block={b} rows={rows} onDrill={drillFn} />
      : b.type === "trend" ? <Trend block={b} rows={rows} drawKey={range} />
      : b.type === "lowstock" ? <LowStock block={b} rows={rows} entity={entity} onDrill={drillFn} />
      : b.type === "recent" ? <Recent block={b} rows={rows} entity={entity} onDrill={drillFn} />
      : null;
    if (!inner) return null;
    return (
      <div key={i} className="vg-block" style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) both", animationDelay: `${i * 40}ms` }}>
        {inner}
        <button className="vg-ask" title="Ask about this"
          onClick={(ev) => { ev.stopPropagation(); setAsk({ label: b.label || entity.name_plural, summary: { block: b, entity: entity.name, rows: rows.slice(0, 12) }, loading: false, answer: null }); }}>✦</button>
      </div>
    );
  };

  // Contextual quick actions — the obvious next moves, one tap away.
  const lowTotal = entities.reduce((sum, e) => {
    const fs = e.fields || [];
    const qf = fs.find(f => f.type === "number" && /on_hand|stock|qty|quantity|inventory|count/i.test(f.key));
    const rf = fs.find(f => f.type === "number" && /reorder|min|threshold|par/i.test(f.key));
    if (!qf || !rf) return sum;
    return sum + (recs[e.entity_id] || []).filter(r => num(r[qf.key]) <= num(r[rf.key])).length;
  }, 0);
  const drillEntityFields = drill?.entity ? (drill.entity.fields || []).slice(0, 4) : [];

  const Tab = ({ id, label }) => (
    <button onClick={() => setView(id)} className="vg-pill-btn" style={{
      background: view === id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${view === id ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
      color: view === id ? "#fff" : "rgba(255,255,255,0.55)" }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <PageHeader title={config.title || "Overview"} subtitle={`${company.name} · designed for your operation`} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          {lastSync && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
              LIVE · {String(lastSync.getHours()).padStart(2, "0")}:{String(lastSync.getMinutes()).padStart(2, "0")}:{String(lastSync.getSeconds()).padStart(2, "0")}
            </span>
          )}
          <button onClick={regenerate} disabled={regen} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: COLORS.muted, fontSize: 13, cursor: regen ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {regen ? "Redesigning…" : "✦ Redesign"}
          </button>
        </div>
      </div>

      {/* navigation strip: views + time scope */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
        <Tab id="overview" label="Overview" />
        <Tab id="board" label="Board" />
        <Tab id="data" label="Data" />
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 3 }}>
          {RANGES.map(([id, label]) => (
            <button key={id} onClick={() => setRange(id)} style={{
              background: range === id ? "rgba(255,255,255,0.1)" : "transparent", border: "none", borderRadius: 7,
              padding: "6px 11px", color: range === id ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 12,
              fontWeight: range === id ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>
      </div>

      {view === "overview" && (
        <>
          <Briefing company={company} user={user} />

          {/* quick actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {lowTotal > 0 && (
              <button onClick={() => onNavigate("Automations")} className="vg-pill-btn" style={{
                background: RED + "1a", border: `1px solid ${RED}44`, color: RED, fontWeight: 700 }}>
                ✦ Draft reorder — {lowTotal} low
              </button>
            )}
            {entities.slice(0, 5).map(e => (
              <button key={e.entity_id} onClick={() => onNavigate(`entity:${e.entity_id}`)} className="vg-pill-btn" style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.6)" }}>
                ＋ {e.name}
              </button>
            ))}
          </div>
          {(config.sections || []).map((section, si) => (
            <div key={si} style={{ display: "grid", gridTemplateColumns: section.cols || "1fr", gap: 14, marginBottom: 14 }}>
              {(section.blocks || []).map(renderBlock)}
            </div>
          ))}
          {(!config.sections || config.sections.length === 0) && (
            <div style={{ ...card, padding: 40, textAlign: "center", color: COLORS.muted }}>Add some records, then hit ✦ Redesign and Viro will build your dashboard.</div>
          )}
        </>
      )}

      {view === "board" && <BoardView entities={entities} recsFor={scopedFor} onDrill={(t, rows) => setDrill({ title: t, rows, entity: null })} onMove={moveRecord} />}
      {view === "data" && <DataView entities={entities} recsFor={scopedFor} onDrill={(t, rows) => setDrill({ title: t, rows, entity: null })} />}

      {/* drill-down slide-over */}
      {drill && (
        <>
          <div onClick={() => setDrill(null)} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.4)" }} />
          <div className="vg-drill">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{drill.title}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{drill.rows.length} {drill.rows.length === 1 ? "record" : "records"} · {RANGES.find(r => r[0] === range)?.[1]}</div>
              </div>
              <span onClick={() => setDrill(null)} style={{ cursor: "pointer", color: COLORS.muted, fontSize: 16 }}>✕</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {drill.rows.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: 30 }}>Nothing in this slice.</div>
              ) : drill.rows.map((r, i) => {
                const ent = drill.entity || entities.find(e => (recs[e.entity_id] || []).some(x => x.record_id === r.record_id));
                const fs = (ent?.fields || []).slice(0, 4);
                return (
                  <div key={r.record_id || i} style={{ ...card, padding: "12px 14px", marginBottom: 8 }}>
                    {fs.map(f => (
                      <div key={f.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
                        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", paddingTop: 2 }}>{f.label}</span>
                        <span style={{ fontSize: 13, color: "#fff", textAlign: "right", fontFamily: (f.type === "number" || f.type === "currency") ? MONO : "inherit" }}>
                          {f.type === "currency" && r[f.key] !== undefined && r[f.key] !== "" ? "$" + num(r[f.key]).toLocaleString() : String(r[f.key] ?? "—")}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 9, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setAsk({ label: drill.title, summary: { rows: drill.rows.slice(0, 15) }, loading: false, answer: null })}
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✦ Explain this slice</button>
              {(drill.entity || entities[0]) && (
                <button onClick={() => { onNavigate(`entity:${(drill.entity || entities[0]).entity_id}`); setDrill(null); }}
                  style={{ flex: 1, background: "#fff", border: "none", borderRadius: 10, padding: "11px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Open page →</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* explain modal */}
      {ask && (
        <div className="vg-overlay" onClick={() => setAsk(null)}>
          <div className="vg-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{ask.label}</div>
              <span onClick={() => setAsk(null)} style={{ cursor: "pointer", color: COLORS.muted, fontSize: 16 }}>✕</span>
            </div>
            {!ask.answer && !ask.loading && (
              <button onClick={runAsk} style={{ width: "100%", background: "#fff", border: "none", borderRadius: 10, padding: "12px", color: "#08090a", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Explain this</button>
            )}
            {ask.loading && <div style={{ display: "flex", alignItems: "center", gap: 9, color: COLORS.muted, fontSize: 13.5, padding: "8px 0" }}><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◴</span> Thinking…</div>}
            {ask.answer && <div style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{ask.answer}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
