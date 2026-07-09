import { useState, useEffect, useRef } from "react";

const MONO = "'JetBrains Mono', monospace";

// Saved pane layouts — "Morning check", "Restock run" — restored in one click.
export default function WorkspacesMenu({ companyId, current, onApply, pageLabel }) {
  const key = `viro_ws_${companyId}`;
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const wrapRef = useRef();

  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setList([]); }
  }, [key]);

  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const persist = (next) => { setList(next); localStorage.setItem(key, JSON.stringify(next)); };
  const save = () => {
    const n = name.trim();
    if (!n) return;
    persist([...list.filter(w => w.name !== n), { name: n, a: current.a, b: current.b }]);
    setName(""); setNaming(false);
  };

  const btn = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, padding: "6px 11px", color: "rgba(255,255,255,0.6)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Workspaces" style={{ ...btn, ...(open ? { background: "rgba(255,255,255,0.1)", color: "#fff" } : {}) }}>⌗</button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, zIndex: 95,
          background: "rgba(16,17,19,0.98)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 14,
          padding: 8, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", animation: "vc-drop .16s cubic-bezier(.16,1,.3,1)",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", padding: "6px 10px 8px" }}>WORKSPACES</div>
          {list.length === 0 && !naming && (
            <div style={{ padding: "4px 10px 10px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              Save your current pane layout and restore it anytime.
            </div>
          )}
          {list.map(w => (
            <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.8)" }}
              className="cmdk-item" onClick={() => { onApply(w); setOpen(false); }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap" }}>
                {pageLabel(w.a)}{w.b ? ` ⧉ ${pageLabel(w.b)}` : ""}
              </span>
              <span onClick={(e) => { e.stopPropagation(); persist(list.filter(x => x.name !== w.name)); }}
                style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>✕</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 6, paddingTop: 8, padding: "8px 6px 4px" }}>
            {naming ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input autoFocus value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setNaming(false); }}
                  placeholder="Name this layout…"
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, padding: "7px 10px", color: "#fff", fontSize: 12.5, outline: "none", fontFamily: "inherit" }} />
                <button onClick={save} style={{ background: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", color: "#08090a", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
              </div>
            ) : (
              <button onClick={() => setNaming(true)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.16)", borderRadius: 9, padding: "8px", color: "rgba(255,255,255,0.55)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
                ＋ Save current layout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
