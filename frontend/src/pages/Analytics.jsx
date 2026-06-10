import { useState, useEffect } from "react";
import { COLORS, Card, PageHeader, SectionLabel } from "../components/Layout";

const API = "http://localhost:8000";

const severityColor = (s) => ({
  critical: COLORS.critical,
  high: COLORS.high,
  medium: COLORS.medium,
  low: COLORS.low,
}[s] || COLORS.muted);

function SavedAnalysisCard({ analysis, company, onDelete }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/analytics/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: analysis.sql_query,
        company_id: company.company_id,
      })
    }).then(r => r.json()).then(res => {
      setData(res.data || []);
      setColumns(res.columns || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [analysis.id]);

  const maxVal = Math.max(...data.map(r => Number(Object.values(r)[1]) || 0), 1);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>
            {analysis.title}
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>{analysis.description}</div>
        </div>
        <button
          onClick={onDelete}
          style={{
            background: "transparent", border: "none",
            color: COLORS.muted, cursor: "pointer", fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: 12 }}>Loading...</div>
      ) : data.length === 0 ? (
        <div style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: 12 }}>No data</div>
      ) : analysis.chart_type === "table" ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} style={{
                    padding: "6px 10px", textAlign: "left",
                    color: COLORS.muted, fontSize: 10,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: "6px 10px", color: COLORS.text }}>
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
          {data.map((row, i) => {
            const val = Number(Object.values(row)[1]) || 0;
            const label = String(Object.values(row)[0]).slice(0, 10);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 9, color: COLORS.muted, marginBottom: 2 }}>{val}</div>
                <div style={{
                  width: "100%",
                  height: `${(val / maxVal) * 60}px`,
                  background: `linear-gradient(180deg, ${COLORS.accent}, #4f46e5)`,
                  borderRadius: "2px 2px 0 0",
                  minHeight: 2,
                }} />
                <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 2, textAlign: "center" }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}


