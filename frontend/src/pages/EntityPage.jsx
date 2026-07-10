import { useState, useEffect } from "react";
import { COLORS, PageHeader } from "../components/Layout";
import { STATUS_HUES, StatusPill } from "./GenerativeDashboard";

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

export default function EntityPage({ company, entity, viewCfg, surfaceLabel }) {
  const [records, setRecords] = useState(null);
  const boardField = (entity.fields || []).find(f => f.key === viewCfg?.board_field && f.type === "select" && (f.options || []).length)
    || (entity.fields || []).find(f => f.type === "select" && (f.options || []).length);
  const availableViews = ["table", "cards", ...(boardField ? ["board"] : [])];
  const [view, setView] = useState(() =>
    availableViews.includes(viewCfg?.default_view) ? viewCfg.default_view : "table");
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

  const moveCard = (recordId, value) => {
    if (!boardField) return;
    setRecords(rs => rs.map(r => r.record_id === recordId ? { ...r, [boardField.key]: value } : r));
    const row = (records || []).find(r => r.record_id === recordId);
    if (!row) return;
    const data = {};
    fields.forEach(f => { if (row[f.key] !== undefined) data[f.key] = row[f.key]; });
    data[boardField.key] = value;
    fetch(`${API}/records/${recordId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) }).catch(() => {});
  };

  const titleKey = viewCfg?.card_title && fields.some(f => f.key === viewCfg.card_title) ? viewCfg.card_title : fields[0]?.key;
  const cardKeys = (viewCfg?.card_fields || fields.slice(1, 4).map(f => f.key)).filter(k => fields.some(f => f.key === k)).slice(0, 3);
  const fmtCell = (k, v) => {
    const f = fields.find(x => x.key === k);
    return fmtVal(f || {}, v);
  };

  const ViewPill = ({ id, label }) => (
    <button onClick={() => setView(id)} style={{
      background: view === id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${view === id ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 9, padding: "7px 13px", color: view === id ? "#fff" : "rgba(255,255,255,0.55)",
      fontSize: 12.5, fontWeight: view === id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <PageHeader title={`${entity.icon || "▦"} ${surfaceLabel || entity.name_plural || entity.name}`}
          subtitle={`${company.name} · ${records ? records.length : "…"} ${(entity.name_plural || "records").toLowerCase()}${lowCount ? ` · ${lowCount} low` : ""}`} />
        <button onClick={openNew} style={{ background: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", color: "#08090a", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>+ Add {entity.name}</button>
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        <ViewPill id="table" label="Table" />
        <ViewPill id="cards" label="Cards" />
        {boardField && <ViewPill id="board" label="Board" />}
      </div>

      {/* CARDS — things you look at */}
      {view === "cards" && records !== null && (
        records.length === 0 ? (
          <div style={{ ...card, padding: "48px 20px", textAlign: "center", color: COLORS.muted }}>No {(entity.name_plural || "records").toLowerCase()} yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
            {records.map((r, i) => {
              const low = isLow(r);
              return (
                <div key={r.record_id || i} onClick={() => openEdit(r)} className="viro-btn"
                  style={{ ...card, padding: 18, cursor: "pointer", borderColor: low ? RED + "55" : "rgba(255,255,255,0.08)", animation: `fadeIn .4s cubic-bezier(.16,1,.3,1) both`, animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{String(r[titleKey] ?? "—")}</div>
                    {low && <span style={{ width: 8, height: 8, borderRadius: "50%", background: RED, boxShadow: `0 0 7px ${RED}`, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  {cardKeys.map(k => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{fields.find(f => f.key === k)?.label || k}</span>
                      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", textAlign: "right" }}>{fmtCell(k, r[k])}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* BOARD — things that flow */}
      {view === "board" && boardField && records !== null && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${(boardField.options || []).length}, 1fr)`, gap: 12 }}>
          {(boardField.options || []).map((col, colIdx) => {
            const hue = STATUS_HUES[colIdx % STATUS_HUES.length];
            const colRows = records.filter(r => String(r[boardField.key] ?? "") === col);
            const moneyField = fields.find(f => f.type === "currency");
            const subKey = moneyField?.key || cardKeys[0];
            const colTotal = moneyField ? colRows.reduce((s, r) => s + (Number(r[moneyField.key]) || 0), 0) : null;
            return (
              <div key={col}
                onDragOver={ev => ev.preventDefault()}
                onDrop={ev => { ev.preventDefault(); const rid = ev.dataTransfer.getData("rid"); if (rid) moveCard(rid, col); }}>
                <div style={{ ...card, borderRadius: "12px 12px 0 0", padding: "12px 15px", borderBottom: `2px solid ${hue}`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 34, background: `linear-gradient(0deg, ${hue}14, transparent)`, pointerEvents: "none" }} />
                  <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: hue, marginBottom: 4, fontWeight: 700 }}>{col}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700 }}>{colRows.length}</div>
                    {colTotal !== null && colTotal > 0 && <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>${colTotal.toLocaleString()}</div>}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 8, minHeight: 340 }}>
                  {colRows.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "26px 0", color: "rgba(255,255,255,0.22)", fontSize: 12 }}>Drop here</div>
                  ) : colRows.map((r, i) => (
                    <div key={r.record_id || i} draggable
                      onDragStart={ev => ev.dataTransfer.setData("rid", r.record_id)}
                      onClick={() => openEdit(r)}
                      className="viro-btn"
                      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", borderLeft: `2px solid ${hue}66`, borderRadius: 10, padding: "10px 12px", marginBottom: 6, cursor: "grab" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(r[titleKey] ?? "—")}</div>
                        {subKey && <div style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>{fmtCell(subKey, r[subKey])}</div>}
                      </div>
                      {cardKeys[0] && cardKeys[0] !== subKey && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{fmtCell(cardKeys[0], r[cardKeys[0]])}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && <div style={{ ...card, padding: 0, overflow: "hidden", marginTop: 6 }}>
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
                            ? <StatusPill value={r[f.key]} options={f.options || []} />
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
      </div>}

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
