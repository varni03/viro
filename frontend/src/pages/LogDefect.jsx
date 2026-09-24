import { useState, useRef, useEffect } from "react";
import { logDefect, analyzeImage } from "../api/client";
import { COLORS, PageHeader, severityColor } from "../components/Layout";

const API = "https://viro1.vercel.app";
const MONO = "'JetBrains Mono', monospace";
const SEVERITIES = ["low", "medium", "high", "critical"];
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
const eyebrow = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 };
const input = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "12px 15px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

export default function LogDefect({ company, stages }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [productId, setProductId] = useState("");
  const [stage, setStage] = useState("");
  const [defectType, setDefectType] = useState("");
  const [severity, setSeverity] = useState("low");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const fileRef = useRef();

  useEffect(() => {
    if (!company) return;
    fetch(`${API}/custom-fields/${company.company_id}`).then(r => r.json()).then(setCustomFields).catch(() => {});
  }, [company?.company_id]);

  const handlePhoto = async (file) => {
    if (!file) return;
    setPhoto(file); setPreview(URL.createObjectURL(file)); setAnalyzing(true);
    setDefectType(""); setSeverity("low"); setNotes("");
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await analyzeImage(formData);
      if (res.data.defect_type) { setDefectType(res.data.defect_type); setSeverity(res.data.severity || "low"); setNotes(res.data.notes || ""); }
    } catch {}
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!productId || !defectType || !stage) { setError("Product ID, stage and defect type are required"); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await logDefect({ company_id: company.company_id, product_id: productId, stage_number: parseInt(stage), defect_type: defectType, severity, notes });
      if (res?.data?.defect_id && Object.keys(customValues).length > 0) {
        await fetch(`${API}/custom-fields/values`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defect_id: res.data.defect_id, values: customValues }) });
      }
      setSuccess(`Logged for ${productId}`);
      setProductId(""); setDefectType(""); setSeverity("low"); setNotes(""); setPhoto(null); setPreview(null); setStage(""); setCustomValues({});
    } catch { setError("Failed to log defect — check connection"); }
    setSubmitting(false);
  };

  const aiFilled = photo && !analyzing && defectType;

  return (
    <div>
      <PageHeader title="Log Defect" subtitle="Snap a photo — Viro fills in the rest. Review and confirm." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Photo */}
        <div style={{ ...card, padding: 20 }}>
          <div style={eyebrow}>Photo</div>
          {preview ? (
            <div style={{ position: "relative", marginBottom: 14 }}>
              <img src={preview} alt="defect" style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", maxHeight: 300, objectFit: "cover" }} />
              <button onClick={() => { setPhoto(null); setPreview(null); }} style={{ position: "absolute", top: 8, right: 8, background: COLORS.critical + "cc", border: "none", borderRadius: 8, padding: "5px 11px", color: "#fff", fontSize: 12, cursor: "pointer" }}>Remove</button>
            </div>
          ) : (
            <div onClick={() => fileRef.current.click()} className="viro-btn" style={{ border: "2px dashed rgba(255,255,255,0.14)", borderRadius: 14, padding: "52px 24px", textAlign: "center", cursor: "pointer", marginBottom: 14, background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Tap to take a photo</div>
              <div style={{ fontSize: 12.5, color: COLORS.muted }}>Viro detects the defect type and severity for you</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handlePhoto(e.target.files[0])} />
          <button onClick={() => fileRef.current.click()} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 11, padding: "13px", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {preview ? "Replace photo" : "Choose photo"}
          </button>
          {analyzing && (
            <div style={{ marginTop: 12, padding: "11px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◴</span> Viro is analyzing the photo…
            </div>
          )}
          {aiFilled && (
            <div style={{ marginTop: 12, padding: "11px 16px", background: COLORS.low + "1c", border: `1px solid ${COLORS.low}40`, borderRadius: 11, fontSize: 13, color: COLORS.low, textAlign: "center" }}>
              ✓ Filled the fields — review on the right
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ ...card, padding: 20 }}>
          <div style={eyebrow}>Defect Details</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 6 }}>{company.universal_id_field?.toUpperCase() || "PRODUCT ID"}</div>
            <input style={{ ...input, fontFamily: MONO }} value={productId} onChange={e => setProductId(e.target.value)} placeholder="Enter ID…" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 6 }}>STAGE</div>
            <select value={stage} onChange={e => setStage(e.target.value)} style={{ ...input, color: stage ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer" }}>
              <option value="">Select stage…</option>
              {stages.map(s => <option key={s.stage_id} value={s.stage_number}>{s.stage_number} — {s.stage_name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 6 }}>DEFECT TYPE {analyzing && <span style={{ color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>AI filling…</span>}</div>
            <input style={input} value={defectType} onChange={e => setDefectType(e.target.value)} placeholder="e.g. scratch, dent, electrical…" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 8 }}>SEVERITY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {SEVERITIES.map(s => {
                const on = severity === s; const c = severityColor(s);
                return (
                  <button key={s} onClick={() => setSeverity(s)} style={{
                    background: on ? c + "26" : "rgba(255,255,255,0.03)", border: `1px solid ${on ? c : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10, padding: "11px 0", color: on ? c : COLORS.muted, fontSize: 12.5, fontWeight: on ? 700 : 500,
                    cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit", transition: "all .15s ease" }}>{s}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 6 }}>NOTES</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details…" rows={3} style={{ ...input, resize: "vertical" }} />
          </div>

          {customFields.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ ...eyebrow }}>Additional Fields</div>
              {customFields.map(field => (
                <div key={field.field_id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>{field.field_label.toUpperCase()}{field.required === 1 && <span style={{ color: COLORS.critical }}> *</span>}</div>
                  {field.field_type === "textarea"
                    ? <textarea value={customValues[field.field_id] || ""} onChange={e => setCustomValues(p => ({ ...p, [field.field_id]: e.target.value }))} placeholder={`Enter ${field.field_label.toLowerCase()}`} rows={3} style={{ ...input, resize: "vertical" }} />
                    : <input type={field.field_type} value={customValues[field.field_id] || ""} onChange={e => setCustomValues(p => ({ ...p, [field.field_id]: e.target.value }))} placeholder={`Enter ${field.field_label.toLowerCase()}`} style={input} />}
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ marginBottom: 12, padding: "10px 16px", background: COLORS.critical + "20", border: `1px solid ${COLORS.critical}40`, borderRadius: 11, fontSize: 13, color: COLORS.critical }}>{error}</div>}
          {success && <div style={{ marginBottom: 12, padding: "10px 16px", background: COLORS.low + "20", border: `1px solid ${COLORS.low}40`, borderRadius: 11, fontSize: 13, color: COLORS.low }}>✓ {success}</div>}

          <button onClick={handleSubmit} disabled={submitting} style={{ width: "100%", background: submitting ? "rgba(255,255,255,0.12)" : "#fff", border: "none", borderRadius: 12, padding: "15px", color: "#08090a", fontSize: 14.5, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {submitting ? "Logging…" : "Log Defect"}
          </button>
        </div>
      </div>
    </div>
  );
}
