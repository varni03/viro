import { COLORS } from './Layout';

const managerItems = [
  { label: "Dashboard", icon: "⬡" },
  { label: "Vehicle Search", icon: "🔍" },
  { label: "Log Defect", icon: "📸" },
  { label: "Production Line", icon: "🔧" },
  { label: "Analytics", icon: "📊" },
  { label: "Predictive", icon: "⚠" },
  { label: "Settings", icon: "⚙️" },
];

const workerItems = [
  { label: "Vehicle Search", icon: "🔍" },
  { label: "Log Defect", icon: "📸" },
];

const repairItems = [
  { label: "Production Line", icon: "🔧" },
  { label: "Vehicle Search", icon: "🔍" },
];


export default function Sidebar({
  activePage, setActivePage, company, companies,
  setCompany, stats, user, onLogout
}) {

const navItems = user?.role === "worker" ? workerItems 
  : user?.role === "repair" ? repairItems 
  : managerItems;


  return (
    <div style={{
      width: 230,
      background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: "100vh",
    }}>
      {/* Logo */}
<div style={{ padding: "24px 24px 20px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 36, height: 36,
      background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
      borderRadius: 10,
      display: "flex", alignItems: "center",
      justifyContent: "center",
      fontSize: 18, fontWeight: 800,
    }}>
      ⬡
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
        {company?.name || "Viro"}
      </div>
      <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Powered by Viro
      </div>
    </div>
  </div>
</div>


      {/* Company selector — admin only */}
{user?.role === "admin" && (
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
      <div style={{ height: 1, background: COLORS.border, marginBottom: 8 }} />

      {/* Nav */}
      <div style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
        {navItems.map(item => {
          const isActive = activePage === item.label;
          return (
            <div
              key={item.label}
              onClick={() => setActivePage(item.label)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                cursor: "pointer", marginBottom: 2,
                background: isActive ? COLORS.accentGlow : "transparent",
                border: isActive ? `1px solid ${COLORS.accent}44` : "1px solid transparent",
                color: isActive ? COLORS.accentLight : COLORS.muted,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: COLORS.border }} />

      {/* Live stats */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
            LIVE STATUS
          </div>
          {[
            { label: "Products", value: stats?.total_products || 0, color: COLORS.text },
            { label: "Unresolved", value: stats?.unresolved || 0, color: COLORS.high },
            { label: "At Risk", value: stats?.at_risk || 0, color: COLORS.critical },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}>
              <span style={{ fontSize: 12, color: COLORS.muted }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: COLORS.border }} />

      {/* User profile */}
      <div style={{
        margin: "12px 16px 16px",
        padding: "12px 14px",
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
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
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: "4px 10px",
            color: COLORS.muted,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          Out
        </button>
      </div>

    </div>
  );
}
