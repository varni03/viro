import { useState, useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────────
   Viro — the generative-UI prototype, as the product front door.
   Five screens: Conversation → Generation → Meridian Vans →
   Tidewater Marine → Automations. Dark glass OS, Inter + JetBrains Mono.
   Color is reserved for meaning: red=critical, amber=watch,
   green=good, teal=Tidewater's brand. No purple.
──────────────────────────────────────────────────────────── */

const TEAL = "#2dd4bf";
const RED = "#ff5a5a";
const AMBER = "#f0a83c";
const GREEN = "#34d399";

const STYLE_ID = "viro-landing-styles";
function useLandingStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..900&family=JetBrains+Mono:wght@400;500;700&display=swap');
      .vl-root{font-family:'Inter',-apple-system,sans-serif;background:#08090a;color:#fff;
        -webkit-font-smoothing:antialiased;height:100vh;overflow-y:auto;overflow-x:hidden}
      .vl-mono{font-family:'JetBrains Mono',monospace}
      .vl-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
      .vl-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(20px);
        background:rgba(8,9,10,0.72);border-bottom:1px solid rgba(255,255,255,0.06)}
      .vl-tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}
      .vl-tabs::-webkit-scrollbar{display:none}
      .vl-tab{display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:9px;
        font-size:13px;cursor:pointer;white-space:nowrap;color:rgba(255,255,255,0.4);
        border:1px solid transparent;background:transparent;font-family:inherit;
        transition:all .18s cubic-bezier(.16,1,.3,1)}
      .vl-tab:hover{color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.04)}
      .vl-tab.active{color:#fff;background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.12)}
      .vl-tab .num{font-family:'JetBrains Mono',monospace;font-size:11px;opacity:0.55}
      .vl-btn{border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;
        letter-spacing:-0.01em;border:1px solid transparent;
        transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,background .18s ease,border-color .18s ease}
      .vl-btn-primary{background:#fff;color:#08090a;padding:9px 17px}
      .vl-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(255,255,255,0.16)}
      .vl-btn-ghost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.82);
        border-color:rgba(255,255,255,0.1);padding:9px 15px}
      .vl-btn-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.2)}
      .vl-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px}
      .vl-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.14em;
        text-transform:uppercase;color:rgba(255,255,255,0.38)}
      .vl-h1{font-size:clamp(34px,5vw,52px);line-height:1.04;font-weight:800;letter-spacing:-0.035em;margin:14px 0 0}
      .vl-sub{font-size:17px;line-height:1.6;color:rgba(255,255,255,0.55);max-width:600px;margin:14px 0 0}
      .vl-screen{animation:vl-screenin .5s cubic-bezier(.16,1,.3,1)}
      @keyframes vl-screenin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes vl-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes vl-blink{50%{opacity:0}}
      @keyframes vl-pulse{0%,100%{opacity:0.35;transform:scale(0.8)}50%{opacity:1;transform:scale(1.15)}}
      @keyframes vl-spin{to{transform:rotate(405deg)}}
      @keyframes vl-bar{from{width:0}}
      .vl-caret{display:inline-block;width:2px;height:1.05em;background:#fff;margin-left:1px;
        vertical-align:-2px;animation:vl-blink 1s steps(1) infinite}
      .vl-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:30px;
        background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
        font-size:11.5px;color:rgba(255,255,255,0.7)}
      .vl-app{display:grid;grid-template-columns:218px 1fr;border-radius:18px;overflow:hidden;
        border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.018)}
      .vl-side{padding:18px 14px;border-right:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.012)}
      .vl-side-item{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;
        font-size:13px;color:rgba(255,255,255,0.5);cursor:default;margin-bottom:2px}
      .vl-stage{flex:1;border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:15px;
        background:rgba(255,255,255,0.025);position:relative}
      .vl-stage.hot{border-color:rgba(255,90,90,0.45);background:rgba(255,90,90,0.06)}
      .vl-pill{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.04em;
        padding:3px 8px;border-radius:6px;white-space:nowrap}
      .vl-conv{display:grid;grid-template-columns:1.25fr 0.95fr;gap:18px;margin-top:30px}
      .vl-autos{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:30px}
      .vl-statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
      .vl-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0}
      @media(max-width:900px){
        .vl-conv{grid-template-columns:1fr}.vl-autos{grid-template-columns:1fr}
        .vl-statgrid{grid-template-columns:1fr 1fr}
        .vl-app{grid-template-columns:1fr}.vl-side{display:none}
        .vl-navlabel{display:none!important}
      }
    `;
    document.head.appendChild(el);
  }, []);
}

/* ── Data ─────────────────────────────────────────────────── */
const SCRIPT = [
  { role: "viro", text: "Hi — I'm Viro. In a sentence or two, what does your company do?" },
  { role: "you", text: "We're Meridian Vans. We upfit custom commercial vans — shelving, liftgates, electrical." },
  { role: "viro", text: "Got it. How does a vehicle move through the plant?" },
  { role: "you", text: "Four stations — Entry, the Upfit line, Quality Inspection, then Approved to Ship. Every van has a VIN." },
  { role: "viro", text: "And what do you need to know every morning?" },
  { role: "you", text: "What's blocking vehicles from shipping. First pass yield, and which station is throwing defects." },
  { role: "viro", text: "Last thing — what paperwork eats your team's time?" },
  { role: "you", text: "Invoices when a van ships, the weekly quality report, and chasing suppliers by email." },
  { role: "viro", text: "Perfect. I have what I need — building your platform now." },
];
const LEARN = [
  { k: "INDUSTRY", v: "Commercial van upfitting" },
  { k: "UNIVERSAL ID", v: "VIN" },
  { k: "WORKFLOW", v: "110 Entry → 310 Upfit Line → 510 QC → 710 Ship" },
  { k: "DECISIONS THAT MATTER", v: "First pass yield · station defect rates · blocked vehicles" },
  { k: "MANUAL WORK TO AUTOMATE", v: "Invoices · weekly quality reports · supplier emails" },
];
const GEN_STEPS = [
  "Reading your workflow — 4 stages, VIN-keyed",
  "Selecting metrics — first pass yield, station defect rates",
  "Composing dashboard layout — pipeline-first",
  "Wiring real-time alerts for critical defects",
  "Drafting role automations — finance, quality, procurement",
];

/* ── Small pieces ─────────────────────────────────────────── */
function Stat({ label, value, sub, subColor, valueColor, accent, delay = 0 }) {
  return (
    <div className="vl-card" style={{ padding: "16px 18px", animation: `vl-rise .5s cubic-bezier(.16,1,.3,1) ${delay}ms both` }}>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{label}</div>
      <div className="vl-mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: valueColor || (accent ? TEAL : "#fff"), lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: subColor || "rgba(255,255,255,0.42)", marginTop: 8 }}>{sub}</div>}
    </div>
  );
}
function SideItem({ icon, label, active, accent }) {
  return (
    <div className="vl-side-item" style={active ? {
      background: accent ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.1)",
      color: accent ? TEAL : "#fff", fontWeight: 600,
    } : {}}>
      <span style={{ width: 16, textAlign: "center", opacity: active ? 1 : 0.6 }}>{icon}</span>{label}
    </div>
  );
}

/* ── Screen 1: Conversation ───────────────────────────────── */
function Conversation({ onGenerate }) {
  const [shown, setShown] = useState(0);
  const scrollRef = useRef();

  useEffect(() => {
    setShown(0);
    const timers = [];
    for (let i = 1; i <= SCRIPT.length; i++) {
      timers.push(setTimeout(() => setShown(i), 500 + i * 1150));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shown]);

  const learnCount = Math.min(LEARN.length, Math.floor(shown / 2));
  const done = shown >= SCRIPT.length;

  return (
    <div className="vl-screen vl-wrap" style={{ padding: "54px 32px 64px" }}>
      <div className="vl-eyebrow">Step 01 — Onboarding</div>
      <h1 className="vl-h1">Tell Viro about your operation.</h1>
      <p className="vl-sub">No setup wizard. No configuration forms. A five-minute conversation — and Viro builds the platform around your answers.</p>

      <div className="vl-conv">
        {/* chat */}
        <div className="vl-card" style={{ display: "flex", flexDirection: "column", height: 470 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, marginRight: 10, boxShadow: `0 0 8px ${GREEN}` }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Viro Onboarding</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>Learning your operation</div>
            </div>
            <button className="vl-btn vl-btn-ghost" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 12 }}
              onClick={() => setShown(0)}>↻ Replay</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {SCRIPT.slice(0, shown).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "you" ? "flex-end" : "flex-start", animation: "vl-rise .35s ease both" }}>
                <div style={{
                  maxWidth: "82%", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.5,
                  borderRadius: m.role === "you" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                  background: m.role === "you" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(255,255,255,${m.role === "you" ? 0.14 : 0.07})`,
                  color: m.role === "you" ? "#fff" : "rgba(255,255,255,0.82)",
                }}>
                  {m.role === "viro" && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>VIRO</div>}
                  {m.text}
                </div>
              </div>
            ))}
            {!done && (
              <div style={{ display: "flex", gap: 4, padding: "4px 2px" }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `vl-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, padding: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Describe your operation in plain English…</div>
            <button className="vl-btn vl-btn-primary">Send</button>
          </div>
        </div>

        {/* what viro is learning */}
        <div className="vl-card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)" }}>WHAT VIRO IS LEARNING</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {LEARN.map((f, i) => {
              const on = i < learnCount;
              return (
                <div key={i} style={{ display: "flex", gap: 12, opacity: on ? 1 : 0.32, transition: "opacity .4s ease" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                    background: on ? GREEN : "transparent", color: "#08090a",
                    border: on ? "none" : "1px solid rgba(255,255,255,0.2)", transition: "all .4s ease" }}>{on ? "✓" : ""}</div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{f.k}</div>
                    <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{f.v}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="vl-btn vl-btn-primary" onClick={onGenerate}
            style={{ marginTop: 20, padding: "13px", width: "100%", fontSize: 14,
              opacity: done ? 1 : 0.55, boxShadow: done ? "0 0 0 1px rgba(255,255,255,0.1), 0 10px 30px rgba(255,255,255,0.12)" : "none" }}>
            Generate my platform →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 2: Generation ─────────────────────────────────── */
function Generation({ onDone }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
    const timers = [];
    for (let i = 1; i <= GEN_STEPS.length; i++) timers.push(setTimeout(() => setActive(i), i * 850));
    timers.push(setTimeout(onDone, GEN_STEPS.length * 850 + 900));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const pct = Math.min(100, (active / GEN_STEPS.length) * 100);

  return (
    <div className="vl-screen" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "78vh", padding: "40px 32px", textAlign: "center" }}>
      <div className="vl-orb" style={{ width: 520, height: 420, top: "20%", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 620 }}>
        <div style={{ width: 76, height: 76, margin: "0 auto 30px", borderRadius: 20, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color: "#08090a",
          transform: "rotate(45deg)", animation: "vl-spin 3.4s cubic-bezier(.6,0,.4,1) infinite" }}>
          <span style={{ transform: "rotate(-45deg)" }}>⬡</span>
        </div>
        <h1 style={{ fontSize: "clamp(30px,4.5vw,44px)", fontWeight: 800, letterSpacing: "-0.035em", margin: 0 }}>Building your platform</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
          Designing an operations system for <span className="vl-mono" style={{ color: "#fff", fontSize: 14 }}>Meridian Vans</span> — not a template.
        </p>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
          {GEN_STEPS.map((s, i) => {
            const state = i < active ? "done" : i === active ? "doing" : "todo";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 11,
                background: state === "doing" ? "rgba(255,255,255,0.07)" : "transparent",
                border: `1px solid ${state === "doing" ? "rgba(255,255,255,0.1)" : "transparent"}`,
                transition: "all .35s ease" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                  background: state === "done" ? GREEN : "transparent",
                  border: state === "done" ? "none" : "1px solid rgba(255,255,255,0.22)",
                  color: state === "done" ? "#08090a" : "rgba(255,255,255,0.6)" }}>
                  {state === "done" ? "✓" : state === "doing"
                    ? <span style={{ display: "inline-block", animation: "vl-spin 1s linear infinite" }}>◴</span>
                    : ""}
                </span>
                <span style={{ fontSize: 14.5, color: state === "todo" ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: state === "doing" ? 600 : 400 }}>{s}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 34, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#fff", borderRadius: 3, transition: "width .8s cubic-bezier(.16,1,.3,1)" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Screen 3: Meridian Vans ───────────────────────────────── */
function VanDash() {
  const stages = [
    { n: "110", name: "Entry — In The Door", c: 12, note: "2 aging > 24h", noteColor: AMBER },
    { n: "310", name: "Upfit Line", c: 15, note: "on pace", noteColor: "rgba(255,255,255,0.4)" },
    { n: "510", name: "Quality Inspection", c: 14, note: "● 3 blocked — critical", noteColor: RED, hot: true },
    { n: "710", name: "Approved to Ship", c: 9, note: "6 ship today", noteColor: GREEN },
  ];
  const bars = [
    { l: "710 · Approved to Ship", v: 61, hot: true },
    { l: "310 · Upfit Line", v: 47 },
    { l: "110 · Entry", v: 43 },
  ];
  const blocked = [
    { id: "MV-VIN-0038", tag: "LIFT FAIL" },
    { id: "MV-VIN-0029", tag: "ALIGNMENT" },
    { id: "MV-VIN-0007", tag: "PAINT" },
  ];
  const maxBar = Math.max(...bars.map(b => b.v));
  return (
    <div className="vl-screen vl-wrap" style={{ padding: "54px 32px 64px" }}>
      <div className="vl-eyebrow">Step 03 — Generated for a vehicle manufacturer</div>
      <h1 className="vl-h1">Meridian Vans's platform.</h1>
      <p className="vl-sub">Pipeline-first. VIN-keyed. Built around the question the manager asks every morning: <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>what's blocking vehicles from shipping?</span></p>

      <div className="vl-app" style={{ marginTop: 28 }}>
        <div className="vl-side">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 18px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>B</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Meridian Vans</div>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>GENERATED BY VIRO</div>
            </div>
          </div>
          {[["▦", "Production Overview", true], ["⌕", "Vehicle Search"], ["✎", "Log Defect"], ["⚒", "Upfit Line"], ["⟳", "Repair Queue"], ["▤", "Quality Analytics"], ["⚠", "Predictive Risk"], ["⚙", "Settings"]].map((it, i) => (
            <SideItem key={i} icon={it[0]} label={it[1]} active={it[2]} />
          ))}
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>Production Overview</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Plant 1 plant · Today, June 11</div>
            </div>
            <span className="vl-chip"><span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} /> LIVE · SNOWFLAKE</span>
          </div>

          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>VEHICLE PIPELINE · VIN FLOW</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {stages.map((s, i) => (
              <div key={i} className={"vl-stage" + (s.hot ? " hot" : "")}>
                <div className="vl-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>STAGE {s.n}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: "5px 0 9px" }}>{s.name}</div>
                <div className="vl-mono" style={{ fontSize: 26, fontWeight: 700 }}>{s.c}<span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}> vehicles</span></div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 8, color: s.noteColor }}>{s.note}</div>
              </div>
            ))}
          </div>

          <div className="vl-statgrid" style={{ marginBottom: 14 }}>
            <Stat label="First Pass Yield" value="71.4%" sub="↑ 3.2% vs last week" subColor={GREEN} delay={0} />
            <Stat label="Open Defects" value="189" sub="↑ 12 since Monday" subColor={AMBER} delay={60} />
            <Stat label="Critical Open" value="21" valueColor={RED} sub="3 blocking shipment" delay={120} />
            <Stat label="Avg Resolution" value="6.8h" sub="↓ 1.4h improving" subColor={GREEN} delay={180} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
            <div className="vl-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>DEFECTS BY STATION · THIS WEEK</div>
              {bars.map((b, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)" }}>{b.l}</span>
                    <span className="vl-mono" style={{ fontSize: 13, fontWeight: 700 }}>{b.v}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(b.v / maxBar) * 100}%`, borderRadius: 3,
                      background: b.hot ? `linear-gradient(90deg,${RED},${AMBER})` : "rgba(255,255,255,0.45)",
                      animation: "vl-bar 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="vl-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>BLOCKED AT QC · NEEDS ACTION</div>
              {blocked.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span className="vl-mono" style={{ fontSize: 13 }}>{b.id}</span>
                  <span className="vl-pill" style={{ color: RED, background: "rgba(255,90,90,0.12)", border: `1px solid ${RED}44` }}>{b.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 4: Tidewater Marine (teal) ─────────────────────────── */
function MarineDash() {
  const rfqs = [
    { id: "RFQ-2607", vessel: "MV Pacific Dawn", items: "Hydraulic seals ×40", due: "6h", dueColor: RED, status: "QUOTE NOW", sc: RED },
    { id: "RFQ-2606", vessel: "Orient Star Lines", items: "Nav lights ×12", due: "22h", dueColor: AMBER, status: "SOURCING", sc: AMBER },
    { id: "RFQ-2604", vessel: "MV Coral Trader", items: "Engine gaskets ×8", due: "2d", dueColor: "rgba(255,255,255,0.6)", status: "3 QUOTES IN", sc: "rgba(255,255,255,0.6)" },
    { id: "RFQ-2603", vessel: "Harbour Link HK", items: "Anchor chain 120m", due: "3d", dueColor: "rgba(255,255,255,0.6)", status: "DRAFTED", sc: GREEN },
    { id: "RFQ-2601", vessel: "MV Pacific Dawn", items: "Bilge pumps ×3", due: "4d", dueColor: "rgba(255,255,255,0.6)", status: "SENT", sc: GREEN },
  ];
  const suppliers = [
    { n: "Pacific Marine Supply", v: 96, c: TEAL },
    { n: "Harbourfront Hydraulics", v: 91, c: TEAL },
    { n: "Zhuhai Engine Parts", v: 84, c: "rgba(255,255,255,0.45)" },
    { n: "Oceanic Fittings Co", v: 71, c: AMBER },
    { n: "Delta Marine Trading", v: 58, c: RED },
  ];
  // win-rate sparkline going up
  const pts = [18, 30, 24, 40, 36, 52, 48, 64, 60, 78];
  const w = 300, h = 90;
  const max = Math.max(...pts), min = Math.min(...pts);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * w},${h - ((p - min) / (max - min)) * h}`).join(" ");

  return (
    <div className="vl-screen vl-wrap" style={{ padding: "54px 32px 64px" }}>
      <div className="vl-eyebrow">Step 04 — Generated for a marine procurement firm</div>
      <h1 className="vl-h1">MS&amp;C Marine's platform.</h1>
      <p className="vl-sub">No production line here. RFQ-first, supplier-centric — because MS&amp;C told Viro their day revolves around <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>quote turnaround and supplier reliability.</span></p>

      <div className="vl-app" style={{ marginTop: 28 }}>
        <div className="vl-side">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 18px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: TEAL, color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>M</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>MS&amp;C Marine</div>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>GENERATED BY VIRO</div>
            </div>
          </div>
          {[["⚓", "RFQ Desk", true], ["✉", "Quote Builder"], ["▤", "Suppliers"], ["▦", "Deliveries"], ["▤", "Procurement Analytics"], ["⚙", "Settings"]].map((it, i) => (
            <SideItem key={i} icon={it[0]} label={it[1]} active={it[2]} accent />
          ))}
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>RFQ Desk</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Hong Kong office · Today, June 11</div>
            </div>
            <span className="vl-chip"><span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} /> LIVE · EMAIL + ERP</span>
          </div>

          <div className="vl-statgrid" style={{ marginBottom: 14 }}>
            <Stat label="Avg RFQ Response" value="4.2h" accent sub="↓ 38% since Viro" subColor={TEAL} delay={0} />
            <Stat label="Open RFQs" value="17" sub="5 due within 24h" delay={60} />
            <Stat label="On-time Delivery" value="93.1%" sub="↑ 2.4% this quarter" subColor={GREEN} delay={120} />
            <div className="vl-card" style={{ padding: "16px 18px", animation: "vl-rise .5s cubic-bezier(.16,1,.3,1) 180ms both" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Quote Win Rate · 12 wks</div>
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 52 }} preserveAspectRatio="none">
                <path d={path} fill="none" stroke={TEAL} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
            <div className="vl-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>OPEN RFQS · BY DEADLINE</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1.3fr 1.4fr auto auto", gap: "0 12px", fontSize: 9.5, letterSpacing: "0.06em", color: "rgba(255,255,255,0.32)", paddingBottom: 8 }}>
                <span>RFQ</span><span>VESSEL</span><span>ITEMS</span><span>DUE</span><span>STATUS</span>
              </div>
              {rfqs.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1.3fr 1.4fr auto auto", gap: "0 12px", alignItems: "center", padding: "9px 0", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                  <span className="vl-mono" style={{ fontSize: 11 }}>{r.id}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vessel}</span>
                  <span style={{ color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.items}</span>
                  <span className="vl-mono" style={{ fontSize: 11, color: r.dueColor, fontWeight: 600 }}>{r.due}</span>
                  <span className="vl-pill" style={{ color: r.sc, background: r.sc === GREEN ? "rgba(52,211,153,0.12)" : r.sc === RED ? "rgba(255,90,90,0.12)" : r.sc === AMBER ? "rgba(240,168,60,0.12)" : "rgba(255,255,255,0.08)", border: `1px solid ${r.sc}33` }}>{r.status}</span>
                </div>
              ))}
            </div>
            <div className="vl-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>SUPPLIER RELIABILITY · 90 DAYS</div>
              {suppliers.map((s, i) => (
                <div key={i} style={{ marginBottom: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{s.n}</span>
                    <span className="vl-mono" style={{ fontSize: 12, fontWeight: 700, color: s.c === "rgba(255,255,255,0.45)" ? "#fff" : s.c }}>{s.v}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.v}%`, background: s.c, borderRadius: 3, animation: "vl-bar 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 5: Automations ────────────────────────────────── */
const AUTO_GROUPS = [
  { icon: "🧾", title: "Finance", meta: "Triggered by stage 710 · Approved to Ship", ready: 3, items: [
    { t: "Invoice · MV-VIN-0006 → Northgate Fleet Sales", d: "Generated from work order, options list & ship date", a: "Send" },
    { t: "Invoice · MV-VIN-0008 → Summit Commercial OH", d: "Generated 4 min ago", a: "Send" },
    { t: "Invoice · MV-VIN-0013 → Lone Star Fleet TX", d: "Generated 11 min ago", a: "Send" },
  ] },
  { icon: "📋", title: "Quality", meta: "the manager's Monday morning, pre-written", ready: 2, items: [
    { t: "Weekly Quality Report · Jun 5 – 11", d: "FPY 71.4% (↑3.2) · top issue: dents at 710 · 21 critical open", a: "Approve" },
    { t: "Quality certificates · 6 vehicles shipping today", d: "All inspection records attached automatically", a: "Approve" },
  ] },
  { icon: "📝", title: "Floor Operations", meta: "Shift handoff, written from the day's events", ready: 1, items: [
    { t: "Shift handover · Day → Evening", d: "14 defects logged · Upfit Line slowdown 1:40pm · 3 blocked at QC flagged", a: "Post" },
  ] },
  { icon: "📦", title: "Procurement", meta: "Drafted from recurring defect patterns", ready: 2, items: [
    { t: "Email · Apex Liftgate Co — defect pattern escalation", d: "5 lift malfunctions in 30 days, batch #AL-2241 referenced", a: "Send" },
    { t: "Email · paint supplier — finish quality query", d: "Paint defects up 40% week-over-week at stage 310", a: "Send" },
  ] },
];
function Automations({ onGetStarted }) {
  return (
    <div className="vl-screen vl-wrap" style={{ padding: "54px 32px 70px" }}>
      <div className="vl-eyebrow">Step 05 — One assistant per role</div>
      <h1 className="vl-h1">Every department's paperwork, already done.</h1>
      <p className="vl-sub">Viro holds the operational data — so the documents people write from it by hand can write themselves. Review, approve, send.</p>

      <div className="vl-autos">
        {AUTO_GROUPS.map((g, gi) => (
          <div key={gi} className="vl-card" style={{ padding: 20, animation: `vl-rise .5s cubic-bezier(.16,1,.3,1) ${gi * 80}ms both` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{g.title}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{g.meta}</div>
              </div>
              <span className="vl-pill" style={{ color: GREEN, background: "rgba(52,211,153,0.12)", border: `1px solid ${GREEN}33` }}>{g.ready} READY</span>
            </div>
            {g.items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{it.t}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{it.d}</div>
                </div>
                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  <button className="vl-btn vl-btn-ghost" style={{ padding: "7px 13px", fontSize: 12 }}>Review</button>
                  <button className="vl-btn vl-btn-primary" style={{ padding: "7px 14px", fontSize: 12 }}>{it.a}</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 30, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
        This week, Viro drafted <span style={{ color: "#fff", fontWeight: 700 }}>23 documents</span> — giving Meridian Vans back roughly <span style={{ color: "#fff", fontWeight: 700 }}>11 hours</span> of manual work.
      </div>

      <div className="vl-card" style={{ marginTop: 34, padding: "44px 28px", textAlign: "center", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>
        <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Run your operation on Viro.</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 440, margin: "14px auto 24px" }}>Describe how your company works. Have a platform built around it before your coffee's cold.</p>
        <button className="vl-btn vl-btn-primary" style={{ padding: "14px 28px", fontSize: 15 }} onClick={onGetStarted}>Build your platform →</button>
      </div>
    </div>
  );
}

/* ── Shell ────────────────────────────────────────────────── */
const TABS = ["Conversation", "Generation", "Meridian Vans", "Tidewater Marine", "Automations"];

export default function Landing({ onSignIn, onGetStarted }) {
  useLandingStyles();
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setScreen(s => Math.min(TABS.length - 1, s + 1));
      if (e.key === "ArrowLeft") setScreen(s => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="vl-root">
      {/* NAV */}
      <div className="vl-nav">
        <div className="vl-wrap" style={{ display: "flex", alignItems: "center", height: 62, gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>⬡</div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</span>
          </div>
          <div className="vl-tabs">
            {TABS.map((t, i) => (
              <button key={i} className={"vl-tab" + (i === screen ? " active" : "")} onClick={() => setScreen(i)}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>{t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 9, marginLeft: "auto", flexShrink: 0 }}>
            <button className="vl-btn vl-btn-ghost" onClick={onSignIn}>Sign in</button>
            <button className="vl-btn vl-btn-primary" onClick={onGetStarted}>Get started</button>
          </div>
        </div>
      </div>

      {/* SCREEN */}
      <div key={screen}>
        {screen === 0 && <Conversation onGenerate={() => setScreen(1)} />}
        {screen === 1 && <Generation onDone={() => setScreen(s => (s === 1 ? 2 : s))} />}
        {screen === 2 && <VanDash />}
        {screen === 3 && <MarineDash />}
        {screen === 4 && <Automations onGetStarted={onGetStarted} />}
      </div>
    </div>
  );
}
