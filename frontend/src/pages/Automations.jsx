import { useState, useEffect } from "react";
import { COLORS, PageHeader, InsightBanner } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";
const GREEN = "#34d399";
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
const eyebrow = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontWeight: 600 };

const STATUS_COLORS = { drafted: "rgba(255,255,255,0.6)", approved: GREEN };

export default function Automations({ company }) {
  const [catalog, setCatalog] = useState(null);   // null = designing
  const [docs, setDocs] = useState([]);
  const [draft, setDraft] = useState(null);       // { title, loading, body, error, doc_id }
  const [regen, setRegen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addText, setAddText] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const loadDocs = () => fetch(`${API}/documents/${company.company_id}`).then(r => r.json()).then(d => setDocs(Array.isArray(d) ? d : [])).catch(() => {});

  useEffect(() => {
    let alive = true;
    setCatalog(null);
    fetch(`${API}/automations/catalog/${company.company_id}`).then(r => r.json())
      .then(d => { if (alive) setCatalog(d.automations ? d : { automations: [] }); })
      .catch(() => { if (alive) setCatalog({ automations: [] }); });
    loadDocs();
    return () => { alive = false; };
  }, [company.company_id]); // eslint-disable-line

  const regenerate = async () => {
    setRegen(true);
    try { const d = await fetch(`${API}/automations/catalog/${company.company_id}/regenerate`, { method: "POST" }).then(r => r.json()); if (d.automations) setCatalog(d); } catch {}
    setRegen(false);
  };

  const addAutomation = async () => {
    const desc = addText.trim();
    if (!desc || addBusy) return;
    setAddBusy(true);
    try {
      const d = await fetch(`${API}/automations/catalog/${company.company_id}/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      }).then(r => r.json());
      if (d.catalog) { setCatalog(d.catalog); setAdding(false); setAddText(""); }
    } catch {}
    setAddBusy(false);
  };

  const generate = async (auto) => {
    setDraft({ title: auto.title, loading: true, body: "", error: null, doc_id: null });
    try {
      const res = await fetch(`${API}/automations/draft`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: company.company_id, automation_id: auto.id }),
      }).then(r => r.json());
      if (res.error) setDraft(d => ({ ...d, loading: false, error: res.error }));
      else { setDraft({ title: res.title || auto.title, loading: false, body: res.body || "", error: null, doc_id: res.doc_id }); loadDocs(); }
    } catch {
      setDraft(d => ({ ...d, loading: false, error: "Couldn't reach the AI service." }));
    }
  };

  const approve = async () => {
    if (draft?.doc_id) {
      fetch(`${API}/documents/${draft.doc_id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) }).then(loadDocs).catch(() => {});
    }
    setDraft(null);
  };

  const openDoc = async (d) => {
    setDraft({ title: d.title, loading: true, body: "", error: null, doc_id: d.doc_id });
    try {
      const full = await fetch(`${API}/documents/one/${d.doc_id}`).then(r => r.json());
      setDraft({ title: full.title || d.title, loading: false, body: full.body || "", error: full.error || null, doc_id: d.doc_id });
    } catch { setDraft(x => ({ ...x, loading: false, error: "Couldn't load the document." })); }
  };

  const copy = () => { if (draft?.body) navigator.clipboard?.writeText(draft.body); };

  // group catalog by department
  const groups = {};
  (catalog?.automations || []).forEach(a => {
    const dep = a.department || "General";
    (groups[dep] = groups[dep] || []).push(a);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageHeader title="Automations" subtitle={`Designed for ${company.name} — the paperwork your departments write by hand, drafted from live data.`} />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={() => setAdding(a => !a)} style={{ background: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>＋ Automate something</button>
          <button onClick={regenerate} disabled={regen} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: COLORS.muted, fontSize: 13, cursor: regen ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{regen ? "Redesigning…" : "✦ Redesign"}</button>
        </div>
      </div>

      {adding && (
        <div style={{ ...card, padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>What do you write by hand?</div>
          <div style={{ fontSize: 12.5, color: COLORS.muted, marginBottom: 14 }}>Describe it in a sentence — Viro turns it into an automation. e.g. "every friday i email our top customers a promo with this week's specials"</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={addText} onChange={e => setAddText(e.target.value)} onKeyDown={e => e.key === "Enter" && addAutomation()}
              placeholder="Describe the document or email…"
              style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 15px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            <button onClick={addAutomation} disabled={addBusy || !addText.trim()} style={{ background: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: addBusy || !addText.trim() ? 0.5 : 1 }}>{addBusy ? "Adding…" : "Add"}</button>
          </div>
        </div>
      )}

      <InsightBanner companyId={company.company_id} page="Automations" summary={{ note: "what paperwork should be prioritized right now" }} />

      {catalog === null ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", color: "rgba(255,255,255,0.5)", gap: 14 }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 20 }}>◴</span>
          <div style={{ fontSize: 14 }}>Designing {company.name}'s automations…</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {Object.entries(groups).map(([dep, autos], gi) => (
            <div key={dep} style={{ ...card, padding: 20, animation: `fadeIn .4s cubic-bezier(.16,1,.3,1) both`, animationDelay: `${gi * 60}ms` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{autos[0]?.icon || "📄"}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{dep}</div></div>
                <span style={{ ...eyebrow, color: GREEN, background: GREEN + "1f", border: `1px solid ${GREEN}33`, padding: "3px 9px", borderRadius: 6 }}>{autos.length} READY</span>
              </div>
              {autos.map((a, i) => (
                <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.muted, lineHeight: 1.4 }}>{a.description}</div>
                  </div>
                  <button onClick={() => generate(a)} style={{ background: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", color: "#08090a", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>✦ Draft</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Recent documents</div>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {docs.slice(0, 8).map((d, i) => (
              <div key={d.doc_id} onClick={() => openDoc(d)} className="vdyn-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>✦</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: STATUS_COLORS[d.status] || COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.status}</span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>{String(d.created_at).slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: COLORS.muted }}>
        Every draft is written from <span style={{ color: "#fff", fontWeight: 600 }}>{company.name}</span>'s live data — you stay in control of what sends.
      </div>

      {draft && (
        <div onClick={() => setDraft(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 620, maxWidth: "100%", maxHeight: "82vh", display: "flex", flexDirection: "column", background: "rgba(20,21,23,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>✦</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{draft.title}</span>
              </div>
              <span onClick={() => setDraft(null)} style={{ cursor: "pointer", color: COLORS.muted, fontSize: 16 }}>✕</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              {draft.loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.muted, fontSize: 14, padding: "20px 0" }}>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◴</span>
                  Drafting from {company.name}'s live data…
                </div>
              ) : draft.error ? (
                <div style={{ color: COLORS.critical, fontSize: 14 }}>{draft.error}</div>
              ) : (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.9)" }}>{draft.body}</pre>
              )}
            </div>
            {!draft.loading && !draft.error && (
              <div style={{ display: "flex", gap: 10, padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button onClick={copy} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Copy</button>
                <button onClick={approve} style={{ background: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>Approve ✓</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
