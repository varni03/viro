const MONO = "'JetBrains Mono', monospace";
const GREEN = "#34d399";

// The OS footer — quiet, mono, always-on context.
export default function StatusBar({ company, entities = [], pageLabel }) {
  const seg = { display: "flex", alignItems: "center", gap: 6 };
  const txt = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 18, height: 28, padding: "0 18px",
      borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)", flexShrink: 0,
    }}>
      <div style={seg}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
        <span style={{ ...txt, color: "rgba(255,255,255,0.45)" }}>LIVE</span>
      </div>
      <span style={txt}>{company?.company_id}</span>
      {entities.length > 0 && <span style={txt}>{entities.length} {entities.length === 1 ? "ENTITY" : "ENTITIES"}</span>}
      <span style={{ ...txt, marginLeft: "auto", textTransform: "uppercase" }}>{pageLabel}</span>
      <span style={txt}>VIRO OS</span>
    </div>
  );
}
