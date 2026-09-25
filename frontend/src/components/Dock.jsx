const MONO = "'JetBrains Mono', monospace";

// The macOS-style dock: primary navigation for the cockpit.
export default function Dock({ items, activePages = [], onSelect, splitActive, onToggleSplit, copilotOpen, onToggleCopilot }) {
  const Item = ({ icon, label, onClick, active, glow }) => (
    <div onClick={onClick} className="vc-dock-item" title={label}
      style={{
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: glow ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
        border: `1px solid rgba(255,255,255,${glow ? 0.22 : 0.09})`,
        fontSize: 19, position: "relative",
      }}>
      {icon}
      {active && <span style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: "var(--vx, #fff)", boxShadow: "0 0 5px var(--vx, #fff)" }} />}
    </div>
  );

  return (
    <div style={{
      position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 80,
      display: "flex", alignItems: "center", gap: 6, padding: "9px 11px",
      background: "rgba(14,15,17,0.82)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20,
      boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
      animation: "vc-dock-in .45s cubic-bezier(.16,1,.3,1)",
    }}>
      {items.map((it, i) => (
        <Item key={i} icon={it.icon} label={it.label}
          onClick={() => onSelect(it.page)}
          active={activePages.includes(it.page)} />
      ))}
      <div style={{ width: 1, alignSelf: "stretch", margin: "6px 4px", background: "rgba(255,255,255,0.1)" }} />
      <Item icon={<span style={{ fontFamily: MONO, fontSize: 15 }}>⧉</span>} label={splitActive ? "Close split" : "Split view"} onClick={onToggleSplit} glow={splitActive} />
      <Item icon="✦" label={copilotOpen ? "Close copilot" : "Copilot"} onClick={onToggleCopilot} glow={copilotOpen} />
    </div>
  );
}
