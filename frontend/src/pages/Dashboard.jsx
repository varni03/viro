import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getProducts, getDefects, getDefectsByStage, getTrends } from "../api/client";
import { COLORS, Card, MetricCard, PageHeader, SectionLabel, Badge, severityColor } from "../components/Layout";

export default function Dashboard({ company, filters }) {
  const [products, setProducts] = useState([]);
  const [defects, setDefects] = useState([]);
  const [stageData, setStageData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    setLoading(true);
  
    const fetchData = async () => {
      try {
        const hasFilters = filters && (
          filters.stages?.length > 0 ||
          filters.severities?.length > 0 ||
          filters.status ||
          filters.defect_type ||
          filters.product_id
        );
  
        const [p, s, t] = await Promise.all([
          getProducts(company.company_id),
          getDefectsByStage(company.company_id),
          getTrends(company.company_id),
        ]);
  
        let d;
        if (hasFilters) {
          const res = await fetch("https://viro1.vercel.app/defects/filtered", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              company_id: company.company_id,
              ...filters,
            })
          }).then(r => r.json());
          d = { data: res };
        } else {
          d = await getDefects(company.company_id);
        }
  
        setProducts(p.data);
        setDefects(Array.isArray(d.data) ? d.data : []);
        setStageData(s.data);
        setTrends(t.data);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [company, filters]);
  

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>
      Loading...
    </div>
  );

  const totalProducts = products.length;
  const totalDefects = defects.length;
  const criticalDefects = defects.filter(d => d.severity === "critical").length;
  const flagged = products.filter(p => p.status === "flagged").length;
  const unresolved = defects.filter(d => d.resolved === 0).length;

  const severityData = ["critical", "high", "medium", "low"].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: defects.filter(d => d.severity === s).length,
    color: severityColor(s),
  })).filter(s => s.value > 0);

  const recentDefects = [...defects]
    .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
    .slice(0, 5);

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
          <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Quality Dashboard"
        subtitle={`${company.name} · Live · ${totalDefects} active defects`}
      />

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Products" value={totalProducts} sub={`${company.industry}`} accent />
        <MetricCard label="Active Defects" value={totalDefects} sub={`${unresolved} unresolved`} />
        <MetricCard label="Critical" value={criticalDefects} sub="Requires immediate action" />
        <MetricCard label="Flagged" value={flagged} sub="Needs review" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Trend line */}
        <Card>
          <SectionLabel>Defect Trend — 7 Days</SectionLabel>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trends}>
                <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total_defects" stroke={COLORS.accentLight} strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="critical" stroke={COLORS.critical} strokeWidth={2} dot={false} name="Critical" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
              No trend data yet
            </div>
          )}
        </Card>

        {/* Severity pie */}
        <Card>
          <SectionLabel>By Severity</SectionLabel>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 8 }}>
            {severityData.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 11, color: COLORS.muted }}>{s.name} {s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Stage bar */}
        <Card>
          <SectionLabel>Defects by Stage</SectionLabel>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stageData}>
                <XAxis dataKey="stage_number" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_defects" fill={COLORS.accent} radius={[4, 4, 0, 0]} name="Defects" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
              No stage data yet
            </div>
          )}
        </Card>

        {/* Recent defects */}
        <Card>
          <SectionLabel>Recent Defects</SectionLabel>
          {recentDefects.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 13 }}>No defects recorded</div>
          ) : (
            recentDefects.map((d, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < recentDefects.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: severityColor(d.severity),
                    boxShadow: `0 0 6px ${severityColor(d.severity)}`,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.product_id}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>
                      {d.defect_type} · Stage {d.stage_number}
                    </div>
                  </div>
                </div>
                <Badge color={severityColor(d.severity)}>{d.severity}</Badge>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
