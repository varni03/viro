import { useState, useEffect, useRef } from "react";

const API = "https://web-production-0457e.up.railway.app";
const GREEN = "#34d399";

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "log_issue", label: "Log Issue", icon: "📸" },
  { id: "workflow", label: "Workflow Tracker", icon: "🔧" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "predictive", label: "Predictive Risk", icon: "⚠️" },
  { id: "repair", label: "Repair Queue", icon: "🔨" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const GREETING = "Hey — I'm Viro. Tell me what your company does and how it runs, in your own words. Don't worry about being precise — I'll figure it out.";

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
        mask-image:radial-gradient(ellipse 64% 56% at 50% 32%,#000,transparent 78%);
        -webkit-mask-image:radial-gradient(ellipse 64% 56% at 50% 32%,#000,transparent 78%)}
      .ob-step{animation:ob-in .5s cubic-bezier(.16,1,.3,1)}
      @keyframes ob-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      @keyframes ob-spin{to{transform:rotate(405deg)}}
      @keyframes ob-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @keyframes ob-pulse{0%,100%{opacity:0.35;transform:scale(0.8)}50%{opacity:1;transform:scale(1.15)}}
      .ob-eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.4)}
      .ob-h{font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-0.035em;line-height:1.04;margin:12px 0 0}
      .ob-sub{font-size:15px;line-height:1.55;color:rgba(255,255,255,0.5);margin:11px 0 0;max-width:560px}
      .ob-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px}
      .ob-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:11px;
        padding:12px 15px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;
        transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}
      .ob-input::placeholder{color:rgba(255,255,255,0.28)}
      .ob-input:focus{border-color:rgba(255,255,255,0.28);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(255,255,255,0.05)}
      .ob-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:7px}
      .ob-btn{border:none;border-radius:12px;font-size:14px;font-weight:700;font-family:inherit;letter-spacing:-0.01em;cursor:pointer;
        transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,background .18s ease,opacity .18s ease}
      .ob-btn-primary{background:#fff;color:#08090a;padding:13px 22px}
      .ob-btn-primary:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(255,255,255,0.16)}
      .ob-chip{padding:7px 13px;border-radius:30px;font-size:12.5px;cursor:pointer;font-family:inherit;color:rgba(255,255,255,0.8);
        background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);transition:all .15s ease;white-space:nowrap}
      .ob-chip:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.25);color:#fff}
      .ob-conv{display:grid;grid-template-columns:1.25fr 0.95fr;gap:18px;margin-top:30px}
      @media(max-width:880px){.ob-conv{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }, []);
}

const LEARN_FIELDS = [
  { k: "INDUSTRY", get: s => s.industry },
  { k: "UNIVERSAL ID", get: s => s.universal_id },
  { k: "WHAT YOU TRACK", get: s => (s.entities && s.entities.length ? s.entities.map(e => e.name_plural || e.name).join(" · ") : "") },
  { k: "WORKFLOW", get: s => (s.stages && s.stages.length ? s.stages.map(x => x.stage_name).join("  →  ") : "") },
  { k: "DECISIONS THAT MATTER", get: s => (s.decisions && s.decisions.length ? s.decisions.join(" · ") : "") },
  { k: "MANUAL WORK TO AUTOMATE", get: s => (s.automations && s.automations.length ? s.automations.join(" · ") : "") },
];

