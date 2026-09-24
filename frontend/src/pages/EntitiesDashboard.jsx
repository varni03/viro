import { useState, useEffect } from "react";
import { COLORS, PageHeader, InsightBanner } from "../components/Layout";

const API = "https://viro1.vercel.app";
const MONO = "'JetBrains Mono', monospace";
const RED = "#ff5a5a", GREEN = "#34d399";

function stockFields(fields = []) {
  const qty = fields.find(f => f.type === "number" && /on_hand|stock|qty|quantity|inventory|count/i.test(f.key));
  const reorder = fields.find(f => f.type === "number" && /reorder|min|threshold|par/i.test(f.key));
  return qty && reorder ? { qty: qty.key, reorder: reorder.key } : null;
}

export default function EntitiesDashboard({ company, entities, onNavigate }) {
  const [data, setData] = useState({});

  useEffect(() => {
    let alive = true;
    Promise.all(entities.map(e =>
      fetch(`${API}/records/${company.company_id}/${e.entity_id}`)
        .then(r => r.json())
        .then(rows => {
          rows = Array.isArray(rows) ? rows : [];
          const sf = stockFields(e.fields);
          const low = sf ? rows.filter(r => Number(r[sf.qty]) <= Number(r[sf.reorder])).length : 0;
          return [e.entity_id, { count: rows.length, low, recent: rows.slice(0, 3), firstField: (e.fields || [])[0]?.key }];
        })
        .catch(() => [e.entity_id, { count: 0, low: 0, recent: [] }])
    )).then(res => { if (alive) setData(Object.fromEntries(res)); });
    return () => { alive = false; };
  }, [company.company_id, entities]);

  const summary = entities.map(e => ({ entity: e.name_plural || e.name, count: data[e.entity_id]?.count ?? 0, low_stock: data[e.entity_id]?.low ?? 0 }));

  return (
    <div>
      <PageHeader title="Overview" subtitle={`${company.name} · ${entities.length} ${entities.length === 1 ? "area" : "areas"} of your operation`} />

      <InsightBanner companyId={company.company_id} page="Overview" summary={summary} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {entities.map(e => {
          const d = data[e.entity_id] || {};
          const low = d.low || 0;
          return (
            <div key={e.entity_id} className="viro-btn" onClick={() => onNavigate(`entity:${e.entity_id}`)}
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${low ? RED + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: 20, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{e.icon || "▦"}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{e.name_plural || e.name}</div>
                </div>
                {low > 0 && <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: RED, background: RED + "1f", border: `1px solid ${RED}40`, padding: "3px 9px", borderRadius: 6 }}>{low} LOW</span>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.count ?? "—"}</span>
                <span style={{ fontSize: 12, color: COLORS.muted }}>{(e.name_plural || "records").toLowerCase()}</span>
              </div>
              {d.recent && d.recent.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  {d.recent.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span> {String(r[d.firstField] ?? "—")}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: low ? RED : GREEN }}>
                {low ? `${low} need attention →` : "Open →"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
