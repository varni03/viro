import { useState, useEffect } from "react";
import { getAtRisk, getStageHealth, askAI } from "../api/client";
import { COLORS, Card, MetricCard, PageHeader, SectionLabel, Badge, Button, severityColor } from "../components/Layout";

export default function Predictive({ company }) {
  const [atRisk, setAtRisk] = useState([]);
  const [stageHealth, setStageHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState({});
  const [loadingRec, setLoadingRec] = useState({});

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    Promise.all([
      getAtRisk(company.company_id),
      getStageHealth(company.company_id),
    ]).then(([r, s]) => {
      setAtRisk(r.data);
      setStageHealth(s.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [company]);

  const getRecommendation = async (product) => {
    setLoadingRec(prev => ({ ...prev, [product.product_id]: true }));
    try {
      const res = await askAI(
        `Give a specific 2-3 sentence recommendation for product ${product.product_id} 
         which has risk score ${product.risk_score}, ${product.total_defects} total defects, 
         ${product.unresolved_defects} unresolved, defect types: ${product.defect_types}. 
         Be direct and actionable.`,
        company.company_id,
        []
      );
      setRecommendations(prev => ({
        ...prev,
        [product.product_id]: res.data.answer
      }));
    } catch {
      setRecommendations(prev => ({
        ...prev,
        [product.product_id]: "Could not get recommendation — check API connection."
      }));
    }
    setLoadingRec(prev => ({ ...prev, [product.product_id]: false }));
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>
      Loading...
    </div>
  );

  const criticalStages = stageHealth.filter(s => s.health_score < 60).length;

  return (
    <div>
      <PageHeader
        title="Predictive Risk"
        subtitle="AI-identified products at risk before they fail"
      />

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <MetricCard label="At Risk Products" value={atRisk.length} sub="Requires attention" accent />
        <MetricCard label="Critical Stages" value={criticalStages} sub="Below 60% health" />
        <MetricCard label="Safe Products" value="—" sub="No flags raised" />
      </div>

      {/* At risk products */}
      <SectionLabel>At Risk Products</SectionLabel>

      {atRisk.length === 0 ? (
        <Card>
          <div style={{ color: COLORS.low, fontSize: 14, textAlign: "center", padding: 20 }}>
            ✅ No products currently flagged as at risk
          </div>
        </Card>
      ) : (
        atRisk.map((product, i) => {
          const riskColor = product.risk_score >= 8
            ? COLORS.critical
            : product.risk_score >= 6
            ? COLORS.high
            : COLORS.medium;

          return (
            <Card key={i} style={{ marginBottom: 12, borderColor: riskColor + "33" }}>
              {/* Top section */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: riskColor + "20",
                    border: `1px solid ${riskColor}40`,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20,
                  }}>
                    ⚠️
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                      {product.product_id}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>
                      Stage {product.current_stage} · {product.defect_types}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge color={riskColor}>Risk {product.risk_score}</Badge>
                  <Button
                    variant="ghost"
                    onClick={() => getRecommendation(product)}
                    style={{ fontSize: 12, padding: "6px 14px" }}
                  >
                    {loadingRec[product.product_id] ? "Thinking..." : "AI Advice →"}
                  </Button>
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12, marginBottom: recommendations[product.product_id] ? 16 : 0
              }}>
                {[
                  { label: "Total Defects", value: product.total_defects },
                  { label: "Unresolved", value: product.unresolved_defects, color: COLORS.high },
                  { label: "Risk Score", value: product.risk_score, color: riskColor },
                ].map((stat, si) => (
                  <div key={si} style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10, padding: "12px 16px",
                  }}>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
                      {stat.label}
                    </div>
                    <div style={{
                      fontSize: 22, fontWeight: 800,
                      color: stat.color || COLORS.text
                    }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI recommendation */}
              {recommendations[product.product_id] && (
                <div style={{
                  background: COLORS.accentGlow,
                  border: `1px solid ${COLORS.accent}33`,
                  borderRadius: 10, padding: "12px 16px",
                  fontSize: 13, color: COLORS.accentLight,
                  lineHeight: 1.6,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", marginBottom: 6
                  }}>
                    VIRO AI RECOMMENDATION
                  </div>
                  {recommendations[product.product_id]}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Stage health */}
      <div style={{ marginTop: 28 }}>
        <SectionLabel>Stage Health Overview</SectionLabel>
        <Card>
          {stageHealth.map((stage, i) => {
            const score = Math.round(stage.health_score);
            const color = score >= 80
              ? COLORS.low
              : score >= 60
              ? COLORS.medium
              : COLORS.critical;

            return (
              <div key={i} style={{
                marginBottom: i < stageHealth.length - 1 ? 20 : 0
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 8
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                      Stage {stage.stage_number}
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.muted, marginLeft: 8 }}>
                      {stage.stage_name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>
                      {stage.unresolved} unresolved
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}%</span>
                  </div>
                </div>
                <div style={{
                  height: 6, background: COLORS.border,
                  borderRadius: 3, overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%", width: `${score}%`,
                    background: color, borderRadius: 3,
                    transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
