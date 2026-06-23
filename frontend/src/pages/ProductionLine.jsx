import { useState, useEffect } from "react";
import { getProductionLine, getDefects, resolveDefect, updateStage, updateStatus } from "../api/client";
import { COLORS, Card, PageHeader, SectionLabel, Badge, severityColor } from "../components/Layout";

const fetchStages = (companyId) => 
    fetch(`https://web-production-0457e.up.railway.app/stages/${companyId}`).then(r => r.json());

const statusColor = (s) => ({
  completed: COLORS.low,
  in_progress: COLORS.accentLight,
  on_hold: COLORS.medium,
  flagged: COLORS.critical,
}[s] || COLORS.muted);

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
        getProductionLine(company.company_id),
        getDefects(company.company_id),
        fetchStages(company.company_id),
      ]);
      setVehicles(lineRes.data);
      setAllDefects(defectRes.data.filter(d => d.resolved === 0));

      // Build dynamic stage list and map
      const stageNumbers = stageRes.map(s => s.stage_number);
      const stageNameMap = stageRes.reduce((acc, s) => {
        acc[s.stage_number] = s.stage_name;
        return acc;
      }, {});
      setStages(stageNumbers);
      setStageMap(stageNameMap);
    } catch {}
    setLoading(false);
  };


  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [company]);

  const selectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    try {
      const res = await getDefects(company.company_id, vehicle.product_id);
      setVehicleDefects(res.data.filter(d => d.resolved === 0));
    } catch {}
  };

  const handleResolve = async (defectId) => {
    setResolving(prev => ({ ...prev, [defectId]: true }));
    try {
      await resolveDefect(defectId);
      setAllDefects(prev => prev.filter(d => d.defect_id !== defectId));
      setVehicleDefects(prev => prev.filter(d => d.defect_id !== defectId));
      load();
    } catch {}
    setResolving(prev => ({ ...prev, [defectId]: false }));
  };

  const handleStageUpdate = async (vehicle, newStage) => {
    try {
      await updateStage(vehicle.product_id, newStage, company.company_id);
      load();
      if (selectedVehicle?.product_id === vehicle.product_id) {
        setSelectedVehicle(prev => ({ ...prev, current_stage: newStage }));
      }
    } catch {}
  };

  const handleStatusUpdate = async (vehicle, newStatus) => {
    try {
      await updateStatus(vehicle.product_id, newStatus, company.company_id);
      load();
    } catch {}
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>
      Loading...
    </div>
  );

  // Filter defects for repair queue
  const filteredDefects = filter === "all"
    ? allDefects
    : allDefects.filter(d => d.severity === filter);

  const sortedDefects = [...filteredDefects].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] || 4) - (order[b.severity] || 4);
  });

  const vehiclesByStage = stages.reduce((acc, stage) => {
    acc[stage] = vehicles.filter(v => v.current_stage === stage);
    return acc;
  }, {});

  const criticalCount = allDefects.filter(d => d.severity === "critical").length;
  const highCount = allDefects.filter(d => d.severity === "high").length;

  return (
    <div>
      <PageHeader
        title="Production Line"
        subtitle={`${company.name} · ${vehicles.length} active vehicles · ${allDefects.length} open defects`}
      />

      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Vehicles", value: vehicles.length, color: COLORS.text },
          { label: "Open Defects", value: allDefects.length, color: COLORS.high },
          { label: "Critical", value: criticalCount, color: COLORS.critical },
          { label: "High Priority", value: highCount, color: COLORS.high },
        ].map((m, i) => (
          <div key={i} style={{
            background: COLORS.card,
            border: `1px solid ${i === 2 && criticalCount > 0 ? COLORS.critical + "44" : COLORS.border}`,
            borderRadius: 14, padding: "16px 20px",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* View toggle — managers see both, repair workers only see queue */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {user?.role !== "repair" && (
          <button
            onClick={() => setView("pipeline")}
            style={{
              background: view === "pipeline" ? COLORS.accentGlow : COLORS.card,
              border: `1px solid ${view === "pipeline" ? COLORS.accent + "44" : COLORS.border}`,
              borderRadius: 8, padding: "8px 16px",
              color: view === "pipeline" ? COLORS.accentLight : COLORS.muted,
              fontSize: 13, fontWeight: view === "pipeline" ? 600 : 400,
              cursor: "pointer",
            }}
          >
            🔄 Pipeline
          </button>
        )}
        <button
          onClick={() => setView("queue")}
          style={{
            background: view === "queue" ? COLORS.accentGlow : COLORS.card,
            border: `1px solid ${view === "queue" ? COLORS.accent + "44" : COLORS.border}`,
            borderRadius: 8, padding: "8px 16px",
            color: view === "queue" ? COLORS.accentLight : COLORS.muted,
            fontSize: 13, fontWeight: view === "queue" ? 600 : 400,
            cursor: "pointer",
          }}
        >
          🔧 Repair Queue {allDefects.length > 0 && `(${allDefects.length})`}
        </button>
        {user?.role !== "repair" && (
          <button
            onClick={() => setView("list")}
            style={{
              background: view === "list" ? COLORS.accentGlow : COLORS.card,
              border: `1px solid ${view === "list" ? COLORS.accent + "44" : COLORS.border}`,
              borderRadius: 8, padding: "8px 16px",
              color: view === "list" ? COLORS.accentLight : COLORS.muted,
              fontSize: 13, fontWeight: view === "list" ? 600 : 400,
              cursor: "pointer",
            }}
          >
            📋 List
          </button>
        )}
        <button
          onClick={load}
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: "8px 16px",
            color: COLORS.muted, fontSize: 13,
            cursor: "pointer", marginLeft: "auto",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* REPAIR QUEUE VIEW */}
      {view === "queue" && (
        <div>
          {/* Severity filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["all", "critical", "high", "medium", "low"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f
                    ? (f === "all" ? COLORS.accentGlow : severityColor(f) + "20")
                    : COLORS.card,
                  border: `1px solid ${filter === f
                    ? (f === "all" ? COLORS.accent + "44" : severityColor(f) + "44")
                    : COLORS.border}`,
                  borderRadius: 20, padding: "5px 14px",
                  color: filter === f
                    ? (f === "all" ? COLORS.accentLight : severityColor(f))
                    : COLORS.muted,
                  fontSize: 12, fontWeight: filter === f ? 700 : 400,
                  cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {f} {f !== "all" && `(${allDefects.filter(d => d.severity === f).length})`}
              </button>
            ))}
          </div>

          {sortedDefects.length === 0 ? (
            <Card>
              <div style={{
                textAlign: "center", padding: "40px 0",
                color: COLORS.low, fontSize: 16,
              }}>
                ✅ No open defects — production line is clear!
              </div>
            </Card>
          ) : (
            sortedDefects.map((defect, i) => (
              <div key={i} style={{
                background: COLORS.card,
                border: `1px solid ${defect.severity === "critical"
                  ? COLORS.critical + "44"
                  : defect.severity === "high"
                  ? COLORS.high + "33"
                  : COLORS.border}`,
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Severity indicator */}
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 10,
                    background: severityColor(defect.severity) + "20",
                    border: `1px solid ${severityColor(defect.severity)}40`,
                    display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {defect.severity === "critical" ? "🔴" :
                     defect.severity === "high" ? "🟠" :
                     defect.severity === "medium" ? "🟡" : "🟢"}
                  </div>

                  <div>
                    {/* Defect type */}
                    <div style={{
                      fontSize: 15, fontWeight: 700,
                      color: COLORS.text, marginBottom: 4,
                      textTransform: "capitalize",
                    }}>
                      {defect.defect_type.replace(/_/g, " ")}
                    </div>

                    {/* Vehicle and stage */}
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 3 }}>
                      📦 {defect.product_id} · Stage {defect.stage_number} — {stageMap[defect.stage_number] || "Unknown"}
                    </div>

                    {/* Notes */}
                    {defect.notes && (
                      <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: "italic" }}>
                        "{defect.notes}"
                      </div>
                    )}

                    {/* Time logged */}
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                      Logged {new Date(defect.logged_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <Badge color={severityColor(defect.severity)}>
                    {defect.severity}
                  </Badge>

                  <button
                    onClick={() => handleResolve(defect.defect_id)}
                    disabled={resolving[defect.defect_id]}
                    style={{
                      background: resolving[defect.defect_id]
                        ? COLORS.border
                        : COLORS.low,
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 16px",
                      color: "white",
                      fontSize: 13, fontWeight: 700,
                      cursor: resolving[defect.defect_id] ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      opacity: resolving[defect.defect_id] ? 0.6 : 1,
                    }}
                  >
                    {resolving[defect.defect_id] ? "Resolving..." : "✓ Mark Fixed"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PIPELINE VIEW */}
      {view === "pipeline" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {stages.map(stage => (
              <div key={stage}>
                <div style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px 12px 0 0",
                  padding: "12px 16px",
                  borderBottom: `2px solid ${COLORS.accent}`,
                }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 2 }}>
                    STAGE {stage}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{stageMap[stage]}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    {vehiclesByStage[stage].length} vehicles
                  </div>
                </div>

                <div style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  padding: 8, minHeight: 200,
                }}>
                  {vehiclesByStage[stage].length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.muted, fontSize: 12 }}>
                      Empty
                    </div>
                  ) : (
                    vehiclesByStage[stage].map((vehicle, i) => (
                      <div
                        key={i}
                        onClick={() => selectVehicle(vehicle)}
                        style={{
                          background: selectedVehicle?.product_id === vehicle.product_id
                            ? COLORS.accentGlow : COLORS.card,
                          border: `1px solid ${
                            vehicle.critical_open > 0 ? COLORS.critical + "44"
                            : selectedVehicle?.product_id === vehicle.product_id
                            ? COLORS.accent + "44" : COLORS.border}`,
                          borderRadius: 10, padding: "10px 12px",
                          marginBottom: 6, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                          {vehicle.product_id.split("_").pop()}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {vehicle.critical_open > 0 && (
                            <span style={{
                              background: COLORS.critical + "20", color: COLORS.critical,
                              border: `1px solid ${COLORS.critical}40`,
                              borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                            }}>
                              {vehicle.critical_open} critical
                            </span>
                          )}
                          {vehicle.open_defects === 0 && (
                            <span style={{
                              background: COLORS.low + "20", color: COLORS.low,
                              borderRadius: 4, padding: "1px 6px", fontSize: 10,
                            }}>
                              ✓ clean
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vehicle detail */}
          {selectedVehicle && (
            <Card accent>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                    {selectedVehicle.product_id}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge color={COLORS.accentLight}>
                      Stage {selectedVehicle.current_stage} — {stageMap[selectedVehicle.current_stage]}
                    </Badge>
                    <Badge color={statusColor(selectedVehicle.status)}>
                      {selectedVehicle.status?.replace("_", " ")}
                    </Badge>
                    <Badge color={selectedVehicle.open_defects > 0 ? COLORS.high : COLORS.low}>
                      {selectedVehicle.open_defects} open defects
                    </Badge>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {selectedVehicle.current_stage !== 710 && (
                    <button
                      onClick={() => {
                        const idx = stages.indexOf(selectedVehicle.current_stage);
                        handleStageUpdate(selectedVehicle, stages[idx + 1]);
                      }}
                      disabled={selectedVehicle.critical_open > 0}
                      style={{
                        background: selectedVehicle.critical_open > 0
                          ? COLORS.border
                          : "#fff",
                        border: "none", borderRadius: 10,
                        padding: "10px 18px", color: "#08090a",
                        fontWeight: 700, fontSize: 13,
                        cursor: selectedVehicle.critical_open > 0 ? "not-allowed" : "pointer",
                        opacity: selectedVehicle.critical_open > 0 ? 0.5 : 1,
                      }}
                    >
                      Advance → {stageMap[stages[stages.indexOf(selectedVehicle.current_stage) + 1]]}
                    </button>
                  )}
                  {selectedVehicle.current_stage === 710 && (
                    <button
                      onClick={() => handleStatusUpdate(selectedVehicle, "completed")}
                      style={{
                        background: COLORS.low,
                        border: "none", borderRadius: 10,
                        padding: "10px 18px", color: "white",
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                      }}
                    >
                      ✓ Approve to Ship
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    style={{
                      background: COLORS.card, border: `1px solid ${COLORS.border}`,
                      borderRadius: 10, padding: "10px 14px",
                      color: COLORS.muted, cursor: "pointer", fontSize: 13,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <SectionLabel>Open Defects</SectionLabel>
              {vehicleDefects.length === 0 ? (
                <div style={{
                  background: COLORS.low + "15", border: `1px solid ${COLORS.low}33`,
                  borderRadius: 10, padding: 16,
                  color: COLORS.low, textAlign: "center", fontSize: 14,
                }}>
                  ✅ No open defects — clear to advance
                </div>
              ) : (
                vehicleDefects.map((defect, i) => (
                  <div key={i} style={{
                    background: COLORS.bg,
                    border: `1px solid ${defect.severity === "critical" ? COLORS.critical + "44" : COLORS.border}`,
                    borderRadius: 12, padding: "12px 16px",
                    marginBottom: 8,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: severityColor(defect.severity),
                        boxShadow: `0 0 6px ${severityColor(defect.severity)}`,
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                          {defect.defect_type.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>
                          Stage {defect.stage_number} · {new Date(defect.logged_at).toLocaleDateString()}
                          {defect.notes && ` · ${defect.notes}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Badge color={severityColor(defect.severity)}>{defect.severity}</Badge>
                      <button
                        onClick={() => handleResolve(defect.defect_id)}
                        disabled={resolving[defect.defect_id]}
                        style={{
                          background: COLORS.low + "20",
                          border: `1px solid ${COLORS.low}40`,
                          borderRadius: 8, padding: "6px 14px",
                          color: COLORS.low, fontSize: 12, fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {resolving[defect.defect_id] ? "..." : "✓ Fixed"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.surface }}>
                  {["Product ID", "Stage", "Status", "Open", "Critical", "Move Stage"].map(col => (
                    <th key={col} style={{
                      padding: "12px 16px", textAlign: "left",
                      color: COLORS.muted, fontWeight: 600,
                      fontSize: 11, letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle, i) => (
                  <tr key={i} style={{
                    borderBottom: `1px solid ${COLORS.border}`,
                    cursor: "pointer",
                  }}>
                    <td style={{ padding: "12px 16px", color: COLORS.text, fontWeight: 600 }}>
                      {vehicle.product_id}
                    </td>
                    <td style={{ padding: "12px 16px", color: COLORS.muted }}>
                      {vehicle.current_stage} — {stageMap[vehicle.current_stage]}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={statusColor(vehicle.status)}>
                        {vehicle.status?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", color: vehicle.open_defects > 0 ? COLORS.high : COLORS.low, fontWeight: 700 }}>
                      {vehicle.open_defects}
                    </td>
                    <td style={{ padding: "12px 16px", color: vehicle.critical_open > 0 ? COLORS.critical : COLORS.muted, fontWeight: 700 }}>
                      {vehicle.critical_open}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={vehicle.current_stage}
                        onChange={e => handleStageUpdate(vehicle, parseInt(e.target.value))}
                        style={{
                          background: COLORS.card,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 6, padding: "4px 8px",
                          color: COLORS.text, fontSize: 12,
                          cursor: "pointer", outline: "none",
                        }}
                      >
                        {stages.map(s => (
                          <option key={s} value={s}>{s} — {stageMap[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
