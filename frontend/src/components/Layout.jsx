const COLORS = {
    bg: "#060612",
    surface: "#0d0d1f",
    card: "#12122a",
    border: "#1e1e3a",
    accent: "#7c3aed",
    accentGlow: "#7c3aed33",
    accentLight: "#a78bfa",
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
    text: "#f1f5f9",
    muted: "#64748b",
  };
  
  export { COLORS };
  
  export function Card({ children, style = {}, accent = false }) {
    return (
      <div style={{
        background: COLORS.card,
        border: `1px solid ${accent ? COLORS.accent + "55" : COLORS.border}`,
        borderRadius: 16,
        padding: 24,
        position: "relative",
        overflow: "hidden",
        ...style
      }}>
        {accent && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${COLORS.accent}, transparent)`,
          }} />
        )}
        {children}
      </div>
    );
  }
  
  export function MetricCard({ label, value, sub, accent = false }) {
    return (
      <Card accent={accent}>
        <div style={{
          color: COLORS.muted, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8
        }}>
          {label}
        </div>
        <div style={{
          color: accent ? COLORS.accentLight : COLORS.text,
          fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 6
        }}>
          {value}
        </div>
        {sub && <div style={{ color: COLORS.muted, fontSize: 12 }}>{sub}</div>}
      </Card>
    );
  }
  
  export function PageHeader({ title, subtitle }) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 24, fontWeight: 800,
          letterSpacing: "-0.02em", marginBottom: 4
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ color: COLORS.muted, fontSize: 13 }}>{subtitle}</div>
        )}
      </div>
    );
  }
  
  export function SectionLabel({ children }) {
    return (
      <div style={{
        fontSize: 11, fontWeight: 700, color: COLORS.muted,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14
      }}>
        {children}
      </div>
    );
  }
  
  export function Badge({ children, color }) {
    return (
      <span style={{
        background: color + "20",
        color,
        border: `1px solid ${color}40`,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {children}
      </span>
    );
  }
  
  export function Button({ children, onClick, variant = "primary", style = {} }) {
    const styles = {
      primary: {
        background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
        color: "white",
        border: "none",
      },
      ghost: {
        background: COLORS.accentGlow,
        color: COLORS.accentLight,
        border: `1px solid ${COLORS.accent}44`,
      },
      danger: {
        background: "#ef444420",
        color: "#ef4444",
        border: "1px solid #ef444440",
      }
    };
  
    return (
      <button
        onClick={onClick}
        style={{
          ...styles[variant],
          borderRadius: 10,
          padding: "10px 20px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
          ...style
        }}
      >
        {children}
      </button>
    );
  }
  
  export function Input({ placeholder, value, onChange, style = {} }) {
    return (
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "12px 16px",
          color: COLORS.text,
          fontSize: 14,
          outline: "none",
          width: "100%",
          ...style
        }}
      />
    );
  }
  
  export function Divider() {
    return (
      <div style={{
        height: 1,
        background: COLORS.border,
        margin: "20px 0"
      }} />
    );
  }
  
  export function severityColor(s) {
    return { critical: COLORS.critical, high: COLORS.high, medium: COLORS.medium, low: COLORS.low }[s] || COLORS.muted;
  }
  
  export { COLORS as default };
  