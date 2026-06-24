import { useState, useEffect } from "react";
import { COLORS, PageHeader } from "../components/Layout";

const API = "https://web-production-0457e.up.railway.app";
const MONO = "'JetBrains Mono', monospace";
const RED = "#ff5a5a", AMBER = "#f0a83c", GREEN = "#34d399";
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

const fmtVal = (f, v) => {
  if (v === undefined || v === null || v === "") return "—";
  if (f.type === "currency") return "$" + Number(v).toLocaleString();
  if (f.type === "boolean") return v ? "Yes" : "No";
  return String(v);
};

// Heuristic: detect an inventory entity (a quantity field + a reorder field) for low-stock flags.
function stockFields(fields) {
  const qty = fields.find(f => f.type === "number" && /on_hand|stock|qty|quantity|inventory|count/i.test(f.key));
  const reorder = fields.find(f => f.type === "number" && /reorder|min|threshold|par/i.test(f.key));
  return qty && reorder ? { qty: qty.key, reorder: reorder.key } : null;
}

export default function EntityPage({ company, entity }) {
  const [records, setRecords] = useState(null);
  const [editing, setEditing] = useState(null); // null=closed, {}=new, {...record}=edit
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fields = entity.fields || [];
  const cols = fields.slice(0, 5);
  const stock = stockFields(fields);

  const load = () => fetch(`${API}/records/${company.company_id}/${entity.entity_id}`).then(r => r.json()).then(d => setRecords(Array.isArray(d) ? d : [])).catch(() => setRecords([]));
  useEffect(() => { setRecords(null); load(); /* eslint-disable-next-line */ }, [entity.entity_id, company.company_id]);

  const openNew = () => { setForm({}); setEditing({}); };
  const openEdit = (r) => { setForm({ ...r }); setEditing(r); };

  const save = async () => {
    setSaving(true);
    const data = {};
    fields.forEach(f => { if (form[f.key] !== undefined) data[f.key] = form[f.key]; });
    try {
      if (editing && editing.record_id) {
        await fetch(`${API}/records/${editing.record_id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      } else {
        await fetch(`${API}/records/${company.company_id}/${entity.entity_id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      }
      setEditing(null); load();
    } catch {}
    setSaving(false);
  };

  const del = async (r) => {
    await fetch(`${API}/records/${r.record_id}`, { method: "DELETE" });
    setRecords(rs => rs.filter(x => x.record_id !== r.record_id));
  };

  const isLow = (r) => stock && Number(r[stock.qty]) <= Number(r[stock.reorder]);
  const lowCount = stock && records ? records.filter(isLow).length : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageHeader title={`${entity.icon || "▦"} ${entity.name_plural || entity.name}`}
          subtitle={`${company.name} · ${records ? records.length : "…"} ${(entity.name_plural || "records").toLowerCase()}${lowCount ? ` · ${lowCount} low` : ""}`} />
        <button onClick={openNew} style={{ background: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", color: "#08090a", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>+ Add {entity.name}</button>
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden", marginTop: 6 }}>
        {records === null ? (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>Loading…</div>
        ) : records.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>{entity.icon || "▦"}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No {(entity.name_plural || "records").toLowerCase()} yet</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 18 }}>Add your first {entity.name.toLowerCase()} to get started.</div>
            <button onClick={openNew} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add {entity.name}</button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {stock && <th style={{ width: 8 }} />}
                {cols.map(f => <th key={f.key} style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", textAlign: "left", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}>{f.label}</th>)}
                <th style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }} />
              </tr></thead>
              <tbody>
                {records.map((r, i) => {
                  const low = isLow(r);
                  return (
                    <tr key={r.record_id || i} className="vdyn-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {stock && <td style={{ padding: "0 0 0 16px" }}>{low && <span style={{ width: 7, height: 7, borderRadius: "50%", background: RED, display: "inline-block", boxShadow: `0 0 7px ${RED}` }} />}</td>}
                      {cols.map((f, ci) => (
                        <td key={f.key} style={{ padding: "12px 16px", color: ci === 0 ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: ci === 0 ? 600 : 400,
                          fontFamily: (f.type === "number" || f.type === "currency") ? MONO : "inherit" }}>
                          {f.type === "select" && r[f.key]
                            ? <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", padding: "3px 9px", borderRadius: 6, color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>{r[f.key]}</span>
                            : <span style={{ color: low && f.key === stock?.qty ? RED : undefined }}>{fmtVal(f, r[f.key])}{low && f.key === stock?.qty ? " ⚠" : ""}</span>}
                        </td>
                      ))}
                      <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button onClick={() => openEdit(r)} style={{ background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 12, marginRight: 10 }}>Edit</button>
                        <button onClick={() => del(r)} style={{ background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 13 }}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== null && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", background: "rgba(20,21,23,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editing.record_id ? "Edit" : "New"} {entity.name}</div>
              <span onClick={() => setEditing(null)} style={{ cursor: "pointer", color: COLORS.muted, fontSize: 16 }}>✕</span>
            </div>
            {fields.map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 7 }}>{f.label}{f.required && <span style={{ color: RED }}> *</span>}</div>
                {f.type === "textarea" ? (
                  <textarea value={form[f.key] || ""} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                ) : f.type === "select" ? (
                  <select value={form[f.key] || ""} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select…</option>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "boolean" ? (
                  <select value={form[f.key] === undefined ? "" : (form[f.key] ? "yes" : "no")} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value === "yes" }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
                  </select>
                ) : (
                  <input type={f.type === "number" || f.type === "currency" ? "number" : f.type === "date" ? "date" : "text"}
                    value={form[f.key] ?? ""} onChange={e => setForm(s => ({ ...s, [f.key]: f.type === "number" || f.type === "currency" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value }))}
                    style={inputStyle} />
                )}
              </div>
            ))}
            <button onClick={save} disabled={saving} style={{ width: "100%", background: "#fff", border: "none", borderRadius: 11, padding: "13px", color: "#08090a", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : editing.record_id ? "Save changes" : `Add ${entity.name}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
