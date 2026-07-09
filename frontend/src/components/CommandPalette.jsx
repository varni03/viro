import { useState, useEffect, useRef } from "react";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";

const STYLE_ID = "viro-cmdk-styles";
function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes cmdk-in { from { opacity: 0; transform: translateY(-8px) scale(0.99); } to { opacity: 1; transform: none; } }
    .cmdk-item { display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px;
      cursor:pointer; font-size:13.5px; color:rgba(255,255,255,0.78); }
    .cmdk-item.sel { background:rgba(255,255,255,0.09); color:#fff; }
  `;
  document.head.appendChild(el);
}

// The app-wide jump bar. Pages, entities, and records — one keystroke away.
export default function CommandPalette({ open, onClose, company, entities = [], pages = [], onNavigate }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [records, setRecords] = useState([]); // [{entity, label, page}]
  const inputRef = useRef();
  const listRef = useRef();

  useEffect(() => { ensureStyles(); }, []);

  // Load records for search when the palette opens (free — no AI).
  useEffect(() => {
    if (!open || !company || entities.length === 0) return;
    let alive = true;
    Promise.all(entities.map(e =>
      fetch(`${API}/records/${company.company_id}/${e.entity_id}`)
        .then(r => r.json())
        .then(rows => (Array.isArray(rows) ? rows : []).map(r => {
          const key = (e.fields || [{}])[0]?.key;
          return { kind: "record", icon: e.icon || "▦", label: String(r[key] ?? "—"),
                   sub: e.name, page: `entity:${e.entity_id}` };
        }))
        .catch(() => [])
    )).then(res => { if (alive) setRecords(res.flat()); });
    return () => { alive = false; };
  }, [open, company, entities]);

  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  if (!open) return null;

  const items = [
    ...pages.map(p => ({ kind: "page", icon: p.icon, label: p.label, sub: "Go to", page: p.page })),
    ...entities.map(e => ({ kind: "entity", icon: e.icon || "▦", label: e.name_plural || e.name, sub: "Open", page: `entity:${e.entity_id}` })),
    ...records,
  ];
  const needle = q.trim().toLowerCase();
  const filtered = (needle
    ? items.filter(i => `${i.label} ${i.sub}`.toLowerCase().includes(needle))
    : items.filter(i => i.kind !== "record")
  ).slice(0, 12);
  const cur = Math.min(sel, Math.max(filtered.length - 1, 0));

  const go = (item) => { if (!item) return; onNavigate(item.page); onClose(); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(filtered[cur]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "16vh" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: "calc(100vw - 40px)",
        background: "rgba(18,19,21,0.97)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 16,
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)", overflow: "hidden", animation: "cmdk-in .18s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 17px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>⌕</span>
          <input ref={inputRef} value={q} onKeyDown={onKey}
            onChange={e => { setQ(e.target.value); setSel(0); }}
            placeholder="Jump to a page, entity, or record…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: 15, fontFamily: "inherit" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "2px 6px" }}>esc</span>
        </div>
        <div ref={listRef} style={{ maxHeight: 340, overflowY: "auto", padding: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "22px 14px", color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" }}>No matches</div>
          ) : filtered.map((item, i) => (
            <div key={`${item.kind}-${item.label}-${i}`}
              className={"cmdk-item" + (i === cur ? " sel" : "")}
              onMouseEnter={() => setSel(i)} onClick={() => go(item)}>
              <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>{item.sub}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, padding: "10px 17px", borderTop: "1px solid rgba(255,255,255,0.07)",
          fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          <span>↑↓ navigate</span><span>↵ open</span><span style={{ marginLeft: "auto" }}>Viro</span>
        </div>
      </div>
    </div>
  );
}
