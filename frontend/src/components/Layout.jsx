export const COLORS = {
  bg: "#08090a",
  surface: "rgba(255,255,255,0.02)",
  card: "rgba(255,255,255,0.05)",
  cardHover: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#ffffff",
  accentGlow: "rgba(255,255,255,0.06)",
  accentLight: "#e4e4e7",
  critical: "#ff4444",
  high: "#ff8800",
  medium: "#ffcc00",
  low: "#00dd66",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
  mutedLight: "rgba(255,255,255,0.65)",
};

export function AuroraBackground() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #08090a;
          color: #ffffff;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.08); }
        }

        .viro-page { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.14) !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
        }

        .nav-item {
          border-radius: 10px;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .nav-item.active {
          background: rgba(255,255,255,0.1) !important;
          color: #ffffff !important;
        }

        .viro-btn {
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .viro-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .viro-btn:active {
          transform: scale(0.97);
        }

        .viro-input {
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .viro-input:focus {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(255,255,255,0.2) !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }
        .viro-input::placeholder { color: rgba(255,255,255,0.25); }

        .tab-btn {
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.06) !important;
          color: rgba(255,255,255,0.8) !important;
        }
        .tab-btn.active {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.12) !important;
          color: #ffffff !important;
        }

        select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px;
          color: white;
          transition: all 0.18s ease;
        }
        select:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.14) !important;
        }
        select option { background: #111113; color: white; }

        button { font-family: inherit; }
        input, textarea { font-family: inherit; }
      `}</style>

      {/* Deep background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
      }} />

      {/* Floating orbs */}
      {[
        { color: "rgba(255,255,255,0.05)", x: "20%", y: "25%", w: 700, h: 500, dur: "20s" },
        { color: "rgba(255,255,255,0.035)", x: "80%", y: "70%", w: 600, h: 600, dur: "28s" },
        { color: "rgba(255,255,255,0.025)", x: "60%", y: "15%", w: 400, h: 400, dur: "24s" },
      ].map((orb, i) => (
        <div key={i} style={{
          position: "fixed",
          left: orb.x, top: orb.y,
          width: orb.w, height: orb.h,
          background: orb.color,
          borderRadius: "50%",
          filter: "blur(80px)",
          animation: `float ${orb.dur} ease-in-out infinite`,
          animationDelay: `${i * 4}s`,
          transform: "translate(-50%, -50%)",
          zIndex: 0,
          pointerEvents: "none",
        }} />
      ))}
    </>
  );
}

export function PulseDot({ color = COLORS.critical, size = 7 }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color,
        animation: "pulse-ring 2s ease-out infinite",
        opacity: 0.5,
      }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
      }} />
    </div>
  );
}

export function Card({ children, style = {}, accent = false, glass = true }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
        position: "relative",
        overflow: "hidden",
        ...style,
        ...(accent ? {
          borderColor: "rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.07)",
        } : {})
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        }} />
      )}
      {children}
    </div>
  );
}

export function MetricCard({ label, value, sub, accent = false, icon }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }} />
      )}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {label}
        </div>
        {icon && <span style={{ fontSize: 15, opacity: 0.3 }}>{icon}</span>}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 29, fontWeight: 700,
        color: "#ffffff",
        letterSpacing: "-0.02em",
        lineHeight: 1, marginBottom: 8,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{sub}</div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      marginBottom: 28,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}>
      <div>
        <h1 style={{
          fontSize: 23, fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#ffffff", margin: 0,
          marginBottom: subtitle ? 5 : 0,
          lineHeight: 1.15,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13, margin: 0, fontWeight: 400,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && action}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, fontWeight: 600,
      color: "rgba(255,255,255,0.35)",
      letterSpacing: "0.12em", textTransform: "uppercase",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

export function Badge({ children, color }) {
  return (
    <span style={{
      background: color + "18",
      color,
      border: `1px solid ${color}30`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 10, fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    }}>
      {children}
    </span>
  );
}

export function Button({
  children, onClick, variant = "primary",
  style = {}, disabled = false
}) {
  const styles = {
    primary: {
      background: "rgba(255,255,255,0.95)",
      color: "#050507",
      border: "none",
      fontWeight: 600,
    },
    ghost: {
      background: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.7)",
      border: "1px solid rgba(255,255,255,0.1)",
    },
    danger: {
      background: "rgba(255,68,68,0.1)",
      color: "#ff4444",
      border: "1px solid rgba(255,68,68,0.2)",
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="viro-btn"
      style={{
        ...styles[variant],
        borderRadius: 10,
        padding: "9px 16px",
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        letterSpacing: "-0.01em",
        ...style
      }}
    >
      {children}
    </button>
  );
}

export function Input({ placeholder, value, onChange, style = {}, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="viro-input"
      style={{
        borderRadius: 10,
        padding: "10px 14px",
        color: "#ffffff",
        fontSize: 14,
        width: "100%",
        fontFamily: "inherit",
        letterSpacing: "-0.01em",
        ...style
      }}
    />
  );
}

export function Divider() {
  return (
    <div style={{
      height: 1,
      background: "rgba(255,255,255,0.06)",
      margin: "16px 0",
    }} />
  );
}

export function GlowCard({ children, color = "#ffffff", style = {} }) {
  return (
    <div className="glass-card" style={{ padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function severityColor(s) {
  return {
    critical: COLORS.critical,
    high: COLORS.high,
    medium: COLORS.medium,
    low: COLORS.low
  }[s] || COLORS.muted;
}

export default COLORS;
