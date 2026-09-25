import { useState, useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────────
   Viro landing page. A marketing scroll with the live 5-screen
   generative-UI prototype embedded as the centerpiece:
   Conversation → Generation → Meridian Vans → Tidewater → Automations.
   Dark glass OS, Inter + JetBrains Mono. Color = meaning only
   (red critical, amber watch, green good, teal = Tidewater). No purple.
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
        -webkit-font-smoothing:antialiased;height:100vh;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth}
      .vl-mono{font-family:'JetBrains Mono',monospace}
      .vl-wrap{max-width:1200px;margin:0 auto;padding:0 32px}
      .vl-nav{position:sticky;top:0;z-index:60;backdrop-filter:blur(20px);
        background:rgba(8,9,10,0.72);border-bottom:1px solid rgba(255,255,255,0.06)}
      .vl-navlinks{display:flex;gap:26px;margin:0 auto}
      .vl-link{color:rgba(255,255,255,0.55);text-decoration:none;font-size:14px;transition:color .15s ease}
      .vl-link:hover{color:#fff}
      .vl-btn{border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;
        letter-spacing:-0.01em;border:1px solid transparent;
        transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,background .18s ease,border-color .18s ease}
      .vl-btn-primary{background:#fff;color:#08090a;padding:9px 17px}
      .vl-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(255,255,255,0.16)}
      .vl-btn-ghost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.82);
        border-color:rgba(255,255,255,0.1);padding:9px 15px}
      .vl-btn-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.2)}
      .vl-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px}
      .vl-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 13px;border-radius:30px;
        background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
        font-size:12px;color:rgba(255,255,255,0.72)}
      .vl-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.14em;
        text-transform:uppercase;color:rgba(255,255,255,0.38)}
      .vl-hero-h1{font-size:clamp(42px,6.6vw,82px);line-height:1.0;font-weight:800;letter-spacing:-0.04em;margin:0;
        background:linear-gradient(180deg,#fff 32%,rgba(255,255,255,0.6));-webkit-background-clip:text;
        background-clip:text;-webkit-text-fill-color:transparent}
      .vl-h2{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-0.03em;margin:0}
      .vl-h1{font-size:clamp(28px,3.6vw,42px);line-height:1.05;font-weight:800;letter-spacing:-0.035em;margin:12px 0 0}
      .vl-sub{font-size:16px;line-height:1.6;color:rgba(255,255,255,0.55);max-width:600px;margin:13px 0 0}
      .vl-section-label{font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.4)}
      .vl-grid-bg{position:absolute;inset:0;z-index:0;pointer-events:none;
        background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:54px 54px;
        mask-image:radial-gradient(ellipse 75% 65% at 50% 25%,#000,transparent 78%);
        -webkit-mask-image:radial-gradient(ellipse 75% 65% at 50% 25%,#000,transparent 78%)}
      .vl-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0}
      .vl-hero{display:grid;grid-template-columns:1.05fr 0.95fr;gap:46px;align-items:center}
      .vl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
      .vl-proof{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      /* prototype */
      .vl-frame{border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;
        background:rgba(255,255,255,0.015);box-shadow:0 40px 100px rgba(0,0,0,0.55)}
      .vl-frame-bar{display:flex;align-items:center;gap:14px;padding:12px 16px;
        border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.025)}
      .vl-tabs{display:flex;gap:3px;overflow-x:auto;scrollbar-width:none}
      .vl-tabs::-webkit-scrollbar{display:none}
      .vl-tab{display:flex;align-items:center;gap:7px;padding:6px 11px;border-radius:8px;font-size:12.5px;
        cursor:pointer;white-space:nowrap;color:rgba(255,255,255,0.42);border:1px solid transparent;
        background:transparent;font-family:inherit;transition:all .18s cubic-bezier(.16,1,.3,1)}
      .vl-tab:hover{color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.04)}
      .vl-tab.active{color:#fff;background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.12)}
      .vl-tab .num{font-family:'JetBrains Mono',monospace;font-size:10.5px;opacity:0.55}
      .vl-screen{animation:vl-screenin .5s cubic-bezier(.16,1,.3,1)}
      .vl-app{display:grid;grid-template-columns:210px 1fr;border-radius:16px;overflow:hidden;
        border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.018)}
      .vl-side{padding:16px 12px;border-right:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.012)}
      .vl-side-item{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;
        font-size:12.5px;color:rgba(255,255,255,0.5);margin-bottom:2px}
      .vl-stage{flex:1;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;
        background:rgba(255,255,255,0.025);position:relative}
      .vl-stage.hot{border-color:rgba(255,90,90,0.45);background:rgba(255,90,90,0.06)}
      .vl-pill{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.04em;
        padding:3px 8px;border-radius:6px;white-space:nowrap}
      .vl-conv{display:grid;grid-template-columns:1.25fr 0.95fr;gap:16px;margin-top:22px}
      .vl-autos{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
      .vl-statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      @keyframes vl-screenin{from{opacity:0}to{opacity:1}}
      @keyframes vl-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes vl-blink{50%{opacity:0}}
      @keyframes vl-pulse{0%,100%{opacity:0.35;transform:scale(0.8)}50%{opacity:1;transform:scale(1.15)}}
      @keyframes vl-spin{to{transform:rotate(405deg)}}
      @keyframes vl-bar{from{width:0}}
      @keyframes vl-float{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}}
      @keyframes vl-progress{from{width:0}to{width:100%}}
      .vl-stage{transition:transform .2s cubic-bezier(.16,1,.3,1),border-color .2s ease,background .2s ease}
      .vl-stage:hover{transform:translateY(-2px);border-color:rgba(255,255,255,0.18)}
      .vl-stage.hot:hover{border-color:rgba(255,90,90,0.6)}
      .vl-hover{transition:transform .2s cubic-bezier(.16,1,.3,1),border-color .2s ease,background .2s ease}
      .vl-hover:hover{transform:translateY(-3px);border-color:rgba(255,255,255,0.16);background:rgba(255,255,255,0.06)}
      .vl-rfqrow{transition:background .15s ease}
      .vl-rfqrow:hover{background:rgba(255,255,255,0.035)}
      .vl-scrollbar{position:fixed;top:0;left:0;height:2px;background:#fff;z-index:70;transition:width .08s linear}
      .vl-playbtn{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:8px;font-size:12px;
        cursor:pointer;font-family:inherit;color:rgba(255,255,255,0.72);background:rgba(255,255,255,0.06);
        border:1px solid rgba(255,255,255,0.1);transition:all .15s ease;white-space:nowrap}
      .vl-playbtn:hover{color:#fff;background:rgba(255,255,255,0.1)}
      @media(max-width:900px){
        .vl-hero{grid-template-columns:1fr;gap:30px}.vl-steps{grid-template-columns:1fr}
        .vl-proof{grid-template-columns:1fr}.vl-conv{grid-template-columns:1fr}
        .vl-autos{grid-template-columns:1fr}.vl-statgrid{grid-template-columns:1fr 1fr}
        .vl-app{grid-template-columns:1fr}.vl-side{display:none}.vl-navlinks{display:none}
      }
    `;
    document.head.appendChild(el);
  }, []);
}

function Reveal({ children, delay = 0, style }) {
  const ref = useRef();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const e = ref.current;
    if (!e || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([x]) => { if (x.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(e);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ ...style, opacity: seen ? 1 : 0, transform: seen ? "none" : "translateY(18px)",
    transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

function CountUp({ end, decimals = 0, suffix = "", dur = 1200 }) {
  const ref = useRef();
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVal(end); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          setVal(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, dur]);
  return <span ref={ref} className="vl-mono">{val.toFixed(decimals)}{suffix}</span>;
}

/* ── Prototype data ───────────────────────────────────────── */
const SCRIPT = [
  { role: "viro", text: "Hi — I'm Viro. In a sentence or two, what does your company do?" },
  { role: "you", text: "We're Meridian Vans. We upfit custom commercial vans — shelving, liftgates, electrical." },
  { role: "viro", text: "Got it. How does a vehicle move through the plant?" },
  { role: "you", text: "Four stations — Entry, the upfit line, Quality Inspection, then Approved to Ship. Every van has a VIN." },
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

function Stat({ label, value, sub, subColor, valueColor, accent, delay = 0 }) {
  return (
    <div className="vl-card" style={{ padding: "15px 17px", animation: `vl-rise .5s cubic-bezier(.16,1,.3,1) ${delay}ms both` }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 9 }}>{label}</div>
      <div className="vl-mono" style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", color: valueColor || (accent ? TEAL : "#fff"), lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || "rgba(255,255,255,0.42)", marginTop: 7 }}>{sub}</div>}
    </div>
  );
}
function SideItem({ icon, label, active, accent }) {
  return (
    <div className="vl-side-item" style={active ? { background: accent ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.1)", color: accent ? TEAL : "#fff", fontWeight: 600 } : {}}>
      <span style={{ width: 16, textAlign: "center", opacity: active ? 1 : 0.6 }}>{icon}</span>{label}
    </div>
  );
}
const ScreenHead = ({ step, title, children }) => (
  <div style={{ marginBottom: 4 }}>
    <div className="vl-eyebrow">{step}</div>
    <h2 className="vl-h1">{title}</h2>
    <p className="vl-sub">{children}</p>
  </div>
);

/* ── Screen 1: Conversation ───────────────────────────────── */
function Conversation({ onGenerate }) {
  const [shown, setShown] = useState(0);
  const scrollRef = useRef();
  useEffect(() => {
    setShown(0);
    const timers = [];
    for (let i = 1; i <= SCRIPT.length; i++) timers.push(setTimeout(() => setShown(i), 500 + i * 1150));
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [shown]);
  const learnCount = Math.min(LEARN.length, Math.floor(shown / 2));
  const done = shown >= SCRIPT.length;
  return (
    <div className="vl-screen">
      <ScreenHead step="Step 01 — Onboarding" title="Tell Viro about your operation.">
        No setup wizard. No configuration forms. A five-minute conversation — and Viro builds the platform around your answers.
      </ScreenHead>
      <div className="vl-conv">
        <div className="vl-card" style={{ display: "flex", flexDirection: "column", height: 440 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "15px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, marginRight: 10, boxShadow: `0 0 8px ${GREEN}` }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Viro Onboarding</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Learning your operation</div>
            </div>
            <button className="vl-btn vl-btn-ghost" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 12 }} onClick={() => setShown(0)}>↻ Replay</button>
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {SCRIPT.slice(0, shown).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "you" ? "flex-end" : "flex-start", animation: "vl-rise .35s ease both" }}>
                <div style={{ maxWidth: "82%", padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
                  borderRadius: m.role === "you" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                  background: m.role === "you" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(255,255,255,${m.role === "you" ? 0.14 : 0.07})`,
                  color: m.role === "you" ? "#fff" : "rgba(255,255,255,0.82)" }}>
                  {m.role === "viro" && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>VIRO</div>}
                  {m.text}
                </div>
              </div>
            ))}
            {!done && <div style={{ display: "flex", gap: 4, padding: "4px 2px" }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `vl-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}</div>}
          </div>
          <div style={{ display: "flex", gap: 10, padding: 13, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Describe your operation in plain English…</div>
            <button className="vl-btn vl-btn-primary">Send</button>
          </div>
        </div>
        <div className="vl-card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)" }}>WHAT VIRO IS LEARNING</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            {LEARN.map((f, i) => {
              const on = i < learnCount;
              return (
                <div key={i} style={{ display: "flex", gap: 12, opacity: on ? 1 : 0.32, transition: "opacity .4s ease" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                    background: on ? GREEN : "transparent", color: "#08090a", border: on ? "none" : "1px solid rgba(255,255,255,0.2)", transition: "all .4s ease" }}>{on ? "✓" : ""}</div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{f.k}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{f.v}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="vl-btn vl-btn-primary" onClick={onGenerate} style={{ marginTop: 18, padding: "12px", width: "100%", fontSize: 14,
            opacity: done ? 1 : 0.55, boxShadow: done ? "0 10px 30px rgba(255,255,255,0.12)" : "none" }}>Generate my platform →</button>
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
    <div className="vl-screen" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 540, textAlign: "center" }}>
      <div className="vl-orb" style={{ width: 480, height: 360, top: "26%", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 600 }}>
        <div style={{ width: 70, height: 70, margin: "0 auto 26px", borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 31, color: "#08090a", transform: "rotate(45deg)", animation: "vl-spin 3.4s cubic-bezier(.6,0,.4,1) infinite" }}>
          <span style={{ transform: "rotate(-45deg)" }}>⬡</span>
        </div>
        <h2 className="vl-h2">Building your platform</h2>
        <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>Designing an operations system for <span className="vl-mono" style={{ color: "#fff", fontSize: 13.5 }}>Meridian Vans</span> — not a template.</p>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 5, textAlign: "left" }}>
          {GEN_STEPS.map((s, i) => {
            const state = i < active ? "done" : i === active ? "doing" : "todo";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 15px", borderRadius: 11,
                background: state === "doing" ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${state === "doing" ? "rgba(255,255,255,0.1)" : "transparent"}`, transition: "all .35s ease" }}>
                <span style={{ width: 21, height: 21, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                  background: state === "done" ? GREEN : "transparent", border: state === "done" ? "none" : "1px solid rgba(255,255,255,0.22)", color: state === "done" ? "#08090a" : "rgba(255,255,255,0.6)" }}>
                  {state === "done" ? "✓" : state === "doing" ? <span style={{ display: "inline-block", animation: "vl-spin 1s linear infinite" }}>◴</span> : ""}
                </span>
                <span style={{ fontSize: 14, color: state === "todo" ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: state === "doing" ? 600 : 400 }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 30, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
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
  const bars = [{ l: "710 · Approved to Ship", v: 61, hot: true }, { l: "310 · Upfit Line", v: 47 }, { l: "110 · Entry", v: 43 }];
  const blocked = [{ id: "MV-VIN-0038", tag: "LIFT FAIL" }, { id: "MV-VIN-0029", tag: "ALIGNMENT" }, { id: "MV-VIN-0007", tag: "PAINT" }];
  const maxBar = Math.max(...bars.map(b => b.v));
  return (
    <div className="vl-screen">
      <ScreenHead step="Step 03 — Generated for a vehicle manufacturer" title="Meridian Vans' platform.">
        Pipeline-first. VIN-keyed. Built around the question the plant manager asks every morning: <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>what's blocking vehicles from shipping?</span>
      </ScreenHead>
      <div className="vl-app" style={{ marginTop: 22 }}>
        <div className="vl-side">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 16px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>B</div>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>Meridian Vans</div><div style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>GENERATED BY VIRO</div></div>
          </div>
          {[["▦", "Production Overview", true], ["⌕", "Vehicle Search"], ["✎", "Log Defect"], ["⚒", "Upfit Line"], ["⟳", "Repair Queue"], ["▤", "Quality Analytics"], ["⚠", "Predictive Risk"], ["⚙", "Settings"]].map((it, i) => <SideItem key={i} icon={it[0]} label={it[1]} active={it[2]} />)}
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div><div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Production Overview</div><div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>Plant 1 · Today, June 11</div></div>
            <span className="vl-chip" style={{ fontSize: 11 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} /> LIVE · SNOWFLAKE</span>
          </div>
          <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 9 }}>VEHICLE PIPELINE · VIN FLOW</div>
          <div style={{ display: "flex", gap: 9, marginBottom: 13 }}>
            {stages.map((s, i) => (
              <div key={i} className={"vl-stage" + (s.hot ? " hot" : "")}>
                <div className="vl-mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.32)" }}>STAGE {s.n}</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: "5px 0 8px" }}>{s.name}</div>
                <div className="vl-mono" style={{ fontSize: 24, fontWeight: 700 }}>{s.c}<span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}> vehicles</span></div>
                <div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 7, color: s.noteColor }}>{s.note}</div>
              </div>
            ))}
          </div>
          <div className="vl-statgrid" style={{ marginBottom: 13 }}>
            <Stat label="First Pass Yield" value="71.4%" sub="↑ 3.2% vs last week" subColor={GREEN} />
            <Stat label="Open Defects" value="189" sub="↑ 12 since Monday" subColor={AMBER} delay={60} />
            <Stat label="Critical Open" value="21" valueColor={RED} sub="3 blocking shipment" delay={120} />
            <Stat label="Avg Resolution" value="6.8h" sub="↓ 1.4h improving" subColor={GREEN} delay={180} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 13 }}>
            <div className="vl-card" style={{ padding: 17 }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 13 }}>DEFECTS BY STATION · THIS WEEK</div>
              {bars.map((b, i) => (
                <div key={i} style={{ marginBottom: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{b.l}</span><span className="vl-mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{b.v}</span></div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${(b.v / maxBar) * 100}%`, borderRadius: 3, background: b.hot ? `linear-gradient(90deg,${RED},${AMBER})` : "rgba(255,255,255,0.45)", animation: "vl-bar 1s cubic-bezier(.16,1,.3,1)" }} /></div>
                </div>
              ))}
            </div>
            <div className="vl-card" style={{ padding: 17 }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 13 }}>BLOCKED AT QC · NEEDS ACTION</div>
              {blocked.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span className="vl-mono" style={{ fontSize: 12.5 }}>{b.id}</span>
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
    { n: "Pacific Marine Supply", v: 96, c: TEAL }, { n: "Harbourfront Hydraulics", v: 91, c: TEAL },
    { n: "Zhuhai Engine Parts", v: 84, c: "rgba(255,255,255,0.45)" }, { n: "Oceanic Fittings Co", v: 71, c: AMBER }, { n: "Delta Marine Trading", v: 58, c: RED },
  ];
  const pts = [18, 30, 24, 40, 36, 52, 48, 64, 60, 78];
  const w = 300, h = 90, max = Math.max(...pts), min = Math.min(...pts);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * w},${h - ((p - min) / (max - min)) * h}`).join(" ");
  return (
    <div className="vl-screen">
      <ScreenHead step="Step 04 — Generated for a marine procurement firm" title="Tidewater Marine's platform.">
        No production line here. RFQ-first, supplier-centric — because Tidewater told Viro their day revolves around <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>quote turnaround and supplier reliability.</span>
      </ScreenHead>
      <div className="vl-app" style={{ marginTop: 22 }}>
        <div className="vl-side">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 16px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: TEAL, color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>M</div>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>Tidewater Marine</div><div style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>GENERATED BY VIRO</div></div>
          </div>
          {[["⚓", "RFQ Desk", true], ["✉", "Quote Builder"], ["▤", "Suppliers"], ["▦", "Deliveries"], ["▤", "Procurement Analytics"], ["⚙", "Settings"]].map((it, i) => <SideItem key={i} icon={it[0]} label={it[1]} active={it[2]} accent />)}
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div><div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>RFQ Desk</div><div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>Hong Kong office · Today, June 11</div></div>
            <span className="vl-chip" style={{ fontSize: 11 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} /> LIVE · EMAIL + ERP</span>
          </div>
          <div className="vl-statgrid" style={{ marginBottom: 13 }}>
            <Stat label="Avg RFQ Response" value="4.2h" accent sub="↓ 38% since Viro" subColor={TEAL} />
            <Stat label="Open RFQs" value="17" sub="5 due within 24h" delay={60} />
            <Stat label="On-time Delivery" value="93.1%" sub="↑ 2.4% this quarter" subColor={GREEN} delay={120} />
            <div className="vl-card" style={{ padding: "15px 17px", animation: "vl-rise .5s cubic-bezier(.16,1,.3,1) 180ms both" }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Quote Win Rate · 12 wks</div>
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 48 }} preserveAspectRatio="none"><path d={path} fill="none" stroke={TEAL} strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 13 }}>
            <div className="vl-card" style={{ padding: 17 }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 11 }}>OPEN RFQS · BY DEADLINE</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1.3fr 1.4fr auto auto", gap: "0 12px", fontSize: 9, letterSpacing: "0.06em", color: "rgba(255,255,255,0.32)", paddingBottom: 8 }}>
                <span>RFQ</span><span>VESSEL</span><span>ITEMS</span><span>DUE</span><span>STATUS</span>
              </div>
              {rfqs.map((r, i) => (
                <div key={i} className="vl-rfqrow" style={{ display: "grid", gridTemplateColumns: "auto 1.3fr 1.4fr auto auto", gap: "0 12px", alignItems: "center", padding: "8px 6px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11.5, borderRadius: 6 }}>
                  <span className="vl-mono" style={{ fontSize: 10.5 }}>{r.id}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vessel}</span>
                  <span style={{ color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.items}</span>
                  <span className="vl-mono" style={{ fontSize: 10.5, color: r.dueColor, fontWeight: 600 }}>{r.due}</span>
                  <span className="vl-pill" style={{ color: r.sc, background: r.sc === GREEN ? "rgba(52,211,153,0.12)" : r.sc === RED ? "rgba(255,90,90,0.12)" : r.sc === AMBER ? "rgba(240,168,60,0.12)" : "rgba(255,255,255,0.08)", border: `1px solid ${r.sc}33` }}>{r.status}</span>
                </div>
              ))}
            </div>
            <div className="vl-card" style={{ padding: 17 }}>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 13 }}>SUPPLIER RELIABILITY · 90 DAYS</div>
              {suppliers.map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>{s.n}</span><span className="vl-mono" style={{ fontSize: 11.5, fontWeight: 700, color: s.c === "rgba(255,255,255,0.45)" ? "#fff" : s.c }}>{s.v}%</span></div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${s.v}%`, background: s.c, borderRadius: 3, animation: "vl-bar 1s cubic-bezier(.16,1,.3,1)" }} /></div>
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
    { t: "Invoice · MV-VIN-0013 → Lone Star Fleet TX", d: "Generated 11 min ago", a: "Send" } ] },
  { icon: "📋", title: "Quality", meta: "The plant manager's Monday morning, pre-written", ready: 2, items: [
    { t: "Weekly Quality Report · Jun 5 – 11", d: "FPY 71.4% (↑3.2) · top issue: dents at 710 · 21 critical open", a: "Approve" },
    { t: "Quality certificates · 6 vehicles shipping today", d: "All inspection records attached automatically", a: "Approve" } ] },
  { icon: "📝", title: "Floor Operations", meta: "Shift handoff, written from the day's events", ready: 1, items: [
    { t: "Shift handover · Day → Evening", d: "14 defects logged · Upfit Line slowdown 1:40pm · 3 blocked at QC flagged", a: "Post" } ] },
  { icon: "📦", title: "Procurement", meta: "Drafted from recurring defect patterns", ready: 2, items: [
    { t: "Email · Apex Liftgate Co — defect pattern escalation", d: "5 liftgate malfunctions in 30 days, batch #AL-2241 referenced", a: "Send" },
    { t: "Email · paint supplier — finish quality query", d: "Paint defects up 40% week-over-week at stage 310", a: "Send" } ] },
];
function Automations() {
  return (
    <div className="vl-screen">
      <ScreenHead step="Step 05 — One assistant per role" title="Every department's paperwork, already done.">
        Viro holds the operational data — so the documents people write from it by hand can write themselves. Review, approve, send.
      </ScreenHead>
      <div className="vl-autos">
        {AUTO_GROUPS.map((g, gi) => (
          <div key={gi} className="vl-card" style={{ padding: 19, animation: `vl-rise .5s cubic-bezier(.16,1,.3,1) ${gi * 70}ms both` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{g.icon}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{g.title}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{g.meta}</div></div>
              <span className="vl-pill" style={{ color: GREEN, background: "rgba(52,211,153,0.12)", border: `1px solid ${GREEN}33` }}>{g.ready} READY</span>
            </div>
            {g.items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 3 }}>{it.t}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{it.d}</div></div>
                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  <button className="vl-btn vl-btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Review</button>
                  <button className="vl-btn vl-btn-primary" style={{ padding: "6px 13px", fontSize: 12 }}>{it.a}</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: "rgba(255,255,255,0.45)" }}>
        This week, Viro drafted <span style={{ color: "#fff", fontWeight: 700 }}>23 documents</span> — giving Meridian Vans back roughly <span style={{ color: "#fff", fontWeight: 700 }}>11 hours</span> of manual work.
      </div>
    </div>
  );
}

/* ── Embedded interactive prototype ───────────────────────── */
const TABS = ["Conversation", "Generation", "Meridian Vans", "Tidewater Marine", "Automations"];
const DURATIONS = [11200, 5800, 6000, 6000, 7200]; // pitch-mode dwell per screen
function Prototype() {
  const [screen, setScreen] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef();
  const autostarted = useRef(false);

  // Auto-start pitch mode the first time the frame scrolls into view.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !autostarted.current) { autostarted.current = true; setScreen(0); setPlaying(true); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // While playing, dwell on each screen then advance (loops).
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setScreen(s => (s + 1) % TABS.length), DURATIONS[screen]);
    return () => clearTimeout(t);
  }, [playing, screen]);

  const goManual = (i) => { setPlaying(false); setScreen(i); };

  return (
    <div className="vl-frame" ref={frameRef}>
      <div className="vl-frame-bar">
        <div style={{ display: "flex", gap: 7 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />)}
        </div>
        <div className="vl-tabs">
          {TABS.map((t, i) => (
            <button key={i} className={"vl-tab" + (i === screen ? " active" : "")} onClick={() => goManual(i)}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>{t}
            </button>
          ))}
        </div>
        <button className="vl-playbtn" style={{ marginLeft: "auto" }} onClick={() => setPlaying(p => !p)}>
          {playing ? "❚❚ Pause" : "▶ Play tour"}
        </button>
      </div>
      {/* progress sliver */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", position: "relative" }}>
        <div key={`${screen}-${playing}`} style={{ height: "100%", background: "rgba(255,255,255,0.55)",
          width: playing ? "100%" : "0%",
          animation: playing ? `vl-progress ${DURATIONS[screen]}ms linear` : "none" }} />
      </div>
      <div style={{ padding: "26px 26px 30px" }}>
        {screen === 0 && <Conversation onGenerate={() => setScreen(1)} />}
        {screen === 1 && <Generation onDone={() => setScreen(s => (s === 1 ? 2 : s))} />}
        {screen === 2 && <VanDash />}
        {screen === 3 && <MarineDash />}
        {screen === 4 && <Automations />}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
const STEPS = [
  { n: "01", t: "Describe", d: "Tell Viro who works there and what you track. No setup forms, no template to pick — just how your operation actually runs." },
  { n: "02", t: "Generate", d: "Viro builds the platform — the right dashboards, the right metrics, your own vocabulary — per company and per role." },
  { n: "03", t: "Operate", d: "Every screen answers a question. Ask in plain English and the dashboard reshapes. The paperwork drafts itself." },
];

export default function Landing({ onSignIn, onGetStarted }) {
  useLandingStyles();
  const [scrollPct, setScrollPct] = useState(0);
  const onScroll = (e) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setScrollPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
  };
  return (
    <div className="vl-root" onScroll={onScroll}>
      <div className="vl-scrollbar" style={{ width: `${scrollPct}%` }} />
      {/* NAV */}
      <div className="vl-nav">
        <div className="vl-wrap" style={{ display: "flex", alignItems: "center", height: 62 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>⬡</div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</span>
          </div>
          <div className="vl-navlinks">
            <a className="vl-link" href="#demo">See it live</a>
            <a className="vl-link" href="#how">How it works</a>
            <a className="vl-link" href="#automations">Automations</a>
          </div>
          <div style={{ display: "flex", gap: 9, marginLeft: "auto" }}>
            <button className="vl-btn vl-btn-ghost" onClick={onSignIn}>Sign in</button>
            <button className="vl-btn vl-btn-primary" onClick={onGetStarted}>Get started</button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: "relative" }}>
        <div className="vl-grid-bg" />
        <div className="vl-orb" style={{ width: 620, height: 460, top: "6%", left: "20%", background: "rgba(255,255,255,0.05)" }} />
        <div className="vl-orb" style={{ width: 520, height: 520, top: "40%", left: "84%", background: "rgba(45,212,191,0.05)" }} />
        <div className="vl-wrap" style={{ position: "relative", zIndex: 1, padding: "74px 32px 60px" }}>
          <div className="vl-hero">
            <Reveal>
              <span className="vl-chip" style={{ marginBottom: 22 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
                The operating system for operations
              </span>
              <h1 className="vl-hero-h1">Describe your operation.<br />Watch it build.</h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.6)", maxWidth: 470, margin: "22px 0 30px" }}>
                Viro turns a sentence about how your company runs into a custom platform —
                live dashboards, the answers your team needs, and the documents every
                department writes by hand, drafted for them.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="vl-btn vl-btn-primary" style={{ padding: "13px 24px", fontSize: 14.5 }} onClick={onGetStarted}>Build your platform →</button>
                <a href="#demo" className="vl-btn vl-btn-ghost" style={{ padding: "13px 22px", fontSize: 14.5, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>See it live ↓</a>
              </div>
              <div style={{ marginTop: 26, display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
                <span>✦ No templates</span><span>✦ Live in minutes</span><span>✦ Built around your work</span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              {/* hero preview: the generated Meridian Vans dashboard, framed */}
              <div className="vl-frame" style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
                <div className="vl-frame-bar">
                  <div style={{ display: "flex", gap: 7 }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />)}</div>
                  <span className="vl-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>viro.app / meridian-vans</span>
                  <span style={{ marginLeft: "auto", fontSize: 10.5, color: GREEN }}>● live</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 9 }}>VEHICLE PIPELINE</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[{ n: "110", c: 12 }, { n: "310", c: 15 }, { n: "510", c: 14, hot: true }, { n: "710", c: 9 }].map((s, i) => (
                      <div key={i} className={"vl-stage" + (s.hot ? " hot" : "")} style={{ padding: 11 }}>
                        <div className="vl-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.32)" }}>{s.n}</div>
                        <div className="vl-mono" style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>{s.c}</div>
                        <div style={{ fontSize: 8.5, fontWeight: 600, marginTop: 4, color: s.hot ? RED : "rgba(255,255,255,0.3)" }}>{s.hot ? "● blocked" : "on pace"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[{ l: "FPY", v: "71.4%" }, { l: "OPEN", v: "189" }, { l: "CRITICAL", v: "21", r: true }].map((k, i) => (
                      <div key={i} className="vl-card" style={{ padding: "11px 13px" }}>
                        <div style={{ fontSize: 8.5, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{k.l}</div>
                        <div className="vl-mono" style={{ fontSize: 19, fontWeight: 700, color: k.r ? RED : "#fff" }}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="vl-card" style={{ padding: "11px 13px", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.62)", display: "flex", gap: 7 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>✦</span>
                    <span>3 vans blocked at QC — all lift faults from batch AL-2241. Clearing them ships $240K this week.</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* EMBEDDED PROTOTYPE */}
      <div id="demo" className="vl-wrap" style={{ padding: "44px 32px 20px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div className="vl-section-label">The product · interactive</div>
            <h2 className="vl-h2" style={{ marginTop: 12 }}>Click through the real thing.</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "12px auto 0" }}>
              Not a video. Walk the five steps — describe an operation, watch Viro generate it,
              and see two completely different companies running on the same engine.
            </p>
          </div>
        </Reveal>
        <Reveal delay={80}><Prototype /></Reveal>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="vl-wrap" style={{ padding: "56px 32px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="vl-section-label">How it works</div>
            <h2 className="vl-h2" style={{ marginTop: 12 }}>From a conversation to a control room.</h2>
          </div>
        </Reveal>
        <div className="vl-steps">
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="vl-card vl-hover" style={{ padding: 24, height: "100%" }}>
                <div className="vl-mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* PROOF STRIP */}
      <div className="vl-wrap" style={{ padding: "8px 32px 56px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <div className="vl-section-label">One engine</div>
            <h2 className="vl-h2" style={{ marginTop: 12 }}>Every operation. Its own platform.</h2>
          </div>
        </Reveal>
        <div className="vl-proof">
          {[
            { brand: "Meridian Vans", c: "#fff", tag: "Vehicle manufacturing", lines: ["VIN-keyed pipeline across 4 stations", "First-pass-yield & blocked-vehicle alerts", "Invoices draft themselves on ship"] },
            { brand: "Tidewater Marine", c: TEAL, tag: "Marine procurement", lines: ["RFQ desk from enquiry to delivery", "Supplier-reliability scoring", "Quote chasers written automatically"] },
          ].map((p, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="vl-card vl-hover" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: p.c, color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{p.brand[0]}</div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.brand}</div><div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)" }}>{p.tag}</div></div>
                </div>
                {p.lines.map((l, j) => (
                  <div key={j} style={{ display: "flex", gap: 9, padding: "7px 0", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}>
                    <span style={{ color: p.c, flexShrink: 0 }}>✦</span>{l}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* AUTOMATIONS HIGHLIGHT */}
      <div id="automations" className="vl-wrap" style={{ padding: "8px 32px 60px" }}>
        <Reveal>
          <div className="vl-card" style={{ padding: "clamp(34px,5vw,56px)", textAlign: "center", background: "rgba(255,255,255,0.04)" }}>
            <div className="vl-section-label">Role automations</div>
            <h2 className="vl-h2" style={{ marginTop: 12 }}>The paperwork writes itself.</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 560, margin: "12px auto 26px" }}>
              Viro knows your live data, so it drafts the documents every department spends hours on.
              You review and send. Last week at Meridian Vans (demo data):
            </p>
            <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", marginBottom: 26 }}>
              <div><div style={{ fontSize: 40, fontWeight: 700 }}><CountUp end={23} /></div><div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>documents drafted</div></div>
              <div><div style={{ fontSize: 40, fontWeight: 700 }}><CountUp end={11} suffix="h" /></div><div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>of manual work returned</div></div>
              <div><div style={{ fontSize: 40, fontWeight: 700 }}><CountUp end={4} /></div><div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>departments covered</div></div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {["Invoices", "Weekly quality reports", "Supplier emails", "Shift handovers"].map((t, i) => <span key={i} className="vl-chip">{t}</span>)}
            </div>
          </div>
        </Reveal>
      </div>

      {/* CLOSING CTA */}
      <div className="vl-wrap" style={{ padding: "0 32px 80px" }}>
        <Reveal>
          <div className="vl-card" style={{ position: "relative", overflow: "hidden", padding: "clamp(40px,7vw,76px) 28px", textAlign: "center", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="vl-orb" style={{ width: 440, height: 300, top: "50%", left: "50%", background: "rgba(255,255,255,0.06)", animation: "vl-float 18s ease-in-out infinite" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(30px,5vw,50px)", fontWeight: 800, letterSpacing: "-0.035em", margin: "0 0 16px", lineHeight: 1.05 }}>Run your operation<br />on Viro.</h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 450, margin: "0 auto 28px" }}>Describe how your company works. Have a platform built around it before your coffee's cold.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="vl-btn vl-btn-primary" style={{ padding: "14px 28px", fontSize: 15 }} onClick={onGetStarted}>Build your platform →</button>
                <button className="vl-btn vl-btn-ghost" style={{ padding: "14px 24px", fontSize: 15 }} onClick={onSignIn}>Sign in</button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="vl-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 32px", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff", color: "#08090a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>⬡</div>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Viro</span>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>The operating system for operations.</span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Viro</span>
        </div>
      </div>
    </div>
  );
}