export default function Analytics({ company }) {
  const [summary, setSummary] = useState(null);
  const [topDefects, setTopDefects] = useState([]);
  const [stagePerformance, setStagePerformance] = useState([]);
  const [resolutionTrend, setResolutionTrend] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [savedAnalytics, setSavedAnalytics] = useState([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [analyticsQuestion, setAnalyticsQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedAnalysis, setGeneratedAnalysis] = useState(null);
  const [generatorError, setGeneratorError] = useState(null);
  

  useEffect(() => {
    if (!company) return;
    Promise.all([
      fetch(`${API}/analytics/summary/${company.company_id}`).then(r => r.json()),
      fetch(`${API}/analytics/top-defects/${company.company_id}`).then(r => r.json()),
      fetch(`${API}/analytics/stage-performance/${company.company_id}`).then(r => r.json()),
      fetch(`${API}/analytics/resolution-trend/${company.company_id}`).then(r => r.json()),
      fetch(`${API}/analytics/trends/${company.company_id}`).then(r => r.json()),
      fetch(`${API}/analytics/saved/${company.company_id}`).then(r => r.json()),
    ]).then(([s, td, sp, rt, tr, sa]) => {
      setSummary(s);
      setTopDefects(td);
      setStagePerformance(sp);
      setResolutionTrend(rt);
      setTrends(tr);
      setSavedAnalytics(sa);
      setLoading(false);
    }).catch(() => setLoading(false));

  }, [company]);

  const generateAnalysis = async () => {
    if (!analyticsQuestion) return;
    setGenerating(true);
    setGeneratorError(null);
    setGeneratedAnalysis(null);
    try {
      const res = await fetch(`${API}/analytics/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.company_id,
          question: analyticsQuestion,
        })
      }).then(r => r.json());

      if (res.error) {
        setGeneratorError(res.error);
      } else {
        setGeneratedAnalysis(res);
      }
    } catch {
      setGeneratorError("Failed to generate analysis");
    }
    setGenerating(false);
  };

  const saveAnalysis = async () => {
    if (!generatedAnalysis) return;
    try {
      await fetch(`${API}/analytics/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.company_id,
          title: generatedAnalysis.title,
          sql_query: generatedAnalysis.sql,
          chart_type: generatedAnalysis.chart_type,
          description: generatedAnalysis.description,
        })
      });
      const updated = await fetch(`${API}/analytics/saved/${company.company_id}`).then(r => r.json());
      setSavedAnalytics(updated);
      setShowGenerator(false);
      setGeneratedAnalysis(null);
      setAnalyticsQuestion("");
    } catch {}
  };


  const exportCSV = () => {
    setExportLoading(true);
    const rows = [
      ["Defect Type", "Total", "Critical", "High", "Open"],
      ...topDefects.map(d => [
        d.defect_type, d.count, d.critical_count, d.high_count, d.open_count
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.name}_analytics.csv`;
    a.click();
    setExportLoading(false);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>
      Loading analytics...
    </div>
  );

  const maxDefectCount = Math.max(...topDefects.map(d => d.count), 1);
  const maxStageDefects = Math.max(...stagePerformance.map(s => s.total_defects), 1);
  const maxTrend = Math.max(...trends.map(t => t.count), 1);
  const maxResolution = Math.max(
    ...resolutionTrend.map(r => Math.max(r.logged, r.resolved)), 1
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <PageHeader
          title="Analytics"
          subtitle={`${company.name} · Last 30 days`}
        />
        <button
          onClick={exportCSV}
          disabled={exportLoading}
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: "10px 18px",
            color: COLORS.muted, fontSize: 13,
            cursor: "pointer", marginTop: 4,
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* KPI Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "First Pass Yield", value: `${summary?.first_pass_yield}%`, color: summary?.first_pass_yield > 80 ? COLORS.low : COLORS.high, desc: "Products with zero defects" },
          { label: "Avg Resolution Time", value: `${summary?.avg_resolution_hours}h`, color: COLORS.accentLight, desc: "Time to resolve an issue" },
          { label: "Resolution Rate", value: `${Math.round((summary?.resolved / summary?.total_defects) * 100) || 0}%`, color: COLORS.low, desc: `${summary?.resolved} of ${summary?.total_defects} resolved` },
          { label: "Total Defects", value: summary?.total_defects, color: COLORS.text, desc: "All time" },
          { label: "Open Defects", value: summary?.unresolved, color: summary?.unresolved > 10 ? COLORS.high : COLORS.low, desc: "Currently unresolved" },
          { label: "Critical Issues", value: summary?.critical, color: summary?.critical > 0 ? COLORS.critical : COLORS.low, desc: "Require immediate action" },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: "16px 20px",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 8 }}>
              {kpi.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>{kpi.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Top defect types */}
        <Card>
          <SectionLabel>Top Issue Types</SectionLabel>
          {topDefects.length === 0 ? (
            <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No data yet</div>
          ) : (
            topDefects.map((defect, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, textTransform: "capitalize" }}>
                    {defect.defect_type.replace(/_/g, " ")}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {defect.critical_count > 0 && (
                      <span style={{ fontSize: 10, color: COLORS.critical, fontWeight: 700 }}>
                        {defect.critical_count} critical
                      </span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                      {defect.count}
                    </span>
                  </div>
                </div>
                <div style={{ height: 6, background: COLORS.bg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(defect.count / maxDefectCount) * 100}%`,
                    background: defect.critical_count > 0
                      ? `linear-gradient(90deg, ${COLORS.critical}, ${COLORS.high})`
                      : `linear-gradient(90deg, ${COLORS.accent}, #4f46e5)`,
                    borderRadius: 3,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: COLORS.muted }}>{defect.open_count} open</span>
                  <span style={{ fontSize: 10, color: COLORS.muted }}>·</span>
                  <span style={{ fontSize: 10, color: COLORS.low }}>{defect.count - defect.open_count} resolved</span>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Stage performance */}
        <Card>
          <SectionLabel>Stage Performance</SectionLabel>
          {stagePerformance.length === 0 ? (
            <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No data yet</div>
          ) : (
            stagePerformance.map((stage, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                      {stage.stage_name || `Stage ${stage.stage_number}`}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>
                      {stage.avg_resolution_hours ? `Avg ${stage.avg_resolution_hours}h to resolve` : "No resolved defects yet"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                      {stage.total_defects}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>total</div>
                  </div>
                </div>
                <div style={{ height: 6, background: COLORS.bg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(stage.total_defects / maxStageDefects) * 100}%`,
                    background: stage.critical > 0
                      ? `linear-gradient(90deg, ${COLORS.critical}, ${COLORS.high})`
                      : `linear-gradient(90deg, ${COLORS.accent}, #4f46e5)`,
                    borderRadius: 3,
                  }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                  {stage.critical > 0 && (
                    <span style={{ fontSize: 10, color: COLORS.critical }}>{stage.critical} critical</span>
                  )}
                  {stage.high > 0 && (
                    <span style={{ fontSize: 10, color: COLORS.high }}>{stage.high} high</span>
                  )}
                  <span style={{ fontSize: 10, color: COLORS.muted }}>{stage.open_defects} open</span>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Defect trend chart */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Defect Volume — Last 30 Days</SectionLabel>
        {trends.length === 0 ? (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No trend data yet</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, minWidth: trends.length * 24 }}>
              {trends.map((t, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 20 }}>
                  <div style={{ fontSize: 9, color: COLORS.muted, marginBottom: 4 }}>{t.count}</div>
                  <div style={{
                    width: "100%",
                    height: `${(t.count / maxTrend) * 90}px`,
                    background: t.count > maxTrend * 0.7
                      ? `linear-gradient(180deg, ${COLORS.critical}, ${COLORS.high})`
                      : `linear-gradient(180deg, ${COLORS.accent}, #4f46e5)`,
                    borderRadius: "3px 3px 0 0",
                    minHeight: 4,
                  }} />
                  <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 4, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>
                    {t.date?.slice(5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Resolution trend */}
      <Card>
        <SectionLabel>Logged vs Resolved — Last 30 Days</SectionLabel>
        {resolutionTrend.length === 0 ? (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No data yet</div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.high }} />
                <span style={{ fontSize: 11, color: COLORS.muted }}>Logged</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.low }} />
                <span style={{ fontSize: 11, color: COLORS.muted }}>Resolved</span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, minWidth: resolutionTrend.length * 32 }}>
                {resolutionTrend.map((r, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 28 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100 }}>
                      <div style={{
                        width: 10,
                        height: `${(r.logged / maxResolution) * 90}px`,
                        background: COLORS.high,
                        borderRadius: "2px 2px 0 0",
                        minHeight: 2,
                      }} />
                      <div style={{
                        width: 10,
                        height: `${(r.resolved / maxResolution) * 90}px`,
                        background: COLORS.low,
                        borderRadius: "2px 2px 0 0",
                        minHeight: 2,
                      }} />
                    </div>
                    <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 4, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>
                      {r.date?.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
      {/* AI Custom Analytics Generator */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Custom Analytics</div>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
              border: "none", borderRadius: 10,
              padding: "10px 18px", color: "white",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            + Create with AI
          </button>
        </div>

        {/* Generator panel */}
        {showGenerator && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
              Describe the analysis you want
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>
              Examples: "Show defects by day of week", "Which product has the most issues?", "Compare critical vs high defects over time"
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                value={analyticsQuestion}
                onChange={e => setAnalyticsQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generateAnalysis()}
                placeholder="e.g. Show me defect counts by stage for this month..."
                style={{
                  flex: 1,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10, padding: "12px 16px",
                  color: COLORS.text, fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={generateAnalysis}
                disabled={generating || !analyticsQuestion}
                style={{
                  background: generating ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                  border: "none", borderRadius: 10,
                  padding: "12px 20px", color: "white",
                  fontSize: 13, fontWeight: 700,
                  cursor: generating ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {generating ? "Generating..." : "Generate ✨"}
              </button>
            </div>

            {generatorError && (
              <div style={{
                padding: "10px 16px",
                background: COLORS.critical + "20",
                border: `1px solid ${COLORS.critical}40`,
                borderRadius: 10, color: COLORS.critical, fontSize: 13,
                marginBottom: 16,
              }}>
                ❌ {generatorError}
              </div>
            )}

            {generatedAnalysis && (
              <div>
                <div style={{
                  background: COLORS.accentGlow,
                  border: `1px solid ${COLORS.accent}33`,
                  borderRadius: 12, padding: 16, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accentLight, marginBottom: 4 }}>
                    {generatedAnalysis.title}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>
                    {generatedAnalysis.description}
                  </div>

                  {/* Preview table */}
                  {generatedAnalysis.preview?.length > 0 && (
                    <div style={{
                      background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10, overflow: "hidden",
                    }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: COLORS.card }}>
                            {generatedAnalysis.columns?.map(col => (
                              <th key={col} style={{
                                padding: "8px 12px", textAlign: "left",
                                color: COLORS.muted, fontWeight: 600,
                                fontSize: 10, letterSpacing: "0.06em",
                                borderBottom: `1px solid ${COLORS.border}`,
                              }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {generatedAnalysis.preview.map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                              {generatedAnalysis.columns?.map(col => (
                                <td key={col} style={{ padding: "8px 12px", color: COLORS.text }}>
                                  {String(row[col] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={saveAnalysis}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.low}, #16a34a)`,
                      border: "none", borderRadius: 10,
                      padding: "10px 20px", color: "white",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    ✓ Save to Dashboard
                  </button>
                  <button
                    onClick={() => { setGeneratedAnalysis(null); setAnalyticsQuestion(""); }}
                    style={{
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10, padding: "10px 16px",
                      color: COLORS.muted, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Saved analytics */}
        {savedAnalytics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {savedAnalytics.map((analysis, i) => (
              <SavedAnalysisCard
                key={i}
                analysis={analysis}
                company={company}
                onDelete={async () => {
                  await fetch(`${API}/analytics/saved/${analysis.id}`, { method: "DELETE" });
                  setSavedAnalytics(prev => prev.filter(a => a.id !== analysis.id));
                }}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
