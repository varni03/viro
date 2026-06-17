import { useState, useEffect } from "react";

const API = "https://web-production-0457e.up.railway.app";
const GREEN = "#34d399";

const INDUSTRY_TEMPLATES = {
  automotive: {
    label: "Automotive / Vehicle Manufacturing", icon: "🚗",
    term_product: "Vehicle", term_defect: "Defect", term_stage: "Station", term_issue: "Issue",
    stages: [
      { stage_number: 110, stage_name: "Entry — In The Door", expected_duration_mins: 30 },
      { stage_number: 310, stage_name: "Production Line", expected_duration_mins: 120 },
      { stage_number: 510, stage_name: "Quality Inspection", expected_duration_mins: 60 },
      { stage_number: 710, stage_name: "Approved to Ship", expected_duration_mins: 15 },
    ],
    defect_types: [
      { name: "scratch", default_severity: "low" }, { name: "dent", default_severity: "medium" },
      { name: "paint_issue", default_severity: "low" }, { name: "electrical_fault", default_severity: "high" },
      { name: "mechanical_failure", default_severity: "critical" }, { name: "alignment_issue", default_severity: "medium" },
    ],
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "predictive", "repair", "settings"],
  },
  marine: {
    label: "Marine / Shipping Procurement", icon: "🚢",
    term_product: "RFQ", term_defect: "Issue", term_stage: "Stage", term_issue: "Delay",
    stages: [
      { stage_number: 100, stage_name: "Enquiry Received", expected_duration_mins: 30 },
      { stage_number: 200, stage_name: "Suppliers Identified", expected_duration_mins: 60 },
      { stage_number: 300, stage_name: "Quotes Received", expected_duration_mins: 120 },
      { stage_number: 400, stage_name: "Order Placed", expected_duration_mins: 30 },
      { stage_number: 500, stage_name: "Delivered", expected_duration_mins: 15 },
    ],
    defect_types: [
      { name: "wrong_parts", default_severity: "high" }, { name: "supplier_delay", default_severity: "medium" },
      { name: "quality_issue", default_severity: "high" }, { name: "customs_hold", default_severity: "medium" },
      { name: "missing_documentation", default_severity: "low" },
    ],
    modules: ["dashboard", "search", "log_issue", "analytics", "settings"],
  },
  food: {
    label: "Food Production", icon: "🥫",
    term_product: "Batch", term_defect: "Finding", term_stage: "Phase", term_issue: "Contamination Risk",
    stages: [
      { stage_number: 100, stage_name: "Raw Material Intake", expected_duration_mins: 45 },
      { stage_number: 200, stage_name: "Processing", expected_duration_mins: 120 },
      { stage_number: 300, stage_name: "Quality Check", expected_duration_mins: 60 },
      { stage_number: 400, stage_name: "Packaging", expected_duration_mins: 45 },
      { stage_number: 500, stage_name: "Dispatch", expected_duration_mins: 30 },
    ],
    defect_types: [
      { name: "contamination", default_severity: "critical" }, { name: "weight_variance", default_severity: "medium" },
      { name: "seal_failure", default_severity: "high" }, { name: "labeling_error", default_severity: "low" },
      { name: "temperature_breach", default_severity: "critical" },
    ],
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "settings"],
  },
  medical: {
    label: "Medical Devices", icon: "🏥",
    term_product: "Device", term_defect: "Non-Conformance", term_stage: "Phase", term_issue: "Compliance Issue",
    stages: [
      { stage_number: 100, stage_name: "Assembly", expected_duration_mins: 90 },
      { stage_number: 200, stage_name: "Sterilization", expected_duration_mins: 120 },
      { stage_number: 300, stage_name: "Quality Control", expected_duration_mins: 60 },
      { stage_number: 400, stage_name: "Regulatory Check", expected_duration_mins: 45 },
      { stage_number: 500, stage_name: "Packaging & Release", expected_duration_mins: 30 },
    ],
    defect_types: [
      { name: "dimensional_error", default_severity: "high" }, { name: "surface_defect", default_severity: "medium" },
      { name: "sterility_failure", default_severity: "critical" }, { name: "labeling_error", default_severity: "high" },
      { name: "assembly_fault", default_severity: "critical" },
    ],
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "predictive", "settings"],
  },
  logistics: {
    label: "Logistics / Warehousing", icon: "📦",
    term_product: "Shipment", term_defect: "Incident", term_stage: "Stage", term_issue: "Delay",
    stages: [
      { stage_number: 100, stage_name: "Order Received", expected_duration_mins: 15 },
      { stage_number: 200, stage_name: "Picked & Packed", expected_duration_mins: 45 },
      { stage_number: 300, stage_name: "In Transit", expected_duration_mins: 1440 },
      { stage_number: 400, stage_name: "Out for Delivery", expected_duration_mins: 240 },
      { stage_number: 500, stage_name: "Delivered", expected_duration_mins: 15 },
    ],
    defect_types: [
      { name: "damaged_goods", default_severity: "high" }, { name: "wrong_item", default_severity: "high" },
      { name: "delivery_delay", default_severity: "medium" }, { name: "missing_items", default_severity: "high" },
      { name: "address_error", default_severity: "medium" },
    ],
    modules: ["dashboard", "search", "log_issue", "workflow", "analytics", "settings"],
  },
  custom: {
    label: "Custom / Other", icon: "⚙️",
    term_product: "Item", term_defect: "Issue", term_stage: "Stage", term_issue: "Problem",
    stages: [], defect_types: [], modules: ["dashboard", "search", "log_issue", "settings"],
  },
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
const STEPS = ["Welcome", "Company", "Industry", "Modules", "Workflow", "Team"];

