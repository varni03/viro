import { useState } from "react";
import { COLORS } from "../components/Layout";

const API = "http://localhost:8000";

const INDUSTRY_TEMPLATES = {
  automotive: {
    label: "Automotive / Vehicle Manufacturing",
    icon: "🚗",
    term_product: "Vehicle",
    term_defect: "Defect",
    term_stage: "Station",
    term_issue: "Issue",
    stages: [
      { stage_number: 110, stage_name: "Entry — In The Door", expected_duration_mins: 30 },
      { stage_number: 310, stage_name: "Production Line", expected_duration_mins: 120 },
      { stage_number: 510, stage_name: "Quality Inspection", expected_duration_mins: 60 },
      { stage_number: 710, stage_name: "Approved to Ship", expected_duration_mins: 15 },
    ],
    defect_types: [
      { name: "scratch", default_severity: "low" },
      { name: "dent", default_severity: "medium" },
      { name: "paint_issue", default_severity: "low" },
      { name: "electrical_fault", default_severity: "high" },
      { name: "mechanical_failure", default_severity: "critical" },
      { name: "alignment_issue", default_severity: "medium" },
    ]
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "predictive", "repair", "settings"]
    },
  marine: {
    label: "Marine / Shipping Procurement",
    icon: "🚢",
    term_product: "RFQ",
    term_defect: "Issue",
    term_stage: "Stage",
    term_issue: "Delay",
    stages: [
      { stage_number: 100, stage_name: "Enquiry Received", expected_duration_mins: 30 },
      { stage_number: 200, stage_name: "Suppliers Identified", expected_duration_mins: 60 },
      { stage_number: 300, stage_name: "Quotes Received", expected_duration_mins: 120 },
      { stage_number: 400, stage_name: "Order Placed", expected_duration_mins: 30 },
      { stage_number: 500, stage_name: "Delivered", expected_duration_mins: 15 },
    ],
    defect_types: [
      { name: "wrong_parts", default_severity: "high" },
      { name: "supplier_delay", default_severity: "medium" },
      { name: "quality_issue", default_severity: "high" },
      { name: "customs_hold", default_severity: "medium" },
      { name: "missing_documentation", default_severity: "low" },
    ]
    modules: ["dashboard", "search", "log_issue", "analytics", "settings"]
  },
  food: {
    label: "Food Production",
    icon: "🥫",
    term_product: "Batch",
    term_defect: "Finding",
    term_stage: "Phase",
    term_issue: "Contamination Risk",
    stages: [
      { stage_number: 100, stage_name: "Raw Material Intake", expected_duration_mins: 45 },
      { stage_number: 200, stage_name: "Processing", expected_duration_mins: 120 },
      { stage_number: 300, stage_name: "Quality Check", expected_duration_mins: 60 },
      { stage_number: 400, stage_name: "Packaging", expected_duration_mins: 45 },
      { stage_number: 500, stage_name: "Dispatch", expected_duration_mins: 30 },
    ],
    defect_types: [
      { name: "contamination", default_severity: "critical" },
      { name: "weight_variance", default_severity: "medium" },
      { name: "seal_failure", default_severity: "high" },
      { name: "labeling_error", default_severity: "low" },
      { name: "temperature_breach", default_severity: "critical" },
    ]
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "settings"]

  },
  medical: {
    label: "Medical Devices",
    icon: "🏥",
    term_product: "Device",
    term_defect: "Non-Conformance",
    term_stage: "Phase",
    term_issue: "Compliance Issue",
    stages: [
      { stage_number: 100, stage_name: "Assembly", expected_duration_mins: 90 },
      { stage_number: 200, stage_name: "Sterilization", expected_duration_mins: 120 },
      { stage_number: 300, stage_name: "Quality Control", expected_duration_mins: 60 },
      { stage_number: 400, stage_name: "Regulatory Check", expected_duration_mins: 45 },
      { stage_number: 500, stage_name: "Packaging & Release", expected_duration_mins: 30 },
    ],
    defect_types: [
      { name: "dimensional_error", default_severity: "high" },
      { name: "surface_defect", default_severity: "medium" },
      { name: "sterility_failure", default_severity: "critical" },
      { name: "labeling_error", default_severity: "high" },
      { name: "assembly_fault", default_severity: "critical" },
    ]
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "predictive", "settings"]

  },
  logistics: {
    label: "Logistics / Warehousing",
    icon: "📦",
    term_product: "Shipment",
    term_defect: "Incident",
    term_stage: "Stage",
    term_issue: "Delay",
    stages: [
      { stage_number: 100, stage_name: "Order Received", expected_duration_mins: 15 },
      { stage_number: 200, stage_name: "Picked & Packed", expected_duration_mins: 45 },
      { stage_number: 300, stage_name: "In Transit", expected_duration_mins: 1440 },
      { stage_number: 400, stage_name: "Out for Delivery", expected_duration_mins: 240 },
      { stage_number: 500, stage_name: "Delivered", expected_duration_mins: 15 },
    ],
    defect_types: [
      { name: "damaged_goods", default_severity: "high" },
      { name: "wrong_item", default_severity: "high" },
      { name: "delivery_delay", default_severity: "medium" },
      { name: "missing_items", default_severity: "high" },
      { name: "address_error", default_severity: "medium" },
    ]
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "settings"]

  },
  custom: {
    label: "Custom / Other",
    icon: "⚙️",
    term_product: "Item",
    term_defect: "Issue",
    term_stage: "Stage",
    term_issue: "Problem",
    stages: [],
    defect_types: []
  }
  modules: ["dashboard", "search", "log_issue", "settings"]

};
const ALL_MODULES = [
    { id: "dashboard", label: "Dashboard", icon: "⬡", required: true },
    { id: "search", label: "Search", icon: "🔍", required: true },
    { id: "log_issue", label: "Log Issue", icon: "📸", required: true },
    { id: "workflow", label: "Workflow Tracker", icon: "🔧", required: false },
    { id: "analytics", label: "Analytics", icon: "📊", required: false },
    { id: "predictive", label: "Predictive Risk", icon: "⚠️", required: false },
    { id: "repair", label: "Repair Queue", icon: "🔨", required: false },
    { id: "settings", label: "Settings", icon: "⚙️", required: false },
  ];
  
    
  const STEPS = [
    { id: 1, label: "Welcome" },
    { id: 2, label: "Company" },
    { id: 3, label: "Industry" },
    { id: 4, label: "Modules" },
    { id: 5, label: "Workflow" },
    { id: 6, label: "Team" },
    { id: 7, label: "Done" },
  ];
  

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [company, setCompany] = useState({
    name: "",
    industry: "",
    universal_id_field: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [stages, setStages] = useState([]);
  const [defectTypes, setDefectTypes] = useState([]);
  const [terminology, setTerminology] = useState({
    term_product: "Product",
    term_defect: "Defect",
    term_stage: "Stage",
    term_issue: "Issue",
  });
  const [adminUser, setAdminUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [createdCompany, setCreatedCompany] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);


  const selectTemplate = (key) => {
    const template = INDUSTRY_TEMPLATES[key];
    setSelectedTemplate(key);
    setStages([...template.stages]);
    setDefectTypes([...template.defect_types]);
    setTerminology({
      term_product: template.term_product,
      term_defect: template.term_defect,
      term_stage: template.term_stage,
      term_issue: template.term_issue,
    });
    setCompany(prev => ({ ...prev, industry: template.label }));
    setEnabledModules(template.modules);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create company
      const companyRes = await fetch(`${API}/onboarding/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: company.name,
          industry: company.industry,
          universal_id_field: company.universal_id_field || terminology.term_product.toLowerCase().replace(" ", "_"),
        })
      }).then(r => r.json());

      const companyId = companyRes.company_id;

      // 2. Create stages
      for (const stage of stages) {
        await fetch(`${API}/settings/stages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...stage, company_id: companyId })
        });
      }

      // 3. Create defect types
      for (const dt of defectTypes) {
        await fetch(`${API}/settings/defect-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...dt, company_id: companyId })
        });
      }

      // 4. Save terminology
      await fetch(`${API}/config/${companyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(terminology)
      });

      // 5. Create admin user
      const userRes = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...adminUser,
          role: "manager",
          company_id: companyId,
        })
      }).then(r => r.json());

