import { COLORS } from "../components/Layout";

const MONO = "'JetBrains Mono', monospace";

// Per-role generation: a floor worker on an iPad doesn't get the manager's
// dashboard — they get a few giant, glove-friendly tap targets.
export default function WorkerHome({ user, company, stats, onNavigate, entities = [] }) {
  const term = company?.universal_id_field || "item";
  const open = stats?.unresolved || 0;
  const hasEntities = entities && entities.length > 0;

  const tiles = hasEntities
    ? entities.map((e, i) => ({ label: e.name_plural || e.name, hint: "Tap to add or view", icon: e.icon || "▦", page: `entity:${e.entity_id}`, primary: i === 0 }))
    : [
      { label: "Log a Defect", hint: "Snap a photo — Viro fills the rest", icon: "📸", page: "Log Defect", primary: true },
      { label: "My Queue", hint: `${open} open on the floor`, icon: "🔧", page: "Repair Queue" },
      { label: `Find a ${term}`, hint: "Look up status & history", icon: "🔍", page: "Vehicle Search" },
    ];

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "8px 4px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
          {company?.name}
        </div>
        <h1 style={{ fontSize: "clamp(30px,5vw,44px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "10px 0 0" }}>
          Hi{user?.first_name ? `, ${user.first_name}` : ""}.
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: "10px 0 0" }}>
          {hasEntities
            ? "What do you want to work on? Tap to add or check anything."
            : open > 0
              ? <>There {open === 1 ? "is" : "are"} <span style={{ color: COLORS.high, fontWeight: 600 }}>{open} open {open === 1 ? "issue" : "issues"}</span> on the floor. What are you working on?</>
              : "The floor is clear. Log anything you spot."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {tiles.map((t, i) => (
          <button
            key={i}
            onClick={() => onNavigate(t.page)}
            className="viro-btn"
            style={{
              gridColumn: t.primary ? "1 / -1" : "auto",
              textAlign: "left", cursor: "pointer", fontFamily: "inherit",
              minHeight: t.primary ? 150 : 130,
              borderRadius: 20, padding: "26px 28px",
              border: `1px solid ${t.primary ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
              background: t.primary ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14,
              color: "#fff",
            }}
          >
            <div style={{ fontSize: t.primary ? 44 : 34 }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: t.primary ? 26 : 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{t.label}</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>{t.hint}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 26, fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
        Built for the floor — big targets, no menus. Tap and go.
      </div>
    </div>
  );
}
