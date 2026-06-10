import { useState, useRef } from "react";
import { logDefect, analyzeImage } from "../api/client";
import { COLORS, Card, PageHeader, SectionLabel, Input, Button } from "../components/Layout";

const SEVERITIES = ["low", "medium", "high", "critical"];

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
  const fileRef = useRef();

  const handlePhoto = async (file) => {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setDefectType("");
    setSeverity("low");
    setNotes("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await analyzeImage(formData);
      if (res.data.defect_type) {
        setDefectType(res.data.defect_type);
        setSeverity(res.data.severity || "low");
        setNotes(res.data.notes || "");
      }
    } catch {
      // silently fail — manual entry still works
    }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!productId || !defectType || !stage) {
      setError("Product ID, stage and defect type are required");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await logDefect({
        company_id: company.company_id,
        product_id: productId,
        stage_number: parseInt(stage),
        defect_type: defectType,
        severity,
        notes,
      });

      setSuccess(`Defect logged successfully for ${productId}`);
      setProductId("");
      setDefectType("");
      setSeverity("low");
      setNotes("");
      setPhoto(null);
      setPreview(null);
      setStage("");
    } catch {
      setError("Failed to log defect — check API connection");
    }
    setSubmitting(false);
  };

  const severityColor = (s) => ({
    low: COLORS.low,
    medium: COLORS.medium,
    high: COLORS.high,
    critical: COLORS.critical,
  }[s]);

  return (
    <div>
      <PageHeader
        title="Log Defect"
        subtitle="Take a photo — AI fills in the details automatically"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Photo upload */}
        <Card>
          <SectionLabel>📸 Photo</SectionLabel>

          {preview ? (
            <div style={{ position: "relative", marginBottom: 16 }}>
              <img
                src={preview}
                alt="defect"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  maxHeight: 280,
                  objectFit: "cover",
                }}
              />
              <button
                onClick={() => { setPhoto(null); setPreview(null); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: COLORS.critical + "cc",
                  border: "none", borderRadius: 8,
                  padding: "4px 10px", color: "white",
                  fontSize: 12, cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${COLORS.border}`,
                borderRadius: 12,
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 16,
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
                Upload a photo
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                AI will automatically detect the defect type and severity
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={e => handlePhoto(e.target.files[0])}
          />

          <button
            onClick={() => fileRef.current.click()}
            style={{
              width: "100%",
              background: COLORS.accentGlow,
              border: `1px solid ${COLORS.accent}44`,
              borderRadius: 10,
              padding: "12px",
              color: COLORS.accentLight,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {preview ? "Replace Photo" : "Choose Photo"}
          </button>

          {analyzing && (
            <div style={{
              marginTop: 12,
              padding: "10px 16px",
              background: COLORS.accentGlow,
              border: `1px solid ${COLORS.accent}33`,
              borderRadius: 10,
              fontSize: 13,
              color: COLORS.accentLight,
              textAlign: "center",
            }}>
              🔍 AI analyzing image...
            </div>
          )}

          {photo && !analyzing && (
            <div style={{
              marginTop: 12,
              padding: "10px 16px",
              background: COLORS.low + "20",
              border: `1px solid ${COLORS.low}33`,
              borderRadius: 10,
              fontSize: 13,
              color: COLORS.low,
              textAlign: "center",
            }}>
              ✅ AI analysis complete — review fields on the right
            </div>
          )}
        </Card>

        {/* Form */}
        <Card>
          <SectionLabel>Defect Details</SectionLabel>

          {/* Product ID */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>
              {company.universal_id_field?.toUpperCase() || "PRODUCT ID"}
            </div>
            <Input
              value={productId}
              onChange={e => setProductId(e.target.value)}
              placeholder="Enter product ID..."
            />
          </div>

          {/* Stage */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>STAGE</div>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              style={{
                width: "100%",
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: stage ? COLORS.text : COLORS.muted,
                fontSize: 14,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Select stage...</option>
              {stages.map(s => (
                <option key={s.stage_id} value={s.stage_number}>
                  {s.stage_number} — {s.stage_name}
                </option>
              ))}
            </select>
          </div>

          {/* Defect type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>
              DEFECT TYPE
              {analyzing && <span style={{ color: COLORS.accentLight, marginLeft: 8 }}>AI filling...</span>}
            </div>
            <Input
              value={defectType}
              onChange={e => setDefectType(e.target.value)}
              placeholder="e.g. scratch, dent, electrical..."
            />
          </div>

          {/* Severity */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>SEVERITY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {SEVERITIES.map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  style={{
                    background: severity === s ? severityColor(s) + "30" : COLORS.bg,
                    border: `1px solid ${severity === s ? severityColor(s) : COLORS.border}`,
                    borderRadius: 8,
                    padding: "8px 0",
                    color: severity === s ? severityColor(s) : COLORS.muted,
                    fontSize: 12,
                    fontWeight: severity === s ? 700 : 400,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>NOTES</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              style={{
                width: "100%",
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: COLORS.text,
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 12,
              padding: "10px 16px",
              background: COLORS.critical + "20",
              border: `1px solid ${COLORS.critical}40`,
              borderRadius: 10,
              fontSize: 13,
              color: COLORS.critical,
            }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              marginBottom: 12,
              padding: "10px 16px",
              background: COLORS.low + "20",
              border: `1px solid ${COLORS.low}40`,
              borderRadius: 10,
              fontSize: 13,
              color: COLORS.low,
            }}>
              ✅ {success}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              background: submitting
                ? COLORS.border
                : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
              border: "none",
              borderRadius: 12,
              padding: "14px",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {submitting ? "Logging..." : "Log Defect"}
          </button>
        </Card>
      </div>
    </div>
  );
}
