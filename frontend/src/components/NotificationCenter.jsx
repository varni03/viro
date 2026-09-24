import { useState, useEffect, useRef } from "react";

const API = "https://viro1.vercel.app";
const MONO = "'JetBrains Mono', monospace";
const RED = "#ff5a5a";

// The pulse feed, first-class in the command strip.
export default function NotificationCenter({ company }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const wrapRef = useRef();

  const load = () => {
    if (!company) return;
    fetch(`${API}/notifications/${company.company_id}`)
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [company?.company_id]); // eslint-disable-line

  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const unread = items.filter(n => n.read === 0).length;
  const markAll = () => {
    fetch(`${API}/notifications/${company.company_id}/read-all`, { method: "PUT" }).catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, read: 1 })));
  };
  const markOne = (n) => {
    if (n.read === 0) {
      fetch(`${API}/notifications/${n.notification_id}/read`, { method: "PUT" }).catch(() => {});
      setItems(prev => prev.map(x => x.notification_id === n.notification_id ? { ...x, read: 1 } : x));
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Notifications" style={{
        position: "relative", background: open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, padding: "6px 10px",
        color: open ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
      }}>
        ◉
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5, minWidth: 15, height: 15, borderRadius: 8,
            background: RED, color: "#fff", fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, zIndex: 95,
          background: "rgba(16,17,19,0.98)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 14,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)", animation: "vc-drop .16s cubic-bezier(.16,1,.3,1)",
          maxHeight: 420, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)" }}>ACTIVITY</span>
            {unread > 0 && <span onClick={markAll} style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>Mark all read</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
            {items.length === 0 ? (
              <div style={{ padding: "24px 14px", fontSize: 12.5, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>All quiet. Viro will post here when it notices something.</div>
            ) : items.slice(0, 15).map((n, i) => (
              <div key={n.notification_id || i} onClick={() => markOne(n)} style={{
                display: "flex", gap: 10, padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                background: n.read === 0 ? "rgba(255,255,255,0.05)" : "transparent",
              }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, paddingTop: 1 }}>✦</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: n.read === 0 ? 700 : 500, color: n.read === 0 ? "#fff" : "rgba(255,255,255,0.65)", marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.45 }}>{n.message}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 3 }}>{String(n.created_at).slice(0, 16).replace("T", " ")}</div>
                </div>
                {n.read === 0 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginTop: 5, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
