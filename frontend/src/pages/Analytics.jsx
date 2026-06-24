import { useState, useEffect } from "react";
import { COLORS, PageHeader, SectionLabel, InsightBanner } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };

const severityColor = (s) => ({ critical: COLORS.critical, high: COLORS.high, medium: COLORS.medium, low: COLORS.low }[s] || COLORS.muted);

function Bar({ label, value, max, accent, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 12 }}>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", fontWeight: 500, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(value / max) * 100}%`, borderRadius: 3,
          background: accent ? `linear-gradient(90deg,${COLORS.critical},${COLORS.high})` : "rgba(255,255,255,0.5)",
          transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      {sub && <div style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SavedAnalysisCard({ analysis, company, onDelete }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/analytics/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sql: analysis.sql_query, company_id: company.company_id }) })
      .then(r => r.json()).then(res => { setData(res.data || []); setColumns(res.columns || []); setLoading(false); }).catch(() => setLoading(false));
  }, [analysis.id]); // eslint-disable-line
  const maxVal = Math.max(...data.map(r => Number(Object.values(r)[1]) || 0), 1);
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{analysis.title}</div><div style={{ fontSize: 11.5, color: COLORS.muted }}>{analysis.description}</div></div>
        <button onClick={onDelete} style={{ background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 15 }}>✕</button>
      </div>
      {loading ? <div style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: 12 }}>Loading…</div>
        : data.length === 0 ? <div style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: 12 }}>No data</div>
        : analysis.chart_type === "table" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{columns.map(c => <th key={c} style={{ padding: "6px 10px", textAlign: "left", fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.muted, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{c}</th>)}</tr></thead>
              <tbody>{data.map((row, ri) => <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{columns.map(c => <td key={c} style={{ padding: "7px 10px", color: "rgba(255,255,255,0.82)" }}>{String(row[c] ?? "")}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
            {data.map((row, i) => {
              const val = Number(Object.values(row)[1]) || 0;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: COLORS.muted, marginBottom: 3 }}>{val}</div>
                  <div style={{ width: "100%", height: `${(val / maxVal) * 64}px`, background: "linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.4))", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                  <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 3, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{String(Object.values(row)[0]).slice(0, 10)}</div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

export default function Analytics({ company }) {
  const [summary, setSummary] = useState(null);
  const [topDefects, setTopDefects] = useState([]);
  const [stagePerformance, setStagePerformance] = useState([]);
  const [resolutionTrend, setResolutionTrend] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setSummary(s); setTopDefects(td); setStagePerformance(sp); setResolutionTrend(rt); setTrends(tr); setSavedAnalytics(sa); setLoading(false);
    }).catch(() => setLoading(false));
  }, [company]);

  const generateAnalysis = async () => {
    if (!analyticsQuestion) return;
    setGenerating(true); setGeneratorError(null); setGeneratedAnalysis(null);
    try {
      const res = await fetch(`${API}/analytics/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: company.company_id, question: analyticsQuestion }) }).then(r => r.json());
      if (res.error) setGeneratorError(res.error); else setGeneratedAnalysis(res);
    } catch { setGeneratorError("Failed to generate analysis"); }
    setGenerating(false);
  };
  const saveAnalysis = async () => {
    if (!generatedAnalysis) return;
    try {
      await fetch(`${API}/analytics/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: company.company_id, title: generatedAnalysis.title, sql_query: generatedAnalysis.sql, chart_type: generatedAnalysis.chart_type, description: generatedAnalysis.description }) });
      const updated = await fetch(`${API}/analytics/saved/${company.company_id}`).then(r => r.json());
      setSavedAnalytics(updated); setShowGenerator(false); setGeneratedAnalysis(null); setAnalyticsQuestion("");
    } catch {}
  };
  const exportCSV = () => {
    const rows = [["Defect Type", "Total", "Critical", "High", "Open"], ...topDefects.map(d => [d.defect_type, d.count, d.critical_count, d.high_count, d.open_count])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${company.name}_analytics.csv`; a.click();
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>Loading analytics…</div>;

  const maxDefectCount = Math.max(...topDefects.map(d => d.count), 1);
  const maxStageDefects = Math.max(...stagePerformance.map(s => s.total_defects), 1);
  const maxTrend = Math.max(...trends.map(t => t.count), 1);
  const maxResolution = Math.max(...resolutionTrend.map(r => Math.max(r.logged, r.resolved)), 1);

  const kpis = [
    { label: "First Pass Yield", value: `${summary?.first_pass_yield}%`, color: summary?.first_pass_yield > 80 ? COLORS.low : COLORS.high, desc: "Products with zero defects" },
    { label: "Avg Resolution", value: `${summary?.avg_resolution_hours}h`, color: "#fff", desc: "Time to resolve an issue" },
    { label: "Resolution Rate", value: `${Math.round((summary?.resolved / summary?.total_defects) * 100) || 0}%`, color: COLORS.low, desc: `${summary?.resolved} of ${summary?.total_defects} resolved` },
    { label: "Total Defects", value: summary?.total_defects, color: "#fff", desc: "All time" },
    { label: "Open Defects", value: summary?.unresolved, color: summary?.unresolved > 10 ? COLORS.high : COLORS.low, desc: "Currently unresolved" },
    { label: "Critical Issues", value: summary?.critical, color: summary?.critical > 0 ? COLORS.critical : COLORS.low, desc: "Require immediate action" },
  ];

  const btnPrimary = { background: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageHeader title="Analytics" subtitle={`${company.name} · Last 30 days`} />
        <button onClick={exportCSV} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: COLORS.muted, fontSize: 13, cursor: "pointer", marginTop: 4, fontFamily: "inherit" }}>↓ Export CSV</button>
      </div>

      <InsightBanner companyId={company.company_id} page="Analytics" summary={summary ? { ...summary, top_issue: topDefects[0] } : null} />

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...card, padding: "16px 20px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: COLORS.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>{k.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 27, fontWeight: 700, color: k.color, marginBottom: 5, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>{k.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, padding: 18 }}>
          <SectionLabel>Top Issue Types</SectionLabel>
          {topDefects.length === 0 ? <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No data yet</div>
            : topDefects.map((d, i) => <Bar key={i} label={d.defect_type.replace(/_/g, " ")} value={d.count} max={maxDefectCount} accent={d.critical_count > 0}
                sub={<span><span style={{ color: COLORS.muted }}>{d.open_count} open</span> · <span style={{ color: COLORS.low }}>{d.count - d.open_count} resolved</span>{d.critical_count > 0 && <span style={{ color: COLORS.critical }}> · {d.critical_count} critical</span>}</span>} />)}
        </div>
        <div style={{ ...card, padding: 18 }}>
          <SectionLabel>Stage Performance</SectionLabel>
          {stagePerformance.length === 0 ? <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No data yet</div>
            : stagePerformance.map((s, i) => <Bar key={i} label={s.stage_name || `Stage ${s.stage_number}`} value={s.total_defects} max={maxStageDefects} accent={s.critical > 0}
                sub={<span>{s.avg_resolution_hours ? `avg ${s.avg_resolution_hours}h · ` : ""}{s.open_defects} open{s.critical > 0 ? ` · ${s.critical} critical` : ""}</span>} />)}
        </div>
      </div>

      {/* Defect volume */}
      <div style={{ ...card, padding: 18, marginBottom: 14 }}>
        <SectionLabel>Defect Volume — Last 30 Days</SectionLabel>
        {trends.length === 0 ? <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No trend data yet</div> : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, minWidth: trends.length * 24 }}>
              {trends.map((t, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 18 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted, marginBottom: 4 }}>{t.count}</div>
                  <div style={{ width: "100%", height: `${(t.count / maxTrend) * 90}px`, minHeight: 3, borderRadius: "3px 3px 0 0",
                    background: t.count > maxTrend * 0.7 ? `linear-gradient(180deg,${COLORS.critical},${COLORS.high})` : "linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.4))" }} />
                  <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 4, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{t.date?.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logged vs resolved */}
      <div style={{ ...card, padding: 18, marginBottom: 16 }}>
        <SectionLabel>Logged vs Resolved — Last 30 Days</SectionLabel>
        {resolutionTrend.length === 0 ? <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No data yet</div> : (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <Legend color={COLORS.high} label="Logged" /><Legend color={COLORS.low} label="Resolved" />
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, minWidth: resolutionTrend.length * 32 }}>
                {resolutionTrend.map((r, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 28 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100 }}>
                      <div style={{ width: 10, height: `${(r.logged / maxResolution) * 90}px`, background: COLORS.high, borderRadius: "2px 2px 0 0", minHeight: 2 }} />
                      <div style={{ width: 10, height: `${(r.resolved / maxResolution) * 90}px`, background: COLORS.low, borderRadius: "2px 2px 0 0", minHeight: 2 }} />
                    </div>
                    <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 4, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{r.date?.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI generator */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Custom Analytics</div>
          <button onClick={() => setShowGenerator(!showGenerator)} style={btnPrimary}>✦ Create with AI</button>
        </div>

        {showGenerator && (
          <div style={{ ...card, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Describe the analysis you want</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>e.g. "defects by day of week", "which product has the most issues?", "critical vs high over time"</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input value={analyticsQuestion} onChange={e => setAnalyticsQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && generateAnalysis()}
                placeholder="Ask for any chart or report…" style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
              <button onClick={generateAnalysis} disabled={generating || !analyticsQuestion} style={{ ...btnPrimary, padding: "12px 20px", opacity: generating || !analyticsQuestion ? 0.5 : 1, whiteSpace: "nowrap" }}>{generating ? "Generating…" : "Generate ✦"}</button>
            </div>
            {generatorError && <div style={{ padding: "10px 16px", background: COLORS.critical + "20", border: `1px solid ${COLORS.critical}40`, borderRadius: 10, color: COLORS.critical, fontSize: 13, marginBottom: 16 }}>{generatorError}</div>}
            {generatedAnalysis && (
              <div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{generatedAnalysis.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>{generatedAnalysis.description}</div>
                  {generatedAnalysis.preview?.length > 0 && (
                    <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead><tr style={{ background: "rgba(255,255,255,0.03)" }}>{generatedAnalysis.columns?.map(c => <th key={c} style={{ padding: "8px 12px", textAlign: "left", fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: COLORS.muted, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{c}</th>)}</tr></thead>
                        <tbody>{generatedAnalysis.preview.map((row, ri) => <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{generatedAnalysis.columns?.map(c => <td key={c} style={{ padding: "8px 12px", color: "rgba(255,255,255,0.82)" }}>{String(row[c] ?? "")}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveAnalysis} style={{ background: COLORS.low, border: "none", borderRadius: 10, padding: "10px 20px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓ Save to Dashboard</button>
                  <button onClick={() => { setGeneratedAnalysis(null); setAnalyticsQuestion(""); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: COLORS.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Try Again</button>
                </div>
              </div>
            )}
          </div>
        )}

        {savedAnalytics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {savedAnalytics.map((a, i) => (
              <SavedAnalysisCard key={i} analysis={a} company={company} onDelete={async () => { await fetch(`${API}/analytics/saved/${a.id}`, { method: "DELETE" }); setSavedAnalytics(prev => prev.filter(x => x.id !== a.id)); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: color }} /><span style={{ fontSize: 11, color: COLORS.muted }}>{label}</span></div>;
}