const STYLE_ID = "viro-onboarding-styles";
function useOnboardingStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..900&family=JetBrains+Mono:wght@400;500;700&display=swap');
      .ob-root{font-family:'Inter',-apple-system,sans-serif;background:#08090a;color:#fff;-webkit-font-smoothing:antialiased}
      .ob-mono{font-family:'JetBrains Mono',monospace}
      .ob-grid{position:fixed;inset:0;z-index:0;pointer-events:none;
        background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),
          linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);background-size:54px 54px;
        mask-image:radial-gradient(ellipse 62% 56% at 50% 36%,#000,transparent 76%);
        -webkit-mask-image:radial-gradient(ellipse 62% 56% at 50% 36%,#000,transparent 76%)}
      .ob-step{animation:ob-in .5s cubic-bezier(.16,1,.3,1)}
      @keyframes ob-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      @keyframes ob-spin{to{transform:rotate(405deg)}}
      @keyframes ob-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      .ob-eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.14em;
        text-transform:uppercase;color:rgba(255,255,255,0.4)}
      .ob-h{font-size:clamp(26px,3.6vw,34px);font-weight:800;letter-spacing:-0.03em;line-height:1.08;margin:12px 0 0}
      .ob-sub{font-size:15px;line-height:1.55;color:rgba(255,255,255,0.5);margin:10px 0 0}
      .ob-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px}
      .ob-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
        border-radius:11px;padding:12px 15px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;
        font-family:inherit;transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}
      .ob-input::placeholder{color:rgba(255,255,255,0.28)}
      .ob-input:focus{border-color:rgba(255,255,255,0.28);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(255,255,255,0.05)}
      .ob-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;
        color:rgba(255,255,255,0.4);margin-bottom:7px}
      .ob-btn{border:none;border-radius:12px;font-size:14px;font-weight:700;font-family:inherit;letter-spacing:-0.01em;
        cursor:pointer;transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,background .18s ease,border-color .18s ease}
      .ob-btn-primary{background:#fff;color:#08090a;padding:13px 22px}
      .ob-btn-primary:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(255,255,255,0.16)}
      .ob-btn-ghost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.1);padding:13px 20px}
      .ob-btn-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.2)}
      .ob-tmpl{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;
        cursor:pointer;transition:transform .18s cubic-bezier(.16,1,.3,1),border-color .18s ease,background .18s ease}
      .ob-tmpl:hover{transform:translateY(-2px);border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.05)}
      .ob-tmpl.sel{border-color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.07)}
      .ob-toggle{width:44px;height:24px;border-radius:12px;position:relative;flex-shrink:0;transition:background .2s ease}
      .ob-toggle .knob{width:18px;height:18px;border-radius:50%;background:#08090a;position:absolute;top:3px;transition:left .2s cubic-bezier(.16,1,.3,1)}
    `;
    document.head.appendChild(el);
  }, []);
}

export default function Onboarding({ onComplete }) {
  useOnboardingStyles();
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState("form"); // form | generating | done
  const [genActive, setGenActive] = useState(0);
  const [error, setError] = useState(null);

  const [company, setCompany] = useState({ name: "", industry: "", universal_id_field: "" });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [stages, setStages] = useState([]);
  const [defectTypes, setDefectTypes] = useState([]);
  const [terminology, setTerminology] = useState({ term_product: "Product", term_defect: "Defect", term_stage: "Stage", term_issue: "Issue" });
  const [adminUser, setAdminUser] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [createdCompany, setCreatedCompany] = useState(null);

  const [enabledModules, setEnabledModules] = useState([]);

  const genSteps = [
    `Creating ${company.name || "your company"}`,
    `Configuring ${stages.length} workflow ${stages.length === 1 ? "stage" : "stages"}`,
    `Setting up ${defectTypes.length} issue ${defectTypes.length === 1 ? "type" : "types"}`,
    "Applying your terminology",
    "Provisioning your team & modules",
    "Composing your dashboard layout",
  ];

  useEffect(() => {
    if (phase !== "generating") return;
    setGenActive(0);
    const timers = [];
    for (let i = 1; i <= genSteps.length; i++) timers.push(setTimeout(() => setGenActive(i), i * 820));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const selectTemplate = (key) => {
    const t = INDUSTRY_TEMPLATES[key];
    setSelectedTemplate(key);
    setStages([...t.stages]);
    setDefectTypes([...t.defect_types]);
    setTerminology({ term_product: t.term_product, term_defect: t.term_defect, term_stage: t.term_stage, term_issue: t.term_issue });
    setCompany(prev => ({ ...prev, industry: t.label }));
    setEnabledModules(t.modules);
  };

  const runSetup = async () => {
    setError(null);
    setPhase("generating");
    const started = Date.now();
    let userRes, companyRes;
    try {
      companyRes = await fetch(`${API}/onboarding/company`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: company.name, industry: company.industry,
          universal_id_field: company.universal_id_field || terminology.term_product.toLowerCase().replace(" ", "_") })
      }).then(r => r.json());
      const companyId = companyRes.company_id;

      for (const stage of stages) {
        await fetch(`${API}/settings/stages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...stage, company_id: companyId }) });
      }
      for (const dt of defectTypes) {
        await fetch(`${API}/settings/defect-types`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dt, company_id: companyId }) });
      }
      await fetch(`${API}/config/${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(terminology) });

      userRes = await fetch(`${API}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adminUser, role: "manager", company_id: companyId })
      }).then(r => r.json());

      const moduleData = ALL_MODULES.map(m => ({ id: m.id, enabled: enabledModules.includes(m.id), custom_label: m.label, custom_icon: m.icon }));
      await fetch(`${API}/modules/${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modules: moduleData }) });

      setCreatedCompany({ companyId, ...companyRes });
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setPhase("form");
      return;
    }

    // hold for the generation animation to play out, then reveal Done + auto-login
    const minMs = genSteps.length * 820 + 700;
    setTimeout(() => {
      setPhase("done");
      if (userRes && userRes.token) {
        setTimeout(() => {
          localStorage.setItem("viro_token", userRes.token);
          localStorage.setItem("viro_user", JSON.stringify(userRes.user));
          localStorage.setItem("viro_company_id", companyRes.company_id);
          if (onComplete) onComplete(userRes.user, userRes.token);
        }, 2800);
      }
    }, Math.max(0, minMs - (Date.now() - started)));
  };

  const BackNext = ({ onBack, onNext, nextLabel = "Continue →", nextWide }) => (
    <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
      {onBack && <button className="ob-btn ob-btn-ghost" style={{ flex: 1 }} onClick={onBack}>← Back</button>}
      <button className="ob-btn ob-btn-primary" style={{ flex: nextWide ? 2 : 1 }} onClick={onNext}>{nextLabel}</button>
    </div>
  );

  return (
    <div className="ob-root" style={{ minHeight: "100vh", height: "100vh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div className="ob-grid" />
      <div style={{ position: "fixed", width: 520, height: 420, top: "26%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.045)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 660, position: "relative", zIndex: 1, padding: "40px 0" }}>
        {/* logo + progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 22 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 100 100"><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 36, maxWidth: 420, margin: "0 auto 36px" }}>
          {STEPS.map((_, i) => {
            const idx = i + 1;
            const active = phase === "done" ? true : phase === "generating" ? idx <= 6 : idx <= step;
            return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: active ? "#fff" : "rgba(255,255,255,0.12)", transition: "background .35s ease" }} />;
          })}
        </div>

        {error && (
          <div style={{ marginBottom: 18, padding: "12px 15px", background: "rgba(255,90,90,0.12)", border: "1px solid rgba(255,90,90,0.3)", borderRadius: 12, color: "#ff5a5a", fontSize: 13 }}>{error}</div>
        )}

        {/* ── GENERATING ── */}
        {phase === "generating" && (
          <div className="ob-step" style={{ textAlign: "center", paddingTop: 10 }}>
            <div style={{ width: 70, height: 70, margin: "0 auto 26px", borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", animation: "ob-spin 3.4s cubic-bezier(.6,0,.4,1) infinite" }}>
              <svg width="31" height="31" viewBox="0 0 100 100" style={{ transform: "rotate(-45deg)" }}><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
            </div>
            <h1 className="ob-h">Building your platform</h1>
            <p className="ob-sub" style={{ maxWidth: 440, margin: "10px auto 0" }}>
              Designing an operations system for <span className="ob-mono" style={{ color: "#fff", fontSize: 13.5 }}>{company.name || "your company"}</span> — not a template.
            </p>
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 5, textAlign: "left", maxWidth: 460, margin: "32px auto 0" }}>
              {genSteps.map((s, i) => {
                const state = i < genActive ? "done" : i === genActive ? "doing" : "todo";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 15px", borderRadius: 11,
                    background: state === "doing" ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${state === "doing" ? "rgba(255,255,255,0.1)" : "transparent"}`, transition: "all .35s ease" }}>
                    <span style={{ width: 21, height: 21, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                      background: state === "done" ? GREEN : "transparent", border: state === "done" ? "none" : "1px solid rgba(255,255,255,0.22)", color: state === "done" ? "#08090a" : "rgba(255,255,255,0.6)" }}>
                      {state === "done" ? "✓" : state === "doing" ? <span style={{ display: "inline-block", animation: "ob-spin 1s linear infinite" }}>◴</span> : ""}
                    </span>
                    <span style={{ fontSize: 14, color: state === "todo" ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: state === "doing" ? 600 : 400 }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && (
          <div className="ob-step" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
            <h1 className="ob-h">{company.name} is live on Viro.</h1>
            <p className="ob-sub" style={{ maxWidth: 420, margin: "10px auto 0" }}>Your platform is ready. Taking you to your dashboard…</p>
            <div className="ob-card" style={{ padding: 22, marginTop: 26, textAlign: "left", maxWidth: 460, margin: "26px auto 0" }}>
              <div className="ob-eyebrow" style={{ marginBottom: 14 }}>Your setup</div>
              {[
                ["Company", company.name],
                ["Industry", company.industry],
                ["Workflow", `${stages.length} stages configured`],
                ["Issue types", `${defectTypes.length} configured`],
                ["Terminology", `${terminology.term_product}, ${terminology.term_defect}`],
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{row[0]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row[1]}</span>
                </div>
              ))}
            </div>
            <div className="ob-mono" style={{ marginTop: 18, fontSize: 12, color: GREEN }}>● redirecting to {createdCompany?.companyId || "your platform"}…</div>
          </div>
        )}

        {/* ── FORM STEPS ── */}
        {phase === "form" && (
          <div className="ob-step">
            {/* 1 — Welcome */}
            {step === 1 && (
              <div style={{ textAlign: "center" }}>
                <div className="ob-eyebrow">Step 01 — Welcome</div>
                <h1 className="ob-h" style={{ fontSize: "clamp(30px,4.4vw,42px)" }}>Let's build your platform.</h1>
                <p className="ob-sub" style={{ maxWidth: 460, margin: "12px auto 0" }}>
                  No spreadsheets to import, no template to wrestle. Tell Viro how your operation runs and it builds the platform around you — about five minutes.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "30px 0" }}>
                  {[["🏭", "Any industry"], ["✦", "AI built-in"], ["⚡", "5-min setup"]].map((it, i) => (
                    <div key={i} className="ob-card" style={{ padding: "18px 12px", textAlign: "center", animation: `ob-rise .5s cubic-bezier(.16,1,.3,1) ${i * 70}ms both` }}>
                      <div style={{ fontSize: 22, marginBottom: 7 }}>{it[0]}</div>
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{it[1]}</div>
                    </div>
                  ))}
                </div>
                <button className="ob-btn ob-btn-primary" style={{ width: "100%" }} onClick={() => setStep(2)}>Get started →</button>
              </div>
            )}

            {/* 2 — Company */}
            {step === 2 && (
              <div>
                <div className="ob-eyebrow">Step 02 — Company</div>
                <h1 className="ob-h">Your company.</h1>
                <p className="ob-sub">A couple of basics to anchor everything Viro builds.</p>
                <div style={{ marginTop: 24, marginBottom: 16 }}>
                  <div className="ob-lbl">Company name *</div>
                  <input className="ob-input" value={company.name} placeholder="e.g. Meridian Vans, Tidewater Marine"
                    onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div className="ob-lbl">What do you call your main tracked item?</div>
                  <input className="ob-input" value={company.universal_id_field} placeholder="e.g. Vehicle, RFQ, Batch, Shipment, Order"
                    onChange={e => setCompany(p => ({ ...p, universal_id_field: e.target.value }))} />
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 7 }}>This is what moves through your workflow — we'll use this word throughout your platform.</div>
                </div>
                <BackNext onBack={() => setStep(1)} nextWide onNext={() => { if (!company.name) return setError("Company name is required"); setError(null); setStep(3); }} />
              </div>
            )}

            {/* 3 — Industry */}
            {step === 3 && (
              <div>
                <div className="ob-eyebrow">Step 03 — Industry</div>
                <h1 className="ob-h">Pick a starting point.</h1>
                <p className="ob-sub">Choose the closest fit — Viro pre-fills your workflow and you can customize everything next.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 22 }}>
                  {Object.entries(INDUSTRY_TEMPLATES).map(([key, t]) => (
                    <div key={key} className={"ob-tmpl" + (selectedTemplate === key ? " sel" : "")} onClick={() => selectTemplate(key)}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: selectedTemplate === key ? "#fff" : "rgba(255,255,255,0.85)" }}>{t.label}</div>
                      {key !== "custom" && <div className="ob-mono" style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", marginTop: 5 }}>{t.stages.length} stages · {t.defect_types.length} issue types</div>}
                    </div>
                  ))}
                </div>
                <BackNext onBack={() => setStep(2)} nextWide onNext={() => { if (!selectedTemplate) return setError("Pick an industry to continue"); setError(null); setStep(4); }} />
              </div>
            )}

            {/* 4 — Modules */}
            {step === 4 && (
              <div>
                <div className="ob-eyebrow">Step 04 — Modules</div>
                <h1 className="ob-h">What does your team need?</h1>
                <p className="ob-sub">Turn features on or off — you can change this anytime in Settings.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
                  {ALL_MODULES.map(m => {
                    const on = enabledModules.includes(m.id);
                    return (
                      <div key={m.id} onClick={() => { if (m.required) return; setEnabledModules(p => on ? p.filter(x => x !== m.id) : [...p, m.id]); }}
                        className="ob-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px",
                          cursor: m.required ? "default" : "pointer", borderColor: on ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)", background: on ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</div>
                            {m.required && <div className="ob-mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>REQUIRED</div>}
                          </div>
                        </div>
                        <div className="ob-toggle" style={{ background: on ? "#fff" : "rgba(255,255,255,0.14)", opacity: m.required ? 0.55 : 1 }}>
                          <div className="knob" style={{ left: on ? 23 : 3, background: on ? "#08090a" : "rgba(255,255,255,0.6)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <BackNext onBack={() => setStep(3)} nextWide onNext={() => setStep(5)} />
              </div>
            )}

            {/* 5 — Workflow */}
            {step === 5 && (
              <div>
                <div className="ob-eyebrow">Step 05 — Workflow</div>
                <h1 className="ob-h">Your workflow & words.</h1>
                <p className="ob-sub">Tune the language and the stages your {terminology.term_product.toLowerCase()} moves through.</p>
                <div className="ob-card" style={{ padding: 18, marginTop: 22, marginBottom: 14 }}>
                  <div className="ob-eyebrow" style={{ marginBottom: 12 }}>Terminology</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[["term_product", "Item name"], ["term_defect", "Issue name"], ["term_stage", "Stage name"], ["term_issue", "Problem name"]].map(([k, l]) => (
                      <div key={k}>
                        <div className="ob-lbl">{l}</div>
                        <input className="ob-input" style={{ padding: "9px 12px", fontSize: 13 }} value={terminology[k]} onChange={e => setTerminology(p => ({ ...p, [k]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ob-card" style={{ padding: 18, marginBottom: 4 }}>
                  <div className="ob-eyebrow" style={{ marginBottom: 12 }}>Workflow stages</div>
                  {stages.map((stage, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div className="ob-mono" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>{i + 1}</div>
                      <input className="ob-input" style={{ padding: "9px 12px", fontSize: 13 }} value={stage.stage_name} onChange={e => { const u = [...stages]; u[i] = { ...u[i], stage_name: e.target.value }; setStages(u); }} />
                      <button onClick={() => setStages(stages.filter((_, si) => si !== i))} style={{ background: "rgba(255,90,90,0.12)", border: "1px solid rgba(255,90,90,0.3)", borderRadius: 8, padding: "7px 11px", color: "#ff5a5a", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setStages([...stages, { stage_number: (stages.length + 1) * 100, stage_name: "", expected_duration_mins: 30 }])}
                    style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.16)", borderRadius: 9, padding: "9px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12.5, cursor: "pointer", width: "100%", marginTop: 4, fontFamily: "inherit" }}>+ Add stage</button>
                </div>
                <BackNext onBack={() => setStep(4)} nextWide onNext={() => setStep(6)} />
              </div>
            )}

            {/* 6 — Team */}
            {step === 6 && (
              <div>
                <div className="ob-eyebrow">Step 06 — Your account</div>
                <h1 className="ob-h">Create your account.</h1>
                <p className="ob-sub">You'll be the manager — add the rest of your team after setup.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22, marginBottom: 12 }}>
                  <div><div className="ob-lbl">First name *</div><input className="ob-input" value={adminUser.first_name} onChange={e => setAdminUser(p => ({ ...p, first_name: e.target.value }))} placeholder="First" /></div>
                  <div><div className="ob-lbl">Last name *</div><input className="ob-input" value={adminUser.last_name} onChange={e => setAdminUser(p => ({ ...p, last_name: e.target.value }))} placeholder="Last" /></div>
                </div>
                <div style={{ marginBottom: 12 }}><div className="ob-lbl">Work email *</div><input className="ob-input" type="email" value={adminUser.email} onChange={e => setAdminUser(p => ({ ...p, email: e.target.value }))} placeholder="you@company.com" /></div>
                <div><div className="ob-lbl">Password *</div><input className="ob-input" type="password" value={adminUser.password} onChange={e => setAdminUser(p => ({ ...p, password: e.target.value }))} placeholder="Choose a strong password" /></div>
                <BackNext onBack={() => setStep(5)} nextLabel="Generate my platform →" nextWide
                  onNext={() => { if (!adminUser.first_name || !adminUser.last_name || !adminUser.email || !adminUser.password) return setError("All fields are required"); setError(null); runSetup(); }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
