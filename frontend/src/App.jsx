import { useState, useEffect } from "react";
import { getCompanies, getAtRisk, getDefects, getProducts } from "./api/client";
import Sidebar from "./components/Sidebar";
import AIPanel from "./components/AIPanel";
import Dashboard from "./pages/Dashboard";
import Predictive from "./pages/Predictive";
import Analytics from "./pages/Analytics";
import VehicleSearch from "./pages/VehicleSearch";
import LogDefect from "./pages/LogDefect";
import { COLORS } from "./components/Layout";
import Login from "./pages/Login";
import ProductionLine from "./pages/ProductionLine";


function ReportTab({ report }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 24, fontWeight: 800,
          letterSpacing: "-0.02em", marginBottom: 4
        }}>
          {report.title}
        </div>
        <div style={{ color: COLORS.muted, fontSize: 13 }}>AI Generated Report</div>
      </div>

      <div style={{
        background: COLORS.accentGlow,
        border: `1px solid ${COLORS.accent}33`,
        borderRadius: 12, padding: "16px 20px",
        fontSize: 14, color: COLORS.accentLight,
        lineHeight: 1.6, marginBottom: 24,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.08em", marginBottom: 8
        }}>
          VIRO AI SUMMARY
        </div>
        {report.answer}
      </div>

      {report.data?.length > 0 && (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.surface }}>
                  {Object.keys(report.data[0]).map(col => (
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
                {report.data.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {Object.values(row).map((val, vi) => (
                      <td key={vi} style={{
                        padding: "12px 16px",
                        color: COLORS.text, fontSize: 13,
                      }}>
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: "10px 16px", color: COLORS.muted,
            fontSize: 11, borderTop: `1px solid ${COLORS.border}`,
          }}>
            {report.data.length} rows
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [stages, setStages] = useState([]);
  const [stats, setStats] = useState({});
  const [reportTabs, setReportTabs] = useState([]);

  const [filters, setFilters] = useState({
    dateRange: null,
    stages: [],
    severities: [],
    status: null,
    defectType: null,
    productId: null,
  });
  

  const staticPages = ["Dashboard", "Vehicle Search", "Log Defect", "Analytics", "Predictive"];

  useEffect(() => {
    const savedToken = localStorage.getItem("viro_token");
    const savedUser = localStorage.getItem("viro_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setAuthChecked(true);
  }, []);
  
  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("viro_token");
    localStorage.removeItem("viro_user");
    setUser(null);
    setToken(null);
  };
  

  useEffect(() => {
    getCompanies()
      .then(res => {
        setCompanies(res.data);
        setCompany(res.data[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!company) return;

    Promise.all([
      getProducts(company.company_id),
      getDefects(company.company_id),
      getAtRisk(company.company_id),
    ]).then(([p, d, r]) => {
      setStats({
        total_products: p.data.length,
        unresolved: d.data.filter(x => x.resolved === 0).length,
        at_risk: r.data.length,
      });
    }).catch(() => {});

    fetch(`http://localhost:8000/stages/${company.company_id}`)
      .then(r => r.json())
      .then(setStages)
      .catch(() => {});
  }, [company]);

  const addReportTab = (report) => {
    const id = Date.now();
    setReportTabs(prev => [...prev, { ...report, id }]);
    setActivePage(`report_${id}`);
  };

  const closeReportTab = (id) => {
    setReportTabs(prev => prev.filter(r => r.id !== id));
    setActivePage("Dashboard");
  };

  const renderPage = () => {
    if (!company) {
      return (
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", height: "100%",
          flexDirection: "column", gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>⬡</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Connecting to Viro...</div>
          <div style={{ color: COLORS.muted, fontSize: 14 }}>
            Make sure the backend is running
          </div>
        </div>
      );
    }

    if (activePage.startsWith("report_")) {
      const id = parseInt(activePage.replace("report_", ""));
      const report = reportTabs.find(r => r.id === id);
      return report ? <ReportTab report={report} /> : <Dashboard company={company} />;
    }

    switch (activePage) {
      case "Dashboard": return <Dashboard company={company} filters={filters} />;
      case "Production Line": return <ProductionLine company={company} user={user} />;
      case "Predictive": return <Predictive company={company} />;
      case "Analytics": return <Analytics company={company} />;
      case "Vehicle Search": return <VehicleSearch company={company} />;
      case "Log Defect": return <LogDefect company={company} stages={stages} />;
      default: return <Dashboard company={company} />;
    }
  };

  if (!authChecked) return null;

  if (!user) return <Login onLogin={handleLogin} />;


  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: COLORS.bg,
      overflow: "hidden",
    }}>
      {/* Left sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        company={company}
        companies={companies}
        setCompany={setCompany}
        stats={stats}
        user={user}
        onLogout={handleLogout}
      />


      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Tab bar */}
        {reportTabs.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center",
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "0 16px",
            overflowX: "auto", flexShrink: 0,
          }}>
            {staticPages.includes(activePage) && (
              <div style={{
                padding: "12px 16px", fontSize: 13,
                color: COLORS.accentLight, fontWeight: 600,
                borderBottom: `2px solid ${COLORS.accent}`,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {activePage}
              </div>
            )}
            {reportTabs.map(tab => (
              <div key={tab.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 16px", fontSize: 13,
                color: activePage === `report_${tab.id}`
                  ? COLORS.accentLight : COLORS.muted,
                borderBottom: activePage === `report_${tab.id}`
                  ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                <span onClick={() => setActivePage(`report_${tab.id}`)}>
                  📊 {tab.title}
                </span>
                <span
                  onClick={() => closeReportTab(tab.id)}
                  style={{ color: COLORS.muted, fontSize: 14, padding: "0 2px" }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
          {renderPage()}
        </div>
      </div>

      {/* Right AI panel */}
      <AIPanel
        company={company}
        onNewReport={addReportTab}
        activePage={activePage}
        onFilterChange={setFilters}
        currentFilters={filters}
      />
    </div>
  );
}
