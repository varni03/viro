import { useState, useEffect } from "react";
import { getAtRisk, getStageHealth, askAI } from "../api/client";
import { COLORS, PageHeader, SectionLabel } from "../components/Layout";

const MONO = "'JetBrains Mono', monospace";
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };

export default function Predictive({ company }) {
  const [atRisk, setAtRisk] = useState([]);
  const [stageHealth, setStageHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState({});
  const [loadingRec, setLoadingRec] = useState({});

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    Promise.all([getAtRisk(company.company_id), getStageHealth(company.company_id)])
      .then(([r, s]) => { setAtRisk(r.data); setStageHealth(s.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [company]);

  const getRecommendation = async (p) => {
    setLoadingRec(prev => ({ ...prev, [p.product_id]: true }));
    try {
      const res = await askAI(
        `Give a specific 2-3 sentence recommendation for product ${p.product_id} which has risk score ${p.risk_score}, ${p.total_defects} total defects, ${p.unresolved_defects} unresolved, defect types: ${p.defect_types}. Be direct and actionable.`,
        company.company_id, []
      );
      setRecommendations(prev => ({ ...prev, [p.product_id]: res.data.answer }));
    } catch {
      setRecommendations(prev => ({ ...prev, [p.product_id]: "Couldn't reach the AI service — try again." }));
    }
    setLoadingRec(prev => ({ ...prev, [p.product_id]: false }));
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>Loading…</div>;

  const criticalStages = stageHealth.filter(s => s.health_score < 60).length;
  const highestRisk = atRisk.reduce((m, p) => Math.max(m, p.risk_score || 0), 0);
  const idLabel = (id) => id;
  const verdict = (r) => r >= 8 ? "likely to fail inspection" : r >= 6 ? "at risk of rework before shipping" : "worth keeping an eye on";

  return (
    <div>
      <PageHeader title="Predictive Risk" subtitle="What's likely to go wrong — before it does." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 26 }}>
        {[
          { label: "At Risk", value: atRisk.length, color: atRisk.length ? COLORS.high : COLORS.low },
          { label: "Critical Stages", value: criticalStages, color: criticalStages ? COLORS.critical : COLORS.low, hot: criticalStages > 0 },
          { label: "Highest Risk", value: highestRisk ? `${highestRisk}/10` : "—", color: highestRisk >= 8 ? COLORS.critical : highestRisk >= 6 ? COLORS.high : "#fff" },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: "16px 18px", borderColor: m.hot ? COLORS.critical + "44" : "rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.muted, marginBottom: 9 }}>{m.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <SectionLabel>Risk Feed</SectionLabel>
      {atRisk.length === 0 ? (
        <div style={{ ...card, color: COLORS.low, fontSize: 14, textAlign: "center", padding: 28 }}>✓ Nothing flagged — every product is on track.</div>
      ) : atRisk.map((p, i) => {
        const rc = p.risk_score >= 8 ? COLORS.critical : p.risk_score >= 6 ? COLORS.high : COLORS.medium;
        return (
          <div key={i} style={{ ...card, padding: "18px 20px", marginBottom: 10, borderColor: rc + "33", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 3, borderRadius: 3, background: rc }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12, paddingLeft: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
                  <span style={{ fontFamily: MONO }}>{idLabel(p.product_id)}</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}> {verdict(p.risk_score)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 5 }}>
                  <span style={{ color: rc, fontWeight: 600 }}>{p.unresolved_defects} unresolved</span> of {p.total_defects} defects · at stage {p.current_stage} · {p.defect_types}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: rc, background: rc + "1f", border: `1px solid ${rc}40`, padding: "4px 9px", borderRadius: 6 }}>RISK {p.risk_score}</span>
                <button onClick={() => getRecommendation(p)} disabled={loadingRec[p.product_id]} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "7px 13px", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {loadingRec[p.product_id] ? "Thinking…" : "✦ AI advice"}
                </button>
              </div>
            </div>
            {recommendations[p.product_id] && (
              <div style={{ marginLeft: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "12px 15px", fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>VIRO RECOMMENDS</div>
                {recommendations[p.product_id]}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 28 }}>
        <SectionLabel>Stage Health</SectionLabel>
        <div style={{ ...card, padding: 20 }}>
          {stageHealth.map((stage, i) => {
            const score = Math.round(stage.health_score);
            const color = score >= 80 ? COLORS.low : score >= 60 ? COLORS.medium : COLORS.critical;
            return (
              <div key={i} style={{ marginBottom: i < stageHealth.length - 1 ? 18 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: COLORS.muted }}>{stage.stage_number}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 9 }}>{stage.stage_name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>{stage.unresolved} unresolved</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color }}>{score}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 3, transition: "width .8s cubic-bezier(.16,1,.3,1)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
