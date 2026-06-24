import { useState, useEffect } from "react";
import { COLORS, PageHeader, InsightBanner } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";
const GREEN = "#34d399";
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };

const GROUPS = [
  { icon: "📋", dept: "Quality", meta: "Drafted from this week's defects", items: [
    { type: "weekly_quality_report", title: "Weekly Quality Report", desc: "FPY trend, top issues, worst station — ready for leadership" },
    { type: "exec_summary", title: "Executive Summary", desc: "Four sentences on operations health for the leadership team" },
  ]},
  { icon: "📦", dept: "Procurement", meta: "Drafted from recurring defect patterns", items: [
    { type: "supplier_email", title: "Supplier Escalation Email", desc: "Chases the supplier behind your most recurring issue" },
  ]},
  { icon: "📝", dept: "Floor Operations", meta: "Written from the day's events", items: [
    { type: "shift_handover", title: "Shift Handover Note", desc: "What's blocked, what's critical, what the next shift owns" },
  ]},
];

const ENTITY_GROUPS = [
  { icon: "📈", dept: "Operations", meta: "Drafted from your live data", items: [
    { type: "weekly_quality_report", title: "Weekly Operations Report", desc: "Where things stand, what's low, what to do — for the owner" },
    { type: "exec_summary", title: "Operations Summary", desc: "Four sentences on the health of your operation" },
  ]},
  { icon: "📦", dept: "Suppliers", meta: "Drafted from low-stock items", items: [
    { type: "supplier_email", title: "Reorder Email", desc: "Restock everything below its reorder level, in one email" },
  ]},
  { icon: "📝", dept: "Daily", meta: "Written from today's records", items: [
    { type: "shift_handover", title: "Daily Handover Note", desc: "What's low, what's pending, what to prioritize next" },
  ]},
];

export default function Automations({ company }) {
  const [draft, setDraft] = useState(null); // { title, loading, body, error }
  const [hasEntities, setHasEntities] = useState(false);

  useEffect(() => {
    if (!company) return;
    fetch(`${API}/entities/${company.company_id}`).then(r => r.json())
      .then(d => setHasEntities(Array.isArray(d) && d.length > 0)).catch(() => {});
  }, [company]);

  const groups = hasEntities ? ENTITY_GROUPS : GROUPS;

  const generate = async (item) => {
    setDraft({ title: item.title, loading: true, body: "", error: null });
    try {
      const res = await fetch(`${API}/automations/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: company.company_id, type: item.type }),
      }).then(r => r.json());
      if (res.error) setDraft(d => ({ ...d, loading: false, error: res.error }));
      else setDraft({ title: res.title || item.title, loading: false, body: res.body || "", error: null });
    } catch {
      setDraft(d => ({ ...d, loading: false, error: "Couldn't reach the AI service." }));
    }
  };

  const copy = () => { if (draft?.body) navigator.clipboard?.writeText(draft.body); };

  return (
    <div>
      <PageHeader title="Automations" subtitle="The documents your team writes by hand — drafted from live data. Review, then send." />

      <InsightBanner companyId={company.company_id} page="Automations"
        summary={{ note: "what paperwork should be prioritized this week" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{g.dept}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{g.meta}</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: GREEN, background: GREEN + "1f", border: `1px solid ${GREEN}33`, padding: "3px 9px", borderRadius: 6 }}>{g.items.length} READY</span>
            </div>
            {g.items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{it.title}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.muted, lineHeight: 1.4 }}>{it.desc}</div>
                </div>
                <button onClick={() => generate(it)} style={{ background: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", color: "#08090a", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>✦ Draft</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 26, fontSize: 13.5, color: COLORS.muted }}>
        Every draft is written from <span style={{ color: "#fff", fontWeight: 600 }}>{company.name}</span>'s live data — you stay in control of what sends.
      </div>

      {draft && (
        <div onClick={() => setDraft(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 600, maxWidth: "100%", maxHeight: "82vh", display: "flex", flexDirection: "column", background: "rgba(20,21,23,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
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
                <button onClick={() => setDraft(null)} style={{ background: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", color: "#08090a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>Looks good ✓</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
