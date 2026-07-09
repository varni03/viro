import { useState, useEffect } from "react";
import { COLORS } from './Layout';

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: "⬡", page: "Dashboard" },
  { id: "search", label: "Search", icon: "🔍", page: "Vehicle Search" },
  { id: "log_issue", label: "Log Issue", icon: "📸", page: "Log Defect" },
  { id: "workflow", label: "Workflow", icon: "🔧", page: "Production Line" },
  { id: "analytics", label: "Analytics", icon: "📊", page: "Analytics" },
  { id: "predictive", label: "Predictive Risk", icon: "⚠️", page: "Predictive" },
  { id: "repair", label: "Repair Queue", icon: "🔨", page: "Repair Queue" },
  { id: "settings", label: "Settings", icon: "⚙️", page: "Settings" },
];

const WORKER_MODULES = ["log_issue", "search"];
const REPAIR_MODULES = ["workflow", "search"];

export default function Sidebar({
  activePage, setActivePage, company, companies,
  setCompany, stats, user, onLogout, entities = [], onOpenPalette
}) {
  const [modules, setModules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("viro_rail") === "1");
  const toggleRail = () => setCollapsed(c => { localStorage.setItem("viro_rail", c ? "0" : "1"); return !c; });

  useEffect(() => {
    if (!company) return;
    fetch(`https://web-production-0457e.up.railway.app/modules/${company.company_id}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setModules(data.filter(m => m.enabled));
        } else {
          setModules(ALL_MODULES.map(m => ({ module_id: m.id, custom_label: m.label, custom_icon: m.icon, enabled: 1 })));
        }
      })
      .catch(() => {
        setModules(ALL_MODULES.map(m => ({ module_id: m.id, custom_label: m.label, custom_icon: m.icon, enabled: 1 })));
      });
  }, [company?.company_id]);

  useEffect(() => {
    if (!company) return;
    const fetchNotifications = () => {
      fetch(`https://web-production-0457e.up.railway.app/notifications/${company.company_id}`)
        .then(r => r.json())
        .then(setNotifications)
        .catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [company?.company_id]);

  const unreadCount = notifications.filter(n => n.read === 0).length;

  const markAllRead = () => {
    fetch(`https://web-production-0457e.up.railway.app/notifications/${company.company_id}/read-all`, {
      method: "PUT"
    }).then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    });
  };

  const getNavItems = () => {
    if (user?.role === "worker") {
      if (entities && entities.length) {
        return [
          { id: "home", label: "Home", icon: "⬡", page: "Home" },
          ...entities.map(e => ({ id: "entity:" + e.entity_id, label: e.name_plural || e.name, icon: e.icon || "▦", page: "entity:" + e.entity_id })),
        ];
      }
      return [
        { id: "home", label: "Home", icon: "⬡", page: "Home" },
        ...ALL_MODULES.filter(m => WORKER_MODULES.includes(m.id)),
      ];
    }
    if (user?.role === "repair") {
      return ALL_MODULES.filter(m => REPAIR_MODULES.includes(m.id));
    }
    // Generative company: nav is built from the company's own entities.
    if (entities && entities.length) {
      return [
        { id: "dashboard", label: "Dashboard", icon: "⬡", page: "Dashboard" },
        ...entities.map(e => ({ id: "entity:" + e.entity_id, label: e.name_plural || e.name, icon: e.icon || "▦", page: "entity:" + e.entity_id })),
        { id: "automations", label: "Automations", icon: "📄", page: "Automations" },
        { id: "settings", label: "Settings", icon: "⚙️", page: "Settings" },
      ];
    }

    const items = modules.map(m => {
      const base = ALL_MODULES.find(am => am.id === m.module_id);
      return base ? {
        ...base,
        label: m.custom_label || base.label,
        icon: m.custom_icon || base.icon,
      } : null;
    }).filter(Boolean);
    // Automations is a built-in manager/admin surface (one assistant per role).
    if (!items.some(i => i.page === "Automations")) {
      items.push({ id: "automations", label: "Automations", icon: "📄", page: "Automations" });
    }
    return items;
  };

  const navItems = getNavItems();

  const workspaceItems = navItems.filter(i => !["Settings", "Automations"].includes(i.page));
  const systemItems = navItems.filter(i => ["Settings", "Automations"].includes(i.page));

  const NavItem = ({ item }) => {
    const isActive = activePage === item.page;
    return (
      <div
        onClick={() => setActivePage(item.page)}
        className={`nav-item ${isActive ? "active" : ""}`}
        title={collapsed ? item.label : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px 0" : "9px 11px",
          marginBottom: 2, position: "relative",
          color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
          fontSize: 13, fontWeight: isActive ? 600 : 400,
          letterSpacing: "-0.01em",
        }}
      >
        {isActive && <span style={{ position: "absolute", left: collapsed ? 2 : -8, top: 8, bottom: 8, width: 2, borderRadius: 2, background: "#fff" }} />}
        <span style={{ width: 16, textAlign: "center", fontSize: 14, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
        {!collapsed && item.label}
      </div>
    );
  };
  const Eyebrow = ({ children }) => collapsed ? <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 10px" }} /> : (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: "0.16em", color: "rgba(255,255,255,0.25)", padding: "12px 12px 6px" }}>{children}</div>
  );

  return (
    <div style={{
      width: collapsed ? 64 : 240,
      transition: "width .25s cubic-bezier(.16,1,.3,1)",
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: "100vh",
      position: "relative",
    }}>


      {/* Brand */}
      <div style={{ padding: collapsed ? "20px 0 12px" : "20px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{
            width: 30, height: 30, background: "#fff", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 100 100">
              <polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" />
            </svg>
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {company?.name || "Viro"}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5,
                letterSpacing: "0.12em", color: "rgba(255,255,255,0.32)",
              }}>
                GENERATED BY VIRO
              </div>
            </div>
          )}
          {!collapsed && (
            <button onClick={toggleRail} title="Collapse" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, padding: 4 }}>«</button>
          )}
        </div>
        {collapsed && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={toggleRail} title="Expand" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, padding: 4 }}>»</button>
          </div>
        )}
      </div>


      {/* Company selector — admin only */}
      {user?.role === "admin" && !collapsed && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 6, paddingLeft: 4 }}>
            COMPANY
          </div>
          <select
            value={company?.company_id || ""}
            onChange={e => {
              const selected = companies.find(c => c.company_id === e.target.value);
              setCompany(selected);
            }}
            style={{
              width: "100%",
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "10px 14px",
              color: COLORS.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {companies.map(c => (
              <option key={c.company_id} value={c.company_id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />
      {/* Nav */}
      <div style={{ flex: 1, padding: collapsed ? "4px 8px" : "4px 12px", overflowY: "auto", overflowX: "hidden" }}>
        <Eyebrow>WORKSPACE</Eyebrow>
        {workspaceItems.map(item => <NavItem key={item.id} item={item} />)}
        {systemItems.length > 0 && (
          <>
            <Eyebrow>SYSTEM</Eyebrow>
            {systemItems.map(item => <NavItem key={item.id} item={item} />)}
          </>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

      {/* Notifications bell */}
      {!collapsed && (user?.role === "manager" || user?.role === "admin") ? (
        <div style={{ padding: "12px 16px" }}>
          <div
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              background: COLORS.card,
              border: `1px solid ${unreadCount > 0 ? COLORS.critical + "44" : COLORS.border}`,
              borderRadius: 10, padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <span style={{ fontSize: 12, color: COLORS.muted }}>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <div style={{
                background: COLORS.critical,
                color: "white",
                borderRadius: 10, padding: "2px 7px",
                fontSize: 11, fontWeight: 700,
              }}>
                {unreadCount}
              </div>
            )}
          </div>

          {/* Notification dropdown */}
          {showNotifications && (
            <div style={{
              position: "absolute",
              bottom: 160, left: 16, right: 16,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              maxHeight: 300, overflowY: "auto",
              zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    onClick={markAllRead}
                    style={{ fontSize: 11, color: COLORS.accentLight, cursor: "pointer" }}
                  >
                    Mark all read
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: 16, color: COLORS.muted, fontSize: 12, textAlign: "center" }}>
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 20).map((n, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      fetch(`https://web-production-0457e.up.railway.app/notifications/${n.notification_id}/read`, { method: "PUT" });
                      setNotifications(prev => prev.map(notif =>
                        notif.notification_id === n.notification_id ? { ...notif, read: 1 } : notif
                      ));
                    }}
                    style={{
                      padding: "10px 16px",
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: n.read === 0 ? COLORS.accentGlow : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: n.read === 0 ? 700 : 400, color: COLORS.text, marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Live stats */}
      {!collapsed && <div style={{ padding: "12px 16px" }}>
      <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.low, boxShadow: `0 0 7px ${COLORS.low}` }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: COLORS.muted, letterSpacing: "0.12em", fontWeight: 600 }}>
              LIVE STATUS
            </span>
          </div>
          {[
            { label: "Products", value: stats?.total_products || 0, color: COLORS.text },
            { label: "Unresolved", value: stats?.unresolved || 0, color: COLORS.high },
            { label: "At Risk", value: stats?.at_risk || 0, color: COLORS.critical },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 7,
            }}>
              <span style={{ fontSize: 12, color: COLORS.muted }}>{s.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>}

      {/* ⌘K launcher (clickable — works even when the browser owns the shortcut) */}
      <div onClick={() => onOpenPalette && onOpenPalette()} className="nav-item"
        title={collapsed ? "Jump anywhere (⌘K)" : undefined}
        style={{ margin: "0 12px 10px", padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 7, cursor: "pointer" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "2px 6px" }}>⌘K</span>
        {!collapsed && <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>Jump anywhere</span>}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

      {/* User profile */}
      {collapsed ? (
        <div style={{ padding: "0 0 14px", textAlign: "center" }}>
          <button onClick={onLogout} title="Log out" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 9px", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer" }}>⏻</button>
        </div>
      ) : (
        <div style={{
          margin: "12px 12px 12px",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{
              fontSize: 10, color: COLORS.accentLight,
              textTransform: "uppercase", letterSpacing: "0.06em"
            }}>
              {user?.role}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "4px 10px",
              color: "rgba(255,255,255,0.4)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Out
          </button>
        </div>
      )}
    </div>
  );
}
