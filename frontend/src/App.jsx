import { useState, useEffect, useMemo } from "react";
import { getCompanies, getAtRisk, getDefects, getProducts } from "./api/client";
import Sidebar from "./components/Sidebar";
import AIPanel from "./components/AIPanel";
import Dashboard from "./pages/Dashboard";
import Predictive from "./pages/Predictive";
import Analytics from "./pages/Analytics";
import VehicleSearch from "./pages/VehicleSearch";
import LogDefect from "./pages/LogDefect";
import { COLORS, AuroraBackground } from "./components/Layout";
import Login from "./pages/Login";
import ProductionLine from "./pages/ProductionLine";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Landing from "./pages/Landing";
import Automations from "./pages/Automations";
import WorkerHome from "./pages/WorkerHome";
import EntityPage from "./pages/EntityPage";
import GenerativeDashboard from "./pages/GenerativeDashboard";
import { useBreakpoint } from "./hooks/useBreakpoint";
import DynamicDashboard from "./pages/DynamicDashboard";
import { buildDefaultConfig } from "./pages/defaultConfig";

const API = "https://web-production-0457e.up.railway.app";


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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [stages, setStages] = useState([]);
  const [stats, setStats] = useState({});
  const [reportTabs, setReportTabs] = useState([]);
  const [dashboardConfig, setDashboardConfig] = useState(null); // null = use the generated base
  const [terminology, setTerminology] = useState(null);
  const [views, setViews] = useState([]);
  const [activeViewId, setActiveViewId] = useState("base");
  const [entities, setEntities] = useState([]);

  const [filters, setFilters] = useState({
    dateRange: null,
    stages: [],
    severities: [],
    status: null,
    defectType: null,
    productId: null,
  });

  const [prefs, setPrefs] = useState({
    font_size: "normal",
    density: "normal",
    dashboard_columns: 3,
    default_severity_filter: "all",
  });


  const { isMobile, isTablet } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  

  const staticPages = ["Home", "Dashboard", "Vehicle Search", "Log Defect", "Analytics", "Predictive", "Automations"];

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
    localStorage.setItem("viro_company_id", userData.company_id);
  };

  // Per-role landing: floor workers open straight into their glove-friendly home.
  useEffect(() => {
    if (user?.role === "worker") setActivePage("Home");
  }, [user]);
  
  
  const handleLogout = () => {
    localStorage.removeItem("viro_token");
    localStorage.removeItem("viro_user");
    localStorage.removeItem("viro_company_id");
    setUser(null);
    setToken(null);
    setShowLogin(false);      // return to the landing, not the login screen
    setShowOnboarding(false);
    setActivePage("Dashboard");
  };
  

  useEffect(() => {
    getCompanies()
      .then(res => {
        setCompanies(res.data);
        const savedCompanyId = localStorage.getItem("viro_company_id");
        const savedCompany = savedCompanyId
          ? res.data.find(c => c.company_id === savedCompanyId)
          : null;
        setCompany(savedCompany || res.data.find(c => c.company_id === user?.company_id) || res.data[0]);
      })
      .catch(() => {});
  }, [user]);
  

  useEffect(() => {
    if (!company) return;
    fetch(`https://web-production-0457e.up.railway.app/prefs/${company.company_id}`)
    .then(r => r.json())
    .then(setPrefs)
    .catch(() => {});


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

    fetch(`https://web-production-0457e.up.railway.app/stages/${company.company_id}`)
      .then(r => r.json())
      .then(setStages)
      .catch(() => {});

    fetch(`${API}/config/${company.company_id}`)
      .then(r => r.json())
      .then(setTerminology)
      .catch(() => {});

    fetch(`${API}/entities/${company.company_id}`)
      .then(r => r.json())
      .then(d => setEntities(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [company]);

  // Each company's base dashboard is derived from ITS OWN stages + terminology.
  const baseConfig = useMemo(() => buildDefaultConfig({ company, stages, terminology }), [company, stages, terminology]);
  const effectiveConfig = dashboardConfig || baseConfig;

  // Load saved dashboard views; open the default if one exists.
  useEffect(() => {
    if (!company) return;
    fetch(`${API}/dashboard-views/${company.company_id}`)
      .then(r => r.json())
      .then(vs => {
        const list = Array.isArray(vs) ? vs : [];
        setViews(list);
        const def = list.find(v => v.is_default);
        if (def) { setDashboardConfig(def.config); setActiveViewId(def.view_id); }
        else { setDashboardConfig(null); setActiveViewId("base"); }
      })
      .catch(() => {});
  }, [company]);

  const refreshViews = async () => {
    const vs = await fetch(`${API}/dashboard-views/${company.company_id}`).then(r => r.json());
    const list = Array.isArray(vs) ? vs : [];
    setViews(list);
    return list;
  };
  const switchView = (v) => {
    if (v === "base") { setDashboardConfig(null); setActiveViewId("base"); }
    else { setDashboardConfig(v.config); setActiveViewId(v.view_id); }
  };
  const saveCurrentView = async (name) => {
    await fetch(`${API}/dashboard-views/${company.company_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, config: effectiveConfig, make_default: views.length === 0 }),
    });
    const list = await refreshViews();
    const saved = list.find(v => v.name === name);
    if (saved) setActiveViewId(saved.view_id);
  };
  const deleteView = async (viewId) => {
    await fetch(`${API}/dashboard-views/${viewId}`, { method: "DELETE" });
    await refreshViews();
    if (activeViewId === viewId) switchView("base");
  };
  const setDefaultView = async (viewId) => {
    await fetch(`${API}/dashboard-views/${company.company_id}/default/${viewId}`, { method: "PUT" });
    await refreshViews();
  };

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

    if (activePage.startsWith("entity:")) {
      const eid = activePage.slice("entity:".length);
      const entity = entities.find(e => e.entity_id === eid);
      return entity ? <EntityPage company={company} entity={entity} /> : <DynamicDashboard company={company} config={effectiveConfig} />;
    }

    switch (activePage) {
      case "Dashboard": return entities.length > 0
        ? <GenerativeDashboard company={company} entities={entities} onNavigate={setActivePage} />
        : <DynamicDashboard
            company={company}
            config={effectiveConfig}
            views={views}
            activeViewId={activeViewId}
            onSwitchView={switchView}
            onSaveView={saveCurrentView}
            onDeleteView={deleteView}
            onSetDefault={setDefaultView}
          />;
      case "Production Line": return <ProductionLine company={company} user={user} />;
      case "Predictive": return <Predictive company={company} />;
      case "Home": return <WorkerHome user={user} company={company} stats={stats} onNavigate={setActivePage} />;
      case "Analytics": return <Analytics company={company} />;
      case "Automations": return <Automations company={company} />;
      case "Vehicle Search": return <VehicleSearch company={company} />;
      case "Log Defect": return <LogDefect company={company} stages={stages} />;
      case "Repair Queue": return <ProductionLine company={company} user={user} defaultView="queue" />;
      case "Settings": return <Settings company={company} user={user} onCompanyUpdate={(updates) => {
        setCompany(prev => ({ ...prev, ...updates }));
      }} />;     
      default: return <Dashboard company={company} />;
    }
  };

  if (!authChecked) return null;

  if (showOnboarding) return (
    <Onboarding onComplete={(userData, token) => {
      setShowOnboarding(false);
      handleLogin(userData, token);
    }} />
  );
  

  if (!user) {
    if (showLogin) return (
      <Login
        onLogin={handleLogin}
        onSignup={() => setShowOnboarding(true)}
        onBack={() => setShowLogin(false)}
      />
    );
    return (
      <Landing
        onSignIn={() => setShowLogin(true)}
        onGetStarted={() => setShowOnboarding(true)}
      />
    );
  }
  


  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: COLORS.bg,
      overflow: "hidden",
      position: "relative",
    }}>
      <AuroraBackground />

      {/* Mobile/Tablet overlay when sidebar open */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        />
      )}

      {/* Left sidebar */}
      <div style={{
        position: isMobile || isTablet ? "fixed" : "relative",
        left: isMobile || isTablet ? (sidebarOpen ? 0 : -240) : 0,
        zIndex: 50,
        transition: "left 0.25s ease",
        height: "100vh",
        flexShrink: 0,
      }}>
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            if (isMobile || isTablet) setSidebarOpen(false);
          }}
          company={company}
          companies={companies}
          setCompany={setCompany}
          stats={stats}
          user={user}
          entities={entities}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, position: "relative", zIndex: 1 }}>


        {/* Mobile/Tablet top bar */}
        {(isMobile || isTablet) && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8, padding: "8px 12px",
                color: COLORS.text, fontSize: 16,
                cursor: "pointer", lineHeight: 1,
              }}
            >
              ☰
            </button>

            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>
              {company?.name || "Viro"}
            </div>

            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              style={{
                background: aiPanelOpen ? COLORS.accentGlow : COLORS.card,
                border: `1px solid ${aiPanelOpen ? COLORS.accent + "44" : COLORS.border}`,
                borderRadius: 8, padding: "8px 12px",
                color: aiPanelOpen ? COLORS.accentLight : COLORS.muted,
                fontSize: 16, cursor: "pointer",
              }}
            >
              🤖
            </button>
          </div>
        )}

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
        <div style={{
          flex: 1, overflow: "auto",
          padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px",
        }}>
          {renderPage()}
        </div>
      </div>

      {/* Right AI panel */}
      {(!isMobile && !isTablet) ? (
        <AIPanel
        company={company}
        onNewReport={addReportTab}
        activePage={activePage}
        onFilterChange={setFilters}
        currentFilters={filters}
        prefs={prefs}
        onPrefsChange={setPrefs}
        onReshape={setDashboardConfig}
        currentConfig={effectiveConfig}
      />

      ) : (
        aiPanelOpen && (
          <div style={{
            position: "fixed",
            right: 0, top: 0, bottom: 0,
            width: isMobile ? "100%" : 360,
            zIndex: 50,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.4)",
          }}>
            <div style={{ position: "relative", height: "100%" }}>
              <button
                onClick={() => setAiPanelOpen(false)}
                style={{
                  position: "absolute",
                  top: 16, left: -40,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px 0 0 8px",
                  padding: "8px 10px",
                  color: COLORS.muted,
                  cursor: "pointer", fontSize: 14,
                  zIndex: 51,
                }}
              >
                ✕
              </button>
              <AIPanel
                company={company}
                onNewReport={addReportTab}
                activePage={activePage}
                onFilterChange={setFilters}
                currentFilters={filters}
                prefs={prefs}
                onPrefsChange={setPrefs}
                onReshape={setDashboardConfig}
                currentConfig={effectiveConfig}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}