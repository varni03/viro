import { useState, useEffect, useRef } from "react";

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
      @keyframes ob-pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
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
      .ob-conv{display:grid;grid-template-columns:1.22fr 0.92fr;gap:18px;margin-top:26px}
      .ob-bubble{max-width:84%;padding:11px 15px;font-size:13.5px;line-height:1.5;animation:ob-rise .35s ease both}
      .ob-send{background:#fff;color:#08090a;border:none;border-radius:11px;padding:0 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s ease}
      .ob-send:disabled{opacity:0.4;cursor:not-allowed}
      @media(max-width:860px){.ob-conv{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }, []);
}

export default function Onboarding({ onComplete }) {
  useOnboardingStyles();
  const [phase, setPhase] = useState("form"); // form | generating | done
  const [genActive, setGenActive] = useState(0);
  const [error, setError] = useState(null);

  const [company, setCompany] = useState({ name: "", industry: "", universal_id_field: "" });
  const [stages, setStages] = useState([]);
  const [defectTypes, setDefectTypes] = useState([]);
  const [terminology, setTerminology] = useState({ term_product: "Product", term_defect: "Defect", term_stage: "Stage", term_issue: "Issue" });
  const [adminUser, setAdminUser] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [enabledModules, setEnabledModules] = useState([]);
  const [createdCompany, setCreatedCompany] = useState(null);
  const [decisions, setDecisions] = useState("");
  const [automate, setAutomate] = useState("");

  // conversation
  const [messages, setMessages] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const answers = useRef({});
  const mounted = useRef(true);
  const convStarted = useRef(false);
  const scrollRef = useRef();

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

  const matchTemplate = (text) => {
    const t = text.toLowerCase();
    if (/(vehicle|van|car|auto|truck|wav|motor)/.test(t)) return "automotive";
    if (/(marine|ship|vessel|boat|rfq|procure|maritime|port)/.test(t)) return "marine";
    if (/(food|beverage|produce|kitchen|meal|drink|brew)/.test(t)) return "food";
    if (/(medical|device|pharma|health|surgical|implant|clinic)/.test(t)) return "medical";
    if (/(logistic|warehouse|freight|shipping|delivery|fulfil|courier)/.test(t)) return "logistics";
    return "custom";
  };

  const QMETA = [
    { ph: "e.g. Meridian Vans", req: true },
    { ph: "e.g. We build custom commercial vans", req: true },
    { ph: "e.g. Vehicle, VIN", req: false },
    { ph: "e.g. Entry, Assembly, QC, Ship", req: false },
    { ph: "e.g. what's blocking shipping today", req: false },
    { ph: "e.g. invoices, weekly reports, supplier emails", req: false },
    { ph: "Your full name", req: true },
    { ph: "you@company.com", req: true },
    { ph: "Choose a password", req: true, type: "password" },
  ];

  const getPrompt = (i) => {
    const a = answers.current;
    switch (i) {
      case 0: return "Hey — I'm Viro. Let's build your platform. First: what's your company called?";
      case 1: return `Nice to meet you${a.name ? `, ${a.name.split(" ")[0]}` : ""}. In a sentence — what does ${a.name || "your company"} do?`;
      case 2: return "What do you track through your process, and what do you call each one? (e.g. Vehicle, RFQ, Batch)";
      case 3: return a.templateStages && a.templateStages.length
        ? `Based on that, I've drafted a workflow: ${a.workflow}. Type your own stages to change it, or say "looks good".`
        : `What stages does each ${(a.term || "item").toLowerCase()} move through, in order? Separate them with commas.`;
      case 4: return "What do you need to know every morning?";
      case 5: return "Last operational question — what paperwork should Viro draft for you?";
      case 6: return "Almost there. What's your name?";
      case 7: return "Your work email?";
      case 8: return "And a password to secure your account.";
      default: return "";
    }
  };

  const apply = (i, v) => {
    const a = answers.current;
    if (i === 0) { a.name = v; setCompany(c => ({ ...c, name: v })); }
    else if (i === 1) {
      a.industry = v; setCompany(c => ({ ...c, industry: v }));
      const t = INDUSTRY_TEMPLATES[matchTemplate(v)];
      a.term = t.term_product; a.templateStages = t.stages.map(s => s.stage_name); a.workflow = a.templateStages.join(" → ");
      setStages([...t.stages]); setDefectTypes([...t.defect_types]); setEnabledModules(t.modules);
      setTerminology({ term_product: t.term_product, term_defect: t.term_defect, term_stage: t.term_stage, term_issue: t.term_issue });
    }
    else if (i === 2) { if (v) { a.term = v; setTerminology(tm => ({ ...tm, term_product: v })); setCompany(c => ({ ...c, universal_id_field: v })); } }
    else if (i === 3) {
      if (v && !/^(looks good|use those|keep|skip|no|that works|good|fine|yes)/i.test(v)) {
        const parsed = v.split(/[,/]|→|->/).map(x => x.trim()).filter(Boolean);
        if (parsed.length) { a.workflow = parsed.join(" → "); setStages(parsed.map((nm, idx) => ({ stage_number: (idx + 1) * 100, stage_name: nm, expected_duration_mins: 30 }))); }
      }
    }
    else if (i === 4) { setDecisions(v); }
    else if (i === 5) { setAutomate(v); }
    else if (i === 6) { const parts = v.split(/\s+/); setAdminUser(u => ({ ...u, first_name: parts[0] || v, last_name: parts.slice(1).join(" ") })); }
    else if (i === 7) { setAdminUser(u => ({ ...u, email: v })); }
    else if (i === 8) { setAdminUser(u => ({ ...u, password: v })); }
  };

  const pushViro = (text, delay = 800) => {
    setTyping(true);
    setTimeout(() => { if (!mounted.current) return; setTyping(false); setMessages(m => [...m, { role: "viro", text }]); }, delay);
  };

  const startConversation = () => {
    answers.current = {};
    setMessages([]); setQIndex(0); setInput(""); setReady(false); setError(null);
    setCompany({ name: "", industry: "", universal_id_field: "" });
    setStages([]); setDefectTypes([]); setEnabledModules([]); setDecisions(""); setAutomate("");
    setTerminology({ term_product: "Product", term_defect: "Defect", term_stage: "Stage", term_issue: "Issue" });
    setAdminUser({ first_name: "", last_name: "", email: "", password: "" });
    pushViro(getPrompt(0), 500);
  };

  useEffect(() => {
    mounted.current = true;
    if (!convStarted.current) { convStarted.current = true; startConversation(); }
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typing]);

  const handleSend = () => {
    if (typing || qIndex >= QMETA.length) return;
    const v = input.trim();
    const meta = QMETA[qIndex];
    if (meta.req && !v) { pushViro("I'll need that to keep going — mind sharing it?", 350); return; }
    const display = meta.type === "password" ? "•".repeat(Math.max(v.length, 6)) : v;
    setMessages(m => [...m, { role: "you", text: display }]);
    setInput("");
    apply(qIndex, v);
    const next = qIndex + 1;
    setQIndex(next);
    if (next < QMETA.length) pushViro(getPrompt(next), 850);
    else { pushViro("Perfect — I've got everything I need. Hit Generate my platform and watch it build. ✦", 850); setTimeout(() => mounted.current && setReady(true), 1000); }
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

  const learn = [
    { k: "INDUSTRY", v: company.industry, on: !!company.industry },
    { k: "UNIVERSAL ID", v: terminology.term_product !== "Product" ? terminology.term_product : "", on: terminology.term_product !== "Product" },
    { k: "WORKFLOW", v: stages.map(s => s.stage_name).join("  →  "), on: stages.length > 0 },
    { k: "DECISIONS THAT MATTER", v: decisions, on: !!decisions },
    { k: "MANUAL WORK TO AUTOMATE", v: automate, on: !!automate },
  ];
  const inputType = QMETA[qIndex]?.type || "text";
  const asking = qIndex < QMETA.length;

  return (
    <div className="ob-root" style={{ minHeight: "100vh", height: "100vh", overflowY: "auto", display: "flex", alignItems: phase === "form" ? "flex-start" : "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div className="ob-grid" />
      <div style={{ position: "fixed", width: 520, height: 420, top: "26%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.045)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: phase === "form" ? 1080 : 660, position: "relative", zIndex: 1, padding: "36px 0 56px" }}>
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 30 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 100 100"><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</span>
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

        {/* ── CONVERSATION ── */}
        {phase === "form" && (
          <div className="ob-step">
            <div className="ob-eyebrow">Step 01 — Onboarding</div>
            <h1 className="ob-h" style={{ fontSize: "clamp(32px,4.6vw,52px)" }}>Tell Viro about your operation.</h1>
            <p className="ob-sub">No setup wizard. No configuration forms. A short conversation — and Viro builds the platform around your answers.</p>

            <div className="ob-conv">
              {/* chat */}
              <div className="ob-card" style={{ display: "flex", flexDirection: "column", height: 500 }}>
                <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, marginRight: 10, boxShadow: `0 0 8px ${GREEN}` }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Viro Onboarding</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>Learning your operation</div>
                  </div>
                  <button className="ob-btn ob-btn-ghost" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 12 }} onClick={startConversation}>↻ Restart</button>
                </div>
                <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "you" ? "flex-end" : "flex-start" }}>
                      <div className="ob-bubble" style={{
                        borderRadius: m.role === "you" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                        background: m.role === "you" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid rgba(255,255,255,${m.role === "you" ? 0.14 : 0.07})`,
                        color: m.role === "you" ? "#fff" : "rgba(255,255,255,0.85)" }}>
                        {m.role === "viro" && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>VIRO</div>}
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div style={{ display: "flex", gap: 4, padding: "6px 2px" }}>
                      {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `ob-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, padding: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <input className="ob-input" type={inputType} value={input} disabled={!asking || typing}
                    placeholder={asking ? (QMETA[qIndex]?.ph || "Type your answer…") : "All set — generate your platform →"}
                    onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
                    style={{ flex: 1, opacity: asking ? 1 : 0.5 }} />
                  <button className="ob-send" disabled={!asking || typing} onClick={handleSend}>Send</button>
                </div>
              </div>

              {/* what viro is learning */}
              <div className="ob-card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)" }}>WHAT VIRO IS LEARNING</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 15, flex: 1 }}>
                  {learn.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, opacity: f.on ? 1 : 0.32, transition: "opacity .4s ease" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                        background: f.on ? GREEN : "transparent", color: "#08090a", border: f.on ? "none" : "1px solid rgba(255,255,255,0.2)", transition: "all .4s ease" }}>{f.on ? "✓" : ""}</div>
                      <div>
                        <div className="ob-mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{f.k}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>{f.on ? f.v : "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="ob-btn ob-btn-primary" disabled={!ready} onClick={runSetup}
                  style={{ marginTop: 20, padding: "13px", width: "100%", opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed",
                    boxShadow: ready ? "0 12px 30px rgba(255,255,255,0.14)" : "none" }}>
                  Generate my platform →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
