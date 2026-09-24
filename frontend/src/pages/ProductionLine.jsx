import { useState, useEffect } from "react";
import { getProductionLine, getDefects, resolveDefect, updateStage, updateStatus } from "../api/client";
import { COLORS, PageHeader, severityColor, InsightBanner } from "../components/Layout";

const API = "https://viro1.vercel.app";
const MONO = "'JetBrains Mono', monospace";
const fetchStages = (companyId) => fetch(`${API}/stages/${companyId}`).then(r => r.json());

const statusColor = (s) => ({
  completed: COLORS.low, in_progress: "#e4e4e7", on_hold: COLORS.medium, flagged: COLORS.critical,
}[s] || COLORS.muted);

const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
const eyebrow = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontWeight: 600 };

export default function ProductionLine({ company, user, defaultView }) {
  const [view, setView] = useState(defaultView || (user?.role === "repair" ? "queue" : "pipeline"));
  const [vehicles, setVehicles] = useState([]);
  const [allDefects, setAllDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleDefects, setVehicleDefects] = useState([]);
  const [resolving, setResolving] = useState({});
  const [filter, setFilter] = useState("all");
  const [stages, setStages] = useState([]);
  const [stageMap, setStageMap] = useState({});

  const load = async () => {
    if (!company) return;
    try {
      const [lineRes, defectRes, stageRes] = await Promise.all([
        getProductionLine(company.company_id), getDefects(company.company_id), fetchStages(company.company_id),
      ]);
      setVehicles(lineRes.data);
      setAllDefects(defectRes.data.filter(d => d.resolved === 0));
      setStages(stageRes.map(s => s.stage_number));
      setStageMap(stageRes.reduce((acc, s) => { acc[s.stage_number] = s.stage_name; return acc; }, {}));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [company]);

  const selectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    try { const res = await getDefects(company.company_id, vehicle.product_id); setVehicleDefects(res.data.filter(d => d.resolved === 0)); } catch {}
  };
  const handleResolve = async (defectId) => {
    setResolving(p => ({ ...p, [defectId]: true }));
    try { await resolveDefect(defectId); setAllDefects(p => p.filter(d => d.defect_id !== defectId)); setVehicleDefects(p => p.filter(d => d.defect_id !== defectId)); load(); } catch {}
    setResolving(p => ({ ...p, [defectId]: false }));
  };
  const handleStageUpdate = async (vehicle, newStage) => {
    try { await updateStage(vehicle.product_id, newStage, company.company_id); load(); if (selectedVehicle?.product_id === vehicle.product_id) setSelectedVehicle(p => ({ ...p, current_stage: newStage })); } catch {}
  };
  const handleStatusUpdate = async (vehicle, newStatus) => {
    try { await updateStatus(vehicle.product_id, newStatus, company.company_id); load(); } catch {}
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>Loading…</div>;

  const TERM = (company?.universal_id_field || "vehicle").toLowerCase();
  const TERMS = TERM.replace(/y$/, "ie") + "s";
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  const idLabel = (id) => (id.includes("_") ? id.split("_").pop() : id);
  const filteredDefects = filter === "all" ? allDefects : allDefects.filter(d => d.severity === filter);
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedDefects = [...filteredDefects].sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));
  const vehiclesByStage = stages.reduce((acc, stage) => {
    acc[stage] = vehicles.filter(v => v.current_stage === stage)
      .sort((a, b) => (b.critical_open || 0) - (a.critical_open || 0) || (b.open_defects || 0) - (a.open_defects || 0));
    return acc;
  }, {});
  const criticalCount = allDefects.filter(d => d.severity === "critical").length;
  const highCount = allDefects.filter(d => d.severity === "high").length;

  const Tab = ({ id, label }) => (
    <button onClick={() => setView(id)} style={{
      background: view === id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${view === id ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 9, padding: "8px 15px", color: view === id ? "#fff" : "rgba(255,255,255,0.55)",
      fontSize: 13, fontWeight: view === id ? 600 : 500, cursor: "pointer", fontFamily: "inherit",
      transition: "all .15s ease",
    }}>{label}</button>
  );

  return (
    <div>
      <PageHeader title="Production Line" subtitle={`${company.name} · ${vehicles.length} active ${TERMS} · ${allDefects.length} open defects`} />

      <InsightBanner companyId={company.company_id} page="Production Line"
        summary={{ active: vehicles.length, open_defects: allDefects.length, critical: criticalCount, high: highCount,
          pipeline: stages.map(s => ({ stage: s, name: stageMap[s], count: (vehiclesByStage[s] || []).length, blocked: (vehiclesByStage[s] || []).filter(v => v.critical_open > 0).length })) }} />

      {/* summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: `Active ${cap(TERMS)}`, value: vehicles.length, color: "#fff" },
          { label: "Open Defects", value: allDefects.length, color: allDefects.length ? COLORS.high : COLORS.low },
          { label: "Critical", value: criticalCount, color: criticalCount ? COLORS.critical : COLORS.low, hot: criticalCount > 0 },
          { label: "High Priority", value: highCount, color: highCount ? COLORS.high : COLORS.low },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: "16px 18px", borderColor: m.hot ? COLORS.critical + "44" : "rgba(255,255,255,0.08)" }}>
            <div style={{ ...eyebrow, marginBottom: 9 }}>{m.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* view toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {user?.role !== "repair" && <Tab id="pipeline" label="Pipeline" />}
        <Tab id="queue" label={`Repair Queue${allDefects.length ? ` · ${allDefects.length}` : ""}`} />
        {user?.role !== "repair" && <Tab id="list" label="List" />}
        <button onClick={load} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "8px 14px", color: COLORS.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
      </div>

      {/* REPAIR QUEUE */}
      {view === "queue" && (
        <div>
          <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "critical", "high", "medium", "low"].map(f => {
              const active = filter === f;
              const c = f === "all" ? "#fff" : severityColor(f);
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: active ? (f === "all" ? "rgba(255,255,255,0.1)" : c + "1f") : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? (f === "all" ? "rgba(255,255,255,0.16)" : c + "55") : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 30, padding: "6px 14px", color: active ? c : COLORS.muted,
                  fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
                }}>{f}{f !== "all" && ` · ${allDefects.filter(d => d.severity === f).length}`}</button>
              );
            })}
          </div>
          {sortedDefects.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: "44px 0", color: COLORS.low, fontSize: 15 }}>✓ No open defects — the line is clear.</div>
          ) : sortedDefects.map((d, i) => {
            const sc = severityColor(d.severity);
            return (
              <div key={i} style={{ ...card, padding: "15px 18px", marginBottom: 8,
                borderColor: d.severity === "critical" ? COLORS.critical + "44" : d.severity === "high" ? COLORS.high + "33" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: sc + "1f", border: `1px solid ${sc}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: sc, boxShadow: `0 0 8px ${sc}` }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, textTransform: "capitalize", marginBottom: 3 }}>{d.defect_type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>
                      <span style={{ fontFamily: MONO }}>{d.product_id}</span> · Stage {d.stage_number} — {stageMap[d.stage_number] || "—"}
                    </div>
                    {d.notes && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontStyle: "italic", marginTop: 3 }}>"{d.notes}"</div>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <span style={{ ...eyebrow, color: sc, background: sc + "1f", border: `1px solid ${sc}40`, padding: "3px 9px", borderRadius: 6 }}>{d.severity}</span>
                  <button onClick={() => handleResolve(d.defect_id)} disabled={resolving[d.defect_id]} style={{
                    background: resolving[d.defect_id] ? "rgba(255,255,255,0.08)" : COLORS.low, border: "none", borderRadius: 9,
                    padding: "8px 15px", color: "#08090a", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {resolving[d.defect_id] ? "Resolving…" : "✓ Mark Fixed"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PIPELINE */}
      {view === "pipeline" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length || 1}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {stages.map(stage => {
              const list = vehiclesByStage[stage] || [];
              const hot = list.some(v => v.critical_open > 0);
              return (
                <div key={stage}>
                  <div style={{ ...card, borderRadius: "12px 12px 0 0", padding: "13px 15px", borderBottom: `2px solid ${hot ? COLORS.critical : "rgba(255,255,255,0.16)"}` }}>
                    <div style={eyebrow}>STAGE {stage}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, margin: "4px 0 3px" }}>{stageMap[stage]}</div>
                    <div style={{ fontSize: 11, color: hot ? COLORS.critical : COLORS.muted, fontWeight: hot ? 600 : 400 }}>
                      {list.length} {list.length === 1 ? TERM : TERMS}{hot ? " · blocked" : ""}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 8, minHeight: 200 }}>
                    {list.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "22px 0", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Empty</div>
                    ) : list.map((v, i) => {
                      const sel = selectedVehicle?.product_id === v.product_id;
                      const crit = v.critical_open > 0;
                      return (
                        <div key={i} className="viro-btn" onClick={() => selectVehicle(v)} style={{
                          background: sel ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${crit ? COLORS.critical + "55" : sel ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 10, padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}>
                          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, marginBottom: crit || v.open_defects === 0 ? 6 : 0 }}>{idLabel(v.product_id)}</div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {crit && <span style={{ ...eyebrow, color: COLORS.critical, background: COLORS.critical + "1f", border: `1px solid ${COLORS.critical}40`, padding: "2px 7px", borderRadius: 5 }}>{v.critical_open} CRIT</span>}
                            {v.open_defects === 0 && <span style={{ ...eyebrow, color: COLORS.low, background: COLORS.low + "1f", padding: "2px 7px", borderRadius: 5 }}>✓ CLEAN</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedVehicle && (
            <div style={{ ...card, background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.14)", padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{selectedVehicle.product_id}</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <Chip color="#e4e4e7">Stage {selectedVehicle.current_stage} — {stageMap[selectedVehicle.current_stage]}</Chip>
                    <Chip color={statusColor(selectedVehicle.status)}>{selectedVehicle.status?.replace("_", " ")}</Chip>
                    <Chip color={selectedVehicle.open_defects > 0 ? COLORS.high : COLORS.low}>{selectedVehicle.open_defects} open</Chip>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedVehicle.current_stage !== stages[stages.length - 1] && (
                    <button onClick={() => { const idx = stages.indexOf(selectedVehicle.current_stage); handleStageUpdate(selectedVehicle, stages[idx + 1]); }}
                      disabled={selectedVehicle.critical_open > 0} style={{
                        background: selectedVehicle.critical_open > 0 ? "rgba(255,255,255,0.08)" : "#fff", border: "none", borderRadius: 10,
                        padding: "10px 18px", color: "#08090a", fontWeight: 700, fontSize: 13,
                        cursor: selectedVehicle.critical_open > 0 ? "not-allowed" : "pointer", opacity: selectedVehicle.critical_open > 0 ? 0.5 : 1 }}>
                      Advance → {stageMap[stages[stages.indexOf(selectedVehicle.current_stage) + 1]]}
                    </button>
                  )}
                  {selectedVehicle.current_stage === stages[stages.length - 1] && (
                    <button onClick={() => handleStatusUpdate(selectedVehicle, "completed")} style={{ background: COLORS.low, border: "none", borderRadius: 10, padding: "10px 18px", color: "#08090a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✓ Approve to Ship</button>
                  )}
                  <button onClick={() => setSelectedVehicle(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: COLORS.muted, cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              </div>
              <div style={{ ...eyebrow, marginBottom: 12 }}>Open Defects</div>
              {vehicleDefects.length === 0 ? (
                <div style={{ background: COLORS.low + "15", border: `1px solid ${COLORS.low}33`, borderRadius: 10, padding: 16, color: COLORS.low, textAlign: "center", fontSize: 14 }}>✓ No open defects — clear to advance</div>
              ) : vehicleDefects.map((d, i) => {
                const sc = severityColor(d.severity);
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${d.severity === "critical" ? COLORS.critical + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc, boxShadow: `0 0 6px ${sc}` }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, textTransform: "capitalize" }}>{d.defect_type.replace(/_/g, " ")}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>Stage {d.stage_number} · {new Date(d.logged_at).toLocaleDateString()}{d.notes && ` · ${d.notes}`}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ ...eyebrow, color: sc, background: sc + "1f", border: `1px solid ${sc}40`, padding: "3px 9px", borderRadius: 6 }}>{d.severity}</span>
                      <button onClick={() => handleResolve(d.defect_id)} disabled={resolving[d.defect_id]} style={{ background: COLORS.low + "20", border: `1px solid ${COLORS.low}40`, borderRadius: 8, padding: "6px 14px", color: COLORS.low, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{resolving[d.defect_id] ? "…" : "✓ Fixed"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST */}
      {view === "list" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Product ID", "Stage", "Status", "Open", "Critical", "Move Stage"].map(c => (
                  <th key={c} style={{ ...eyebrow, padding: "13px 16px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{c}</th>
                ))}
              </tr></thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: MONO, fontWeight: 600 }}>{v.product_id}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.muted }}>{v.current_stage} — {stageMap[v.current_stage]}</td>
                    <td style={{ padding: "12px 16px" }}><Chip color={statusColor(v.status)}>{v.status?.replace("_", " ")}</Chip></td>
                    <td style={{ padding: "12px 16px", fontFamily: MONO, fontWeight: 700, color: v.open_defects > 0 ? COLORS.high : COLORS.low }}>{v.open_defects}</td>
                    <td style={{ padding: "12px 16px", fontFamily: MONO, fontWeight: 700, color: v.critical_open > 0 ? COLORS.critical : COLORS.muted }}>{v.critical_open}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <select value={v.current_stage} onChange={e => handleStageUpdate(v, parseInt(e.target.value))}
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 9px", color: "#fff", fontSize: 12, cursor: "pointer", outline: "none" }}>
                        {stages.map(s => <option key={s} value={s}>{s} — {stageMap[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children, color }) {
  return <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: 6, padding: "3px 9px", fontSize: 10.5, fontWeight: 700, textTransform: "capitalize", letterSpacing: "0.03em" }}>{children}</span>;
}
