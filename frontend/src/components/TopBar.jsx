import { useState, useEffect } from "react";

const MONO = "'JetBrains Mono', monospace";

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const pad = n => String(n).padStart(2, "0");
  return (
    <span style={{ fontFamily: MONO, fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  );
}

// The command bar: context on the left, controls on the right. OS, not webpage.
export default function TopBar({ company, pageLabel, user, onOpenPalette }) {
  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "V";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, height: 50, padding: "0 18px",
      borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", flexShrink: 0,
    }}>
      {/* breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{company?.name}</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{pageLabel}</span>
      </div>

      {/* search pill */}
      <div onClick={onOpenPalette} className="viro-btn" style={{
        marginLeft: "auto", display: "flex", alignItems: "center", gap: 9, width: 260, maxWidth: "34vw",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 9, padding: "7px 12px", cursor: "pointer",
      }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>⌕</span>
        <span style={{ flex: 1, fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>Search or jump…</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "1px 5px" }}>⌘K</span>
      </div>

      <Clock />

      {/* user chip */}
      <div title={`${user?.first_name || ""} ${user?.last_name || ""} · ${user?.role || ""}`} style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)",
      }}>{initials}</div>
    </div>
  );
}
