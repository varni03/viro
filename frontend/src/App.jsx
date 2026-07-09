import { useState, useEffect, useMemo, useRef, Fragment } from "react";

// Cockpit clock — the mission-control heartbeat.
function StripClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const pad = n => String(n).padStart(2, "0");
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  );
}
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
import Dock from "./components/Dock";
import Omnibar from "./components/Omnibar";
import WorkspacesMenu from "./components/WorkspacesMenu";
import NotificationCenter from "./components/NotificationCenter";
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
  const [entityDashNonce, setEntityDashNonce] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [paneB, setPaneB] = useState(null);          // split view: second surface
  const [focusedPane, setFocusedPane] = useState("a");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState(null); // omnibar → copilot handoff
  const omnibarRef = useRef();

  const dockItems = useMemo(() => [
    ...(user?.role === "worker" ? [{ icon: "⬡", label: "Home", page: "Home" }] : [{ icon: "⬡", label: "Dashboard", page: "Dashboard" }]),
    ...(entities.length > 0
      ? entities.map(e => ({ icon: e.icon || "▦", label: e.name_plural || e.name, page: `entity:${e.entity_id}` }))
      : [{ icon: "🔧", label: "Production Line", page: "Production Line" }, { icon: "📊", label: "Analytics", page: "Analytics" }, { icon: "⚠️", label: "Predictive", page: "Predictive" }, { icon: "📸", label: "Log Defect", page: "Log Defect" }, { icon: "🔍", label: "Search", page: "Vehicle Search" }]),
    { icon: "📄", label: "Automations", page: "Automations" },
    { icon: "⚙️", label: "Settings", page: "Settings" },
  ], [user?.role, entities]);
  const dockItemsRef = useRef(dockItems);
  useEffect(() => { dockItemsRef.current = dockItems; }, [dockItems]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); omnibarRef.current?.focus(); return; }
      // ⌥-chords — skip while typing
      const tag = (e.target?.tagName || "").toLowerCase();
      if (!e.altKey || e.metaKey || e.ctrlKey || tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.code?.startsWith("Digit")) {
        const i = parseInt(e.code.slice(5), 10) - 1;
        const item = dockItemsRef.current[i];
        if (item) { e.preventDefault(); navRef.current(item.page); }
      } else if (e.code === "KeyS") { e.preventDefault(); splitRef.current(); }
      else if (e.code === "KeyC") { e.preventDefault(); setCopilotOpen(o => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Navigation targets the focused pane when split view is on.
  const nav = (page) => {
    if (paneB !== null && focusedPane === "b") setPaneB(page);
    else setActivePage(page);
    setSidebarOpen(false);
  };
  const toggleSplit = () => {
    if (paneB !== null) { setPaneB(null); setFocusedPane("a"); }
    else setPaneB(activePage === "Dashboard" ? "Automations" : "Dashboard");
  };
  const askViro = (q) => { setCopilotOpen(true); setPendingAsk({ q, ts: Date.now() }); };
  const navRef = useRef(nav); navRef.current = nav;
  const splitRef = useRef(toggleSplit); splitRef.current = toggleSplit;

  // Resizable split — drag the divider, remembered across sessions.
  const [splitRatio, setSplitRatio] = useState(() => {
    const v = parseFloat(localStorage.getItem("viro_split") || "0.5");
    return isNaN(v) ? 0.5 : Math.min(0.75, Math.max(0.25, v));
  });
  const stageRef = useRef();
  const startDivider = (e) => {
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (ev) => {
      const r = Math.min(0.75, Math.max(0.25, (ev.clientX - rect.left) / rect.width));
      setSplitRatio(r);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setSplitRatio(r => { localStorage.setItem("viro_split", String(r)); return r; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const swapPanes = () => {
    if (paneB === null) return;
    const t = activePage;
    setActivePage(paneB);
    setPaneB(t);
  };

  const dismissToast = (id) => setToasts(ts => ts.filter(t => t.id !== id));
  const pushToast = (t) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(ts => [...ts, { ...t, id }]);
    setTimeout(() => dismissToast(id), 9000);
  };

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

  // Pulse: Viro checks the live data for events (low stock, criticals) and
  // proactively drafts the matching paperwork; results surface as notifications.
  useEffect(() => {
    if (!company) return;
    const beat = () =>
      fetch(`${API}/pulse/${company.company_id}`, { method: "POST" })
        .then(r => r.json())
        .then(d => (d.events || []).forEach(ev => pushToast({
          title: ev.title ? `Viro drafted: ${ev.title}` : "Viro noticed something",
          reason: ev.reason,
          docId: ev.doc_id,
        })))
        .catch(() => {});
    beat();
    const interval = setInterval(beat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [company]); // eslint-disable-line

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

  const renderPage = (page = activePage) => {
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

    if (page.startsWith("report_")) {
      const id = parseInt(page.replace("report_", ""));
      const report = reportTabs.find(r => r.id === id);
      return report ? <ReportTab report={report} /> : <Dashboard company={company} />;
    }

    if (page.startsWith("entity:")) {
      const eid = page.slice("entity:".length);
      const entity = entities.find(e => e.entity_id === eid);
      return entity ? <EntityPage company={company} entity={entity} /> : <DynamicDashboard company={company} config={effectiveConfig} />;
    }

    switch (page) {
      case "Dashboard": return entities.length > 0
        ? <GenerativeDashboard company={company} entities={entities} onNavigate={nav} nonce={entityDashNonce} />
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
      case "Home": return <WorkerHome user={user} company={company} stats={stats} entities={entities} onNavigate={nav} />;
      case "Analytics": return <Analytics company={company} />;
      case "Automations": return <Automations company={company} />;
      case "Vehicle Search": return <VehicleSearch company={company} />;
      case "Log Defect": return <LogDefect company={company} stages={stages} />;
      case "Repair Queue": return <ProductionLine company={company} user={user} defaultView="queue" />;
      case "Settings": return <Settings company={company} user={user} entities={entities} onCompanyUpdate={(updates) => {
        setCompany(prev => ({ ...prev, ...updates }));
      }} />;
      default: return <Dashboard company={company} />;
    }
  };

  const pageLabel = (page) =>
    page.startsWith("entity:")
      ? (entities.find(e => `entity:${e.entity_id}` === page)?.name_plural || "Records")
      : page.startsWith("report_") ? "Report" : page;

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

      {/* Pulse toasts — Viro acting on its own, sliding in like mission control */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, width: 360, maxWidth: "calc(100vw - 36px)" }}>
          {toasts.map(t => (
            <div key={t.id}
              onClick={() => { dismissToast(t.id); if (t.docId) nav("Automations"); }}
              style={{
                display: "flex", gap: 12, padding: "14px 16px", cursor: t.docId ? "pointer" : "default",
                background: "rgba(20,21,23,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                animation: "toast-in .45s cubic-bezier(.16,1,.3,1) both",
              }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.85)", fontSize: 14 }}>✦</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3, color: "#fff" }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>{t.reason}{t.docId ? " · click to review" : ""}</div>
              </div>
              <span onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, cursor: "pointer", lineHeight: 1 }}>✕</span>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar is now a summonable drawer (☰) — the cockpit owns navigation */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 40 }}
        />
      )}
      <div style={{
        position: "fixed",
        left: sidebarOpen ? 0 : -260,
        top: 0,
        zIndex: 50,
        transition: "left 0.25s cubic-bezier(.16,1,.3,1)",
        height: "100vh",
        boxShadow: sidebarOpen ? "30px 0 80px rgba(0,0,0,0.45)" : "none",
      }}>
        <Sidebar
          activePage={activePage}
          setActivePage={nav}
          company={company}
          companies={companies}
          setCompany={setCompany}
          stats={stats}
          user={user}
          entities={entities}
          onLogout={handleLogout}
          onOpenPalette={() => { setSidebarOpen(false); omnibarRef.current?.focus(); }}
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

        {/* Command strip — the cockpit's top rail */}
        {!isMobile && !isTablet && (
          <div style={{
            display: "flex", alignItems: "center", gap: 14, height: 52, padding: "0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", flexShrink: 0,
          }}>
            <button onClick={() => setSidebarOpen(true)} title="Menu" style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 9, padding: "6px 10px", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", lineHeight: 1,
            }}>☰</button>
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 100 100"><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>{company?.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>LIVE</span>
              </span>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <Omnibar
                ref={omnibarRef}
                company={company}
                entities={entities}
                pages={entities.length > 0
                  ? [{ icon: "⬡", label: "Dashboard", page: "Dashboard" }, { icon: "📄", label: "Automations", page: "Automations" }, { icon: "⚙️", label: "Settings", page: "Settings" }]
                  : [{ icon: "⬡", label: "Dashboard", page: "Dashboard" }, { icon: "🔧", label: "Production Line", page: "Production Line" }, { icon: "📊", label: "Analytics", page: "Analytics" }, { icon: "⚠️", label: "Predictive", page: "Predictive" }, { icon: "📸", label: "Log Defect", page: "Log Defect" }, { icon: "🔍", label: "Search", page: "Vehicle Search" }, { icon: "📄", label: "Automations", page: "Automations" }, { icon: "⚙️", label: "Settings", page: "Settings" }]}
                onNavigate={nav}
                onAsk={askViro}
              />
            </div>
            <NotificationCenter company={company} />
            <WorkspacesMenu
              companyId={company?.company_id}
              current={{ a: activePage, b: paneB }}
              onApply={(w) => { setActivePage(w.a); setPaneB(w.b ?? null); setFocusedPane("a"); }}
              pageLabel={pageLabel}
            />
            <StripClock />
            <div title={`${user?.first_name || ""} ${user?.last_name || ""} · ${user?.role || ""}`} style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)",
            }}>{`${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "V"}</div>
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

        {/* The stage — floating glass panes, split-capable, resizable */}
        {!isMobile && !isTablet ? (
          <div ref={stageRef} className="vc-stage-bg" style={{ flex: 1, display: "flex", padding: "16px 16px 76px", overflow: "hidden" }}>
            {[["a", activePage], ...(paneB !== null ? [["b", paneB]] : [])].map(([paneId, page], idx) => (
              <Fragment key={paneId}>
                {idx === 1 && (
                  <div onMouseDown={startDivider}
                    style={{ width: 14, flexShrink: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 3, height: 44, borderRadius: 3, background: "rgba(255,255,255,0.14)" }} />
                  </div>
                )}
                <div
                  onMouseDown={() => setFocusedPane(paneId)}
                  className={"vc-pane" + (paneB !== null && focusedPane === paneId ? " focused" : "")}
                  style={{
                    flexGrow: paneB === null ? 1 : (paneId === "a" ? splitRatio : 1 - splitRatio),
                    flexBasis: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                    {paneB !== null && <span style={{ width: 6, height: 6, borderRadius: "50%", background: focusedPane === paneId ? "#fff" : "rgba(255,255,255,0.2)" }} />}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                      {pageLabel(page)}
                    </span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                      {paneB !== null && paneId === "a" && (
                        <span onClick={swapPanes} title="Swap panes" style={{ cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>⇄</span>
                      )}
                      {paneId === "b" && (
                        <span onClick={() => { setPaneB(null); setFocusedPane("a"); }} style={{ cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>✕</span>
                      )}
                    </span>
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: "24px 26px" }}>
                    <div key={page} className="viro-page">
                      {renderPage(page)}
                    </div>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px" : "20px 24px" }}>
            <div key={activePage} className="viro-page">
              {renderPage()}
            </div>
          </div>
        )}
      </div>

      {/* The dock — primary navigation */}
      {!isMobile && !isTablet && (
        <Dock
          items={dockItems.map((it, i) => (i < 9 ? { ...it, label: `${it.label} — ⌥${i + 1}` } : it))}
          activePages={[activePage, ...(paneB !== null ? [paneB] : [])]}
          onSelect={nav}
          splitActive={paneB !== null}
          onToggleSplit={toggleSplit}
          copilotOpen={copilotOpen}
          onToggleCopilot={() => setCopilotOpen(o => !o)}
        />
      )}

      {/* Copilot — a summonable drawer, not a permanent strip */}
      {(!isMobile && !isTablet) ? (
        copilotOpen && (
          <div style={{
            position: "fixed", top: 62, right: 14, bottom: 76, width: 400, zIndex: 90,
            borderRadius: 18, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.13)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
            animation: "vc-drawer .28s cubic-bezier(.16,1,.3,1)",
            background: "rgba(14,15,17,0.97)",
          }}>
            <button onClick={() => setCopilotOpen(false)} style={{
              position: "absolute", top: 12, right: 12, zIndex: 95,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "4px 9px", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer",
            }}>✕</button>
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
              hasEntities={entities.length > 0}
              onEntityReshaped={() => setEntityDashNonce(n => n + 1)}
              pendingAsk={pendingAsk}
            />
          </div>
        )
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