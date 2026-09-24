import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const API = "https://viro1.vercel.app";
const MONO = "'JetBrains Mono', monospace";

// One bar: jump to anything, or talk to the agent. The cockpit's front door.
const Omnibar = forwardRef(function Omnibar({ company, entities = [], pages = [], onNavigate, onAsk }, ref) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // Records index loads lazily on first focus (free, no AI).
  useEffect(() => {
    if (!open || loaded || !company || entities.length === 0) return;
    setLoaded(true);
    Promise.all(entities.map(e =>
      fetch(`${API}/records/${company.company_id}/${e.entity_id}`)
        .then(r => r.json())
        .then(rows => (Array.isArray(rows) ? rows : []).map(r => {
          const key = (e.fields || [{}])[0]?.key;
          return { kind: "record", icon: e.icon || "▦", label: String(r[key] ?? "—"), sub: e.name, page: `entity:${e.entity_id}` };
        }))
        .catch(() => [])
    )).then(res => setRecords(res.flat()));
  }, [open, loaded, company, entities]);

  const items = [
    ...pages.map(p => ({ kind: "page", icon: p.icon, label: p.label, sub: "Go to", page: p.page })),
    ...entities.map(e => ({ kind: "entity", icon: e.icon || "▦", label: e.name_plural || e.name, sub: "Open", page: `entity:${e.entity_id}` })),
    ...records,
  ];
  const needle = q.trim().toLowerCase();
  const matches = (needle
    ? items.filter(i => `${i.label} ${i.sub}`.toLowerCase().includes(needle))
    : items.filter(i => i.kind !== "record")
  ).slice(0, 8);
  const results = needle ? [...matches, { kind: "ask", icon: "✦", label: `Ask Viro — “${q.trim()}”`, sub: "Copilot" }] : matches;
  const cur = Math.min(sel, Math.max(results.length - 1, 0));

  const choose = (item) => {
    if (!item) return;
    if (item.kind === "ask") onAsk(q.trim());
    else onNavigate(item.page);
    setQ(""); setOpen(false); inputRef.current?.blur();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[cur]); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.045)",
        border: `1px solid rgba(255,255,255,${open ? 0.2 : 0.1})`,
        borderRadius: 11, padding: "8px 13px", transition: "all .18s ease",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>⌕</span>
        <input ref={inputRef} value={q}
          onFocus={() => { setOpen(true); setSel(0); }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={e => { setQ(e.target.value); setSel(0); setOpen(true); }}
          onKeyDown={onKey}
          placeholder="Jump anywhere, or ask Viro anything…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13.5, fontFamily: "inherit" }} />
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "1px 6px" }}>⌘K</span>
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 90,
          background: "rgba(16,17,19,0.98)", border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 14, padding: 6, boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          animation: "vc-drop .16s cubic-bezier(.16,1,.3,1)",
        }}>
          {results.map((item, i) => (
            <div key={`${item.kind}-${item.label}-${i}`}
              onMouseDown={e => { e.preventDefault(); choose(item); }}
              onMouseEnter={() => setSel(i)}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 9,
                cursor: "pointer", fontSize: 13,
                background: i === cur ? "rgba(255,255,255,0.09)" : "transparent",
                color: i === cur ? "#fff" : item.kind === "ask" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.72)",
              }}>
              <span style={{ width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{item.sub}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Omnibar;
