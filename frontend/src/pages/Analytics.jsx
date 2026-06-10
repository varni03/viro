import { useState, useEffect } from "react";
import { getDefects, getProducts, getDefectsByStage, getTrends } from "../api/client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, Card, MetricCard, PageHeader, SectionLabel, Badge, severityColor } from "../components/Layout";

export default function Analytics({ company }) {
  const [defects, setDefects] = useState([]);
  const [products, setProducts] = useState([]);
  const [stageData, setStageData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    Promise.all([
      getDefects(company.company_id),
      getProducts(company.company_id),
      getDefectsByStage(company.company_id),
      getTrends(company.company_id),
    ]).then(([d, p, s, t]) => {
      setDefects(d.data);
      setProducts(p.data);
      setStageData(s.data);
      setTrends(t.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [company]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>
      Loading...
    </div>
  );

  const severityData = ["critical", "high", "medium", "low"].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: defects.filter(d => d.severity === s).length,
    color: severityColor(s),
  })).filter(s => s.value > 0);

  const defectTypeCounts = defects.reduce((acc, d) => {
    acc[d.defect_type] = (acc[d.defect_type] || 0) + 1;
    return acc;
  }, {});

  const defectTypeData = Object.entries(defectTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const resolvedCount = defects.filter(d => d.resolved === 1).length;
  const unresolvedCount = defects.filter(d => d.resolved === 0).length;

  const resolutionData = [
    { name: "Resolved", value: resolvedCount, color: COLORS.low },
    { name: "Unresolved", value: unresolvedCount, color: COLORS.critical },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8, padding: "10px 14px",
      }}>
        <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || COLORS.text, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  const downloadCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={`${company.name} · ${defects.length} total defects across ${products.length} products`}
      />

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Defects" value={defects.length} accent />
        <MetricCard label="Resolved" value={resolvedCount} sub={`${Math.round(resolvedCount / Math.max(defects.length, 1) * 100)}% resolution rate`} />
        <MetricCard label="Unresolved" value={unresolvedCount} sub="Needs attention" />
        <MetricCard label="Defect Types" value={Object.keys(defectTypeCounts).length} sub="Unique types" />
      </div>

      {/* Trend */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Defect Trend Over Time</SectionLabel>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trends}>
              <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total_defects" stroke={COLORS.accentLight} strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="critical" stroke={COLORS.critical} strokeWidth={2} dot={false} name="Critical" />
              <Line type="monotone" dataKey="high" stroke={COLORS.high} strokeWidth={2} dot={false} name="High" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
            No trend data available
          </div>
        )}
      </Card>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Defect types */}
        <Card>
          <SectionLabel>Most Common Defect Types</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={defectTypeData} layout="vertical">
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="type" type="category" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={COLORS.accent} radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Resolution */}
        <Card>
          <SectionLabel>Resolution Status</SectionLabel>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={resolutionData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                {resolutionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {resolutionData.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stage breakdown */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Defects by Stage — Severity Breakdown</SectionLabel>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stageData}>
            <XAxis dataKey="stage_number" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="critical" stackId="a" fill={COLORS.critical} name="Critical" />
            <Bar dataKey="high" stackId="a" fill={COLORS.high} name="High" />
            <Bar dataKey="medium" stackId="a" fill={COLORS.medium} name="Medium" />
            <Bar dataKey="low" stackId="a" fill={COLORS.low} radius={[4, 4, 0, 0]} name="Low" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Export */}
      <Card>
        <SectionLabel>Export Data</SectionLabel>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => downloadCSV(defects, `${company.name}_defects.csv`)}
            style={{
              background: COLORS.accentGlow,
              border: `1px solid ${COLORS.accent}44`,
              borderRadius: 10,
              padding: "10px 20px",
              color: COLORS.accentLight,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⬇️ Download Defects CSV
          </button>
          <button
            onClick={() => downloadCSV(products, `${company.name}_products.csv`)}
            style={{
              background: COLORS.accentGlow,
              border: `1px solid ${COLORS.accent}44`,
              borderRadius: 10,
              padding: "10px 20px",
              color: COLORS.accentLight,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⬇️ Download Products CSV
          </button>
        </div>
      </Card>
    </div>
  );
}