// Save modules
const moduleData = ALL_MODULES.map(m => ({
    id: m.id,
    enabled: enabledModules.includes(m.id),
    custom_label: m.label,
    custom_icon: m.icon,
  }));
  
  await fetch(`${API}/modules/${companyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modules: moduleData })
  });
  
  setCreatedCompany({ companyId, ...companyRes });
  setStep(7);
  

      // Auto login
      if (userRes.token) {
        setTimeout(() => {
          localStorage.setItem("viro_token", userRes.token);
          localStorage.setItem("viro_user", JSON.stringify(userRes.user));
          localStorage.setItem("viro_company_id", companyRes.company_id);
          if (onComplete) onComplete(userRes.user, userRes.token);
        }, 3000);
      }
      

    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    background: "#12122a",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "12px 16px",
    color: COLORS.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: "0.08em",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed",
        width: 600, height: 600,
        background: COLORS.accent + "08",
        borderRadius: "50%",
        filter: "blur(100px)",
        pointerEvents: "none",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
      }} />

      <div style={{ width: "100%", maxWidth: 640, position: "relative" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
            borderRadius: 14,
            display: "flex", alignItems: "center",
            justifyContent: "center",
            fontSize: 26, margin: "0 auto 12px",
          }}>
            ⬡
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Welcome to Viro
          </div>
          <div style={{ color: COLORS.muted, fontSize: 14 }}>
            Let's get your platform set up in a few minutes
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map(s => (
            <div key={s.id} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: 4,
                borderRadius: 2,
                background: s.id <= step ? COLORS.accent : COLORS.border,
                marginBottom: 6,
                transition: "background 0.3s",
              }} />
              <div style={{
                fontSize: 10,
                color: s.id === step ? COLORS.accentLight : COLORS.muted,
                fontWeight: s.id === step ? 700 : 400,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: 40,
        }}>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20, padding: "12px 16px",
              background: COLORS.critical + "20",
              border: `1px solid ${COLORS.critical}40`,
              borderRadius: 10, color: COLORS.critical, fontSize: 13,
            }}>
              ❌ {error}
            </div>
          )}

          {/* STEP 1 — Welcome */}
          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                Let's set up your Viro platform
              </div>
              <div style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                Viro is an AI-powered operations intelligence platform.
                We'll walk you through setting up your company profile,
                workflow stages, issue types, and your first team members.
                It takes about 5 minutes.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
                {[
                  { icon: "🏭", label: "Any industry" },
                  { icon: "🤖", label: "AI built in" },
                  { icon: "⚡", label: "5 min setup" },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, padding: "16px 12px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                  border: "none", borderRadius: 12,
                  padding: "14px", color: "white",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}
              >
                Get Started →
              </button>
            </div>
          )}

          {/* STEP 2 — Company */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your company</div>
              <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 24 }}>
                Tell us about your company
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>COMPANY NAME *</label>
                <input
                  style={inputStyle}
                  value={company.name}
                  onChange={e => setCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Meridian Vans, Tidewater Marine"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>WHAT DO YOU CALL YOUR MAIN TRACKED ITEM?</label>
                <input
                  style={inputStyle}
                  value={company.universal_id_field}
                  onChange={e => setCompany(prev => ({ ...prev, universal_id_field: e.target.value }))}
                  placeholder="e.g. Vehicle, RFQ, Batch, Shipment, Order"
                />
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
                  This is what you track through your workflow — we'll use this term throughout your platform
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, padding: "12px",
                    color: COLORS.muted, fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!company.name) return setError("Company name is required");
                    setError(null);
                    setStep(3);
                  }}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                    border: "none", borderRadius: 12,
                    padding: "12px", color: "white",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Industry template */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your industry</div>
              <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 24 }}>
                Choose a template to pre-fill your workflow — you can customize everything after
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {Object.entries(INDUSTRY_TEMPLATES).map(([key, template]) => (
                  <div
                    key={key}
                    onClick={() => selectTemplate(key)}
                    style={{
                      background: selectedTemplate === key ? COLORS.accentGlow : COLORS.card,
                      border: `1px solid ${selectedTemplate === key ? COLORS.accent + "55" : COLORS.border}`,
                      borderRadius: 12, padding: "16px",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{template.icon}</div>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: selectedTemplate === key ? COLORS.accentLight : COLORS.text,
                    }}>
                      {template.label}
                    </div>
                    {key !== "custom" && (
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
                        {template.stages.length} stages · {template.defect_types.length} issue types
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1, background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, padding: "12px",
                    color: COLORS.muted, fontSize: 14, cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!selectedTemplate) return setError("Please select an industry template");
                    setError(null);
                    setStep(4);
                  }}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                    border: "none", borderRadius: 12,
                    padding: "12px", color: "white",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}
          {/* STEP 4 — Modules */}
{step === 4 && (
  <div>
    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your modules</div>
    <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 20 }}>
      Choose which features your team needs — you can change this anytime in Settings
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
      {ALL_MODULES.map(module => {
        const isEnabled = enabledModules.includes(module.id);
        return (
          <div
            key={module.id}
            onClick={() => {
              if (module.required) return;
              setEnabledModules(prev =>
                isEnabled
                  ? prev.filter(m => m !== module.id)
                  : [...prev, module.id]
              );
            }}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              background: isEnabled ? COLORS.accentGlow : COLORS.card,
              border: `1px solid ${isEnabled ? COLORS.accent + "44" : COLORS.border}`,
              borderRadius: 12, padding: "14px 16px",
              cursor: module.required ? "default" : "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{module.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: isEnabled ? COLORS.accentLight : COLORS.text }}>
                  {module.label}
                </div>
                {module.required && (
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Required</div>
                )}
              </div>
            </div>

            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: isEnabled ? COLORS.accent : COLORS.border,
              position: "relative", transition: "background 0.2s",
              flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: 3,
                left: isEnabled ? 23 : 3,
                transition: "left 0.2s",
              }} />
            </div>
          </div>
        );
      })}
    </div>

    <div style={{ display: "flex", gap: 12 }}>
      <button
        onClick={() => setStep(3)}
        style={{
          flex: 1, background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "12px",
          color: COLORS.muted, fontSize: 14, cursor: "pointer",
        }}
      >
        ← Back
      </button>
      <button
        onClick={() => setStep(5)}
        style={{
          flex: 2,
          background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
          border: "none", borderRadius: 12,
          padding: "12px", color: "white",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        Continue →
      </button>
    </div>
  </div>
)}


          {/* STEP 4 — Review workflow */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your workflow</div>
              <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 20 }}>
                Review and customize your stages and terminology
              </div>

              {/* Terminology */}
              <div style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: 16, marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 12, letterSpacing: "0.06em" }}>
                  TERMINOLOGY
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { key: "term_product", label: "Item name" },
                    { key: "term_defect", label: "Issue name" },
                    { key: "term_stage", label: "Stage name" },
                    { key: "term_issue", label: "Problem name" },
                  ].map(field => (
                    <div key={field.key}>
                      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4 }}>{field.label.toUpperCase()}</div>
                      <input
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: 13 }}
                        value={terminology[field.key]}
                        onChange={e => setTerminology(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stages */}
              <div style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: 16, marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 12, letterSpacing: "0.06em" }}>
                  WORKFLOW STAGES
                </div>
                {stages.map((stage, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 8,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: COLORS.accentGlow,
                      border: `1px solid ${COLORS.accent}44`,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11,
                      fontWeight: 700, color: COLORS.accentLight,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <input
                      style={{ ...inputStyle, padding: "8px 12px", fontSize: 13 }}
                      value={stage.stage_name}
                      onChange={e => {
                        const updated = [...stages];
                        updated[i] = { ...updated[i], stage_name: e.target.value };
                        setStages(updated);
                      }}
                    />
                    <button
                      onClick={() => setStages(stages.filter((_, si) => si !== i))}
                      style={{
                        background: COLORS.critical + "20",
                        border: `1px solid ${COLORS.critical}40`,
                        borderRadius: 6, padding: "6px 10px",
                        color: COLORS.critical, fontSize: 12,
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setStages([...stages, {
                    stage_number: (stages.length + 1) * 100,
                    stage_name: "",
                    expected_duration_mins: 30
                  }])}
                  style={{
                    background: "transparent",
                    border: `1px dashed ${COLORS.border}`,
                    borderRadius: 8, padding: "8px 16px",
                    color: COLORS.muted, fontSize: 12,
                    cursor: "pointer", width: "100%", marginTop: 4,
                  }}
                >
                  + Add Stage
                </button>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    flex: 1, background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, padding: "12px",
                    color: COLORS.muted, fontSize: 14, cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                    border: "none", borderRadius: 12,
                    padding: "12px", color: "white",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Admin user */}
          {step === 5 && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your account</div>
              <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 24 }}>
                Create your manager account — you can add more team members after setup
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>FIRST NAME *</label>
                  <input
                    style={inputStyle}
                    value={adminUser.first_name}
                    onChange={e => setAdminUser(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label style={labelStyle}>LAST NAME *</label>
                  <input
                    style={inputStyle}
                    value={adminUser.last_name}
                    onChange={e => setAdminUser(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>WORK EMAIL *</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={adminUser.email}
                  onChange={e => setAdminUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@company.com"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>PASSWORD *</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={adminUser.password}
                  onChange={e => setAdminUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Choose a strong password"
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep(4)}
                  style={{
                    flex: 1, background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, padding: "12px",
                    color: COLORS.muted, fontSize: 14, cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!adminUser.first_name || !adminUser.last_name || !adminUser.email || !adminUser.password) {
                      return setError("All fields are required");
                    }
                    setError(null);
                    handleComplete();
                  }}
                  disabled={loading}
                  style={{
                    flex: 2,
                    background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                    border: "none", borderRadius: 12,
                    padding: "12px", color: "white",
                    fontSize: 14, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Setting up your platform..." : "Complete Setup →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 7 — Done */}
          {step === 6 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                {company.name} is live on Viro!
              </div>
              <div style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Your platform is ready. You'll be redirected to your dashboard in a moment.
              </div>

              <div style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: 20, marginBottom: 24,
                textAlign: "left",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 12, letterSpacing: "0.06em" }}>
                  YOUR SETUP
                </div>
                {[
                  { label: "Company", value: company.name },
                  { label: "Industry", value: company.industry },
                  { label: "Stages", value: `${stages.length} configured` },
                  { label: "Issue types", value: `${defectTypes.length} configured` },
                  { label: "Terminology", value: `${terminology.term_product}, ${terminology.term_defect}` },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: i < 4 ? `1px solid ${COLORS.border}` : "none",
                  }}>
                    <span style={{ fontSize: 13, color: COLORS.muted }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{
                background: COLORS.accentGlow,
                border: `1px solid ${COLORS.accent}33`,
                borderRadius: 10, padding: "12px 16px",
                fontSize: 13, color: COLORS.accentLight,
              }}>
                ⚡ Redirecting to your dashboard...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