export default function Onboarding({ onComplete }) {
  useOnboardingStyles();
  const [phase, setPhase] = useState("chat"); // chat | generating | done
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [options, setOptions] = useState([]);
  const [learn, setLearn] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [genActive, setGenActive] = useState(0);
  const [account, setAccount] = useState({ company_name: "", first_name: "", last_name: "", email: "", password: "" });
  const [createdId, setCreatedId] = useState(null);
  const chatRef = useRef();

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, sending]);
  useEffect(() => { if (ready && learn.company_name && !account.company_name) setAccount(a => ({ ...a, company_name: learn.company_name })); }, [ready, learn.company_name]); // eslint-disable-line

  const genSteps = [
    `Creating ${account.company_name || learn.company_name || "your company"}`,
    `Configuring ${(learn.stages || []).length} workflow stages`,
    `Setting up ${(learn.defect_types || []).length} issue types`,
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
    // eslint-disable-next-line
  }, [phase]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput(""); setOptions([]); setError(null);
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setSending(true);
    try {
      const res = await fetch(`${API}/onboarding/converse`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, state: learn }),
      }).then(r => r.json());
      setMessages(m => [...m, { role: "assistant", content: res.reply || "Got it." }]);
      if (res.state) setLearn(res.state);
      setOptions(Array.isArray(res.options) ? res.options : []);
      if (res.ready) setReady(true);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "I couldn't reach my brain just now — try again in a moment." }]);
    }
    setSending(false);
  };

  const runSetup = async () => {
    setError(null);
    setPhase("generating");
    const started = Date.now();
    const term = learn.terminology || { term_product: "Item", term_defect: "Issue", term_stage: "Stage", term_issue: "Problem" };
    let stages = (learn.stages || []).map((s, i) => ({
      stage_number: s.stage_number || (i + 1) * 100, stage_name: s.stage_name, expected_duration_mins: 30,
    }));
    if (!stages.length) stages = [{ stage_number: 100, stage_name: "Received", expected_duration_mins: 30 }, { stage_number: 200, stage_name: "In Progress", expected_duration_mins: 60 }, { stage_number: 300, stage_name: "Complete", expected_duration_mins: 15 }];
    const defectTypes = learn.defect_types || [];
    let modules = learn.modules && learn.modules.length ? learn.modules : ["dashboard", "search", "log_issue", "settings"];
    modules = Array.from(new Set([...modules, "dashboard", "search", "log_issue", "settings"]));

    let userRes, companyRes;
    try {
      companyRes = await fetch(`${API}/onboarding/company`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: account.company_name || learn.company_name || "My Company",
          industry: learn.industry || "Operations",
          universal_id_field: learn.universal_id || term.term_product.toLowerCase().replace(/\s+/g, "_") })
      }).then(r => r.json());
      const companyId = companyRes.company_id;
      for (const s of stages) await fetch(`${API}/settings/stages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, company_id: companyId }) });
      for (const dt of defectTypes) await fetch(`${API}/settings/defect-types`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dt, company_id: companyId }) });
      await fetch(`${API}/config/${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(term) });
      if (Array.isArray(learn.entities) && learn.entities.length) {
        await fetch(`${API}/entities/${companyId}/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entities: learn.entities }) });
      }
      userRes = await fetch(`${API}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: account.first_name, last_name: account.last_name, email: account.email, password: account.password, role: "manager", company_id: companyId })
      }).then(r => r.json());
      const moduleData = ALL_MODULES.map(m => ({ id: m.id, enabled: modules.includes(m.id), custom_label: m.label, custom_icon: m.icon }));
      await fetch(`${API}/modules/${companyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modules: moduleData }) });
      setCreatedId(companyId);
    } catch {
      setError("Something went wrong creating your platform. Please try again.");
      setPhase("chat");
      return;
    }
    const minMs = genSteps.length * 820 + 700;
    setTimeout(() => {
      setPhase("done");
      if (userRes && userRes.token) setTimeout(() => {
        localStorage.setItem("viro_token", userRes.token);
        localStorage.setItem("viro_user", JSON.stringify(userRes.user));
        localStorage.setItem("viro_company_id", companyRes.company_id);
        if (onComplete) onComplete(userRes.user, userRes.token);
      }, 2800);
    }, Math.max(0, minMs - (Date.now() - started)));
  };

  const accountReady = account.company_name && account.first_name && account.last_name && account.email && account.password;

  return (
    <div className="ob-root" style={{ minHeight: "100vh", height: "100vh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div className="ob-grid" />
      <div style={{ position: "fixed", width: 520, height: 420, top: "24%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.045)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 1040, position: "relative", zIndex: 1, padding: "36px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 100 100"><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</span>
        </div>

        {error && <div style={{ marginBottom: 16, padding: "12px 15px", background: "rgba(255,90,90,0.12)", border: "1px solid rgba(255,90,90,0.3)", borderRadius: 12, color: "#ff5a5a", fontSize: 13 }}>{error}</div>}

        {/* ── CHAT ── */}
        {phase === "chat" && (
          <div className="ob-step">
            <div className="ob-eyebrow">Step 01 — Onboarding</div>
            <h1 className="ob-h">Tell Viro about your operation.</h1>
            <p className="ob-sub">No setup wizard, no forms. Just talk — in plain English, typos and all. Viro understands, asks what it needs, and builds the platform around your answers.</p>

            <div className="ob-conv">
              {/* chat */}
              <div className="ob-card" style={{ display: "flex", flexDirection: "column", height: 472 }}>
                <div style={{ display: "flex", alignItems: "center", padding: "15px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, marginRight: 10, boxShadow: `0 0 8px ${GREEN}` }} />
                  <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>Viro Onboarding</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Learning your operation</div></div>
                </div>
                <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "ob-rise .3s ease both" }}>
                      <div style={{ maxWidth: "84%", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.5,
                        borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                        background: m.role === "user" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid rgba(255,255,255,${m.role === "user" ? 0.14 : 0.07})`,
                        color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.84)" }}>
                        {m.role === "assistant" && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>VIRO</div>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {sending && <div style={{ display: "flex", gap: 4, padding: "4px 2px" }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `ob-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}</div>}
                </div>
                {options.length > 0 && (
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: "10px 14px 0" }}>
                    {options.map((o, i) => <button key={i} className="ob-chip" onClick={() => send(o)}>{o}</button>)}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, padding: 13 }}>
                  <input className="ob-input" value={input} placeholder="Describe your operation in plain English…"
                    onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
                  <button className="ob-btn ob-btn-primary" onClick={() => send()} disabled={sending || !input.trim()} style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}>Send</button>
                </div>
              </div>

              {/* what Viro is learning */}
              <div className="ob-card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)" }}>WHAT VIRO IS LEARNING</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 15, flex: 1 }}>
                  {LEARN_FIELDS.map((f, i) => {
                    const val = f.get(learn);
                    const on = !!val;
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, opacity: on ? 1 : 0.34, transition: "opacity .4s ease" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                          background: on ? GREEN : "transparent", color: "#08090a", border: on ? "none" : "1px solid rgba(255,255,255,0.2)", transition: "all .4s ease" }}>{on ? "✓" : ""}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{f.k}</div>
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{val || "—"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!ready && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 16, lineHeight: 1.5 }}>Keep chatting — once Viro has enough, you'll generate your platform here.</div>}

                {ready && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", animation: "ob-rise .4s ease both" }}>
                    <div className="ob-eyebrow" style={{ marginBottom: 12 }}>Create your account</div>
                    <input className="ob-input" style={{ marginBottom: 8 }} placeholder="Company name" value={account.company_name} onChange={e => setAccount(a => ({ ...a, company_name: e.target.value }))} />
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input className="ob-input" placeholder="First name" value={account.first_name} onChange={e => setAccount(a => ({ ...a, first_name: e.target.value }))} />
                      <input className="ob-input" placeholder="Last name" value={account.last_name} onChange={e => setAccount(a => ({ ...a, last_name: e.target.value }))} />
                    </div>
                    <input className="ob-input" style={{ marginBottom: 8 }} type="email" placeholder="Work email" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />
                    <input className="ob-input" style={{ marginBottom: 14 }} type="password" placeholder="Password" value={account.password} onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} />
                    <button className="ob-btn ob-btn-primary" style={{ width: "100%", opacity: accountReady ? 1 : 0.5 }} disabled={!accountReady} onClick={runSetup}>Generate my platform →</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── GENERATING ── */}
        {phase === "generating" && (
          <div className="ob-step" style={{ textAlign: "center", paddingTop: 20 }}>
            <div style={{ width: 70, height: 70, margin: "0 auto 26px", borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", animation: "ob-spin 3.4s cubic-bezier(.6,0,.4,1) infinite" }}>
              <svg width="31" height="31" viewBox="0 0 100 100" style={{ transform: "rotate(-45deg)" }}><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
            </div>
            <h1 className="ob-h">Building your platform</h1>
            <p className="ob-sub" style={{ margin: "10px auto 0" }}>Designing an operations system for <span className="ob-mono" style={{ color: "#fff", fontSize: 13.5 }}>{account.company_name || "your company"}</span> — not a template.</p>
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 5, textAlign: "left", maxWidth: 460, margin: "32px auto 0" }}>
              {genSteps.map((s, i) => {
                const state = i < genActive ? "done" : i === genActive ? "doing" : "todo";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 15px", borderRadius: 11, background: state === "doing" ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${state === "doing" ? "rgba(255,255,255,0.1)" : "transparent"}`, transition: "all .35s ease" }}>
                    <span style={{ width: 21, height: 21, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: state === "done" ? GREEN : "transparent", border: state === "done" ? "none" : "1px solid rgba(255,255,255,0.22)", color: state === "done" ? "#08090a" : "rgba(255,255,255,0.6)" }}>
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
          <div className="ob-step" style={{ textAlign: "center", paddingTop: 10 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
            <h1 className="ob-h">{account.company_name} is live on Viro.</h1>
            <p className="ob-sub" style={{ margin: "10px auto 0" }}>Your platform is ready. Taking you to your dashboard…</p>
            <div className="ob-card" style={{ padding: 22, marginTop: 26, textAlign: "left", maxWidth: 460, margin: "26px auto 0" }}>
              <div className="ob-eyebrow" style={{ marginBottom: 14 }}>Your setup</div>
              {[
                ["Company", account.company_name],
                ["Industry", learn.industry || "—"],
                ["Tracks", learn.universal_id || "—"],
                ["Workflow", `${(learn.stages || []).length} stages`],
                ["Issue types", `${(learn.defect_types || []).length} configured`],
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{row[0]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row[1]}</span>
                </div>
              ))}
            </div>
            <div className="ob-mono" style={{ marginTop: 18, fontSize: 12, color: GREEN }}>● redirecting to {createdId || "your platform"}…</div>
          </div>
        )}
      </div>
    </div>
  );
}
