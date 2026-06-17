import { useState, useEffect, useRef } from "react";
import { COLORS } from "../components/Layout";

/* ────────────────────────────────────────────────────────────
   Viro landing page — the marketing front door.
   The visual north star from the Fable prototype: a frosted-glass
   "operating system for operations" that builds itself from a
   sentence. Dark (#08090a), Inter, severity-only color, zero purple.
──────────────────────────────────────────────────────────── */

const STYLE_ID = "viro-landing-styles";
function useLandingStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..900&family=JetBrains+Mono:wght@400;600&display=swap');
      .vl-root{font-family:'Inter',-apple-system,sans-serif;background:#08090a;color:#fff;
        -webkit-font-smoothing:antialiased;overflow-x:hidden}
      .vl-mono{font-family:'JetBrains Mono',monospace}
      .vl-wrap{max-width:1180px;margin:0 auto;padding:0 28px}
      .vl-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(18px);
        background:rgba(8,9,10,0.66);border-bottom:1px solid rgba(255,255,255,0.06)}
      .vl-btn{border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;
        transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,background .18s ease,border-color .18s ease;
        letter-spacing:-0.01em;border:1px solid transparent;font-family:inherit}
      .vl-btn-primary{background:#fff;color:#08090a;padding:11px 20px}
      .vl-btn-primary:hover{transform:translateY(-1px);box-shadow:0 10px 30px rgba(255,255,255,0.18)}
      .vl-btn-ghost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.85);
        border-color:rgba(255,255,255,0.1);padding:11px 18px}
      .vl-btn-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.2)}
      .vl-card{background:rgba(255,255,255,0.045);backdrop-filter:blur(20px);
        border:1px solid rgba(255,255,255,0.08);border-radius:16px}
      .vl-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:30px;
        background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
        font-size:12px;color:rgba(255,255,255,0.7)}
      .vl-h1{font-size:clamp(40px,6.4vw,76px);line-height:1.02;font-weight:800;letter-spacing:-0.04em;
        background:linear-gradient(180deg,#fff 30%,rgba(255,255,255,0.62));-webkit-background-clip:text;
        background-clip:text;-webkit-text-fill-color:transparent}
      .vl-hero{display:grid;grid-template-columns:1.04fr 0.96fr;gap:46px;align-items:center}
      .vl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
      .vl-proof{display:grid;grid-template-columns:1fr 1fr;gap:20px}
      .vl-autos{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
      .vl-section-label{font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;
        color:rgba(255,255,255,0.4)}
      .vl-caret{display:inline-block;width:2px;height:1.05em;background:#fff;margin-left:1px;
        vertical-align:-2px;animation:vl-blink 1s steps(1) infinite}
      @keyframes vl-blink{50%{opacity:0}}
      @keyframes vl-pulse{0%,100%{opacity:0.35;transform:scale(0.8)}50%{opacity:1;transform:scale(1.15)}}
      @keyframes vl-float{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
      @keyframes vl-grow{from{height:6px;opacity:0}to{opacity:1}}
      @keyframes vl-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      .vl-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}
      .vl-grid-bg{position:absolute;inset:0;z-index:0;pointer-events:none;
        background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);
        background-size:54px 54px;
        mask-image:radial-gradient(ellipse 70% 60% at 50% 30%,#000,transparent 75%);
        -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 30%,#000,transparent 75%)}
      .vl-link{color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;
        transition:color .15s ease}
      .vl-link:hover{color:#fff}
      .vl-pill-stage{flex:1 1 86px;background:rgba(255,255,255,0.035);
        border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:11px 12px;position:relative}
      .vl-pill-stage.hot{border-color:rgba(255,68,68,0.4);background:rgba(255,68,68,0.06)}
      .vl-auto-card{transition:transform .2s cubic-bezier(.16,1,.3,1),border-color .2s ease,background .2s ease}
      .vl-auto-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,0.16);
        background:rgba(255,255,255,0.06)}
      @media(max-width:860px){
        .vl-hero{grid-template-columns:1fr;gap:34px}
        .vl-steps{grid-template-columns:1fr}
        .vl-proof{grid-template-columns:1fr}
        .vl-autos{grid-template-columns:1fr}
        .vl-nav-links{display:none!important}
      }
    `;
    document.head.appendChild(el);
  }, []);
}

/* Reveal-on-scroll wrapper (robust: falls back to visible) */
function Reveal({ children, delay = 0, style }) {
  const ref = useRef();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      ...style,
      opacity: seen ? 1 : 0,
      transform: seen ? "none" : "translateY(18px)",
      transition: `opacity .75s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .75s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

const SCENARIOS = [
  {
    who: "Meridian Vans",
    prompt: "We build custom commercial vans — 4 stations, we log defects per VIN, and I need to know what's blocking shipping.",
    title: "Production Overview",
    sub: "Custom commercial vehicles · Plant 1, IN",
    kpis: [
      { l: "First Pass Yield", v: "86%" },
      { l: "Open Defects", v: "23" },
      { l: "Critical", v: "3", danger: true },
      { l: "Avg Resolution", v: "6.2h" },
    ],
    stages: [
      { n: "110", name: "Entry", c: 12 },
      { n: "310", name: "Upfit Line", c: 9 },
      { n: "510", name: "Quality", c: 6, hot: true },
      { n: "710", name: "Ship", c: 4 },
    ],
    bars: [
      { l: "Lift malfunction", v: 14 },
      { l: "Wiring fault", v: 9 },
      { l: "Paint defect", v: 6 },
      { l: "Alignment", v: 4 },
    ],
    insight: "3 vans blocked at Quality — all lift faults from batch AL-2241. Clearing them ships $240K this week.",
    unit: "vans",
  },
  {
    who: "Tidewater Marine",
    prompt: "We source marine parts. Track every RFQ from enquiry to delivery across our Hong Kong suppliers.",
    title: "Procurement Overview",
    sub: "Marine procurement · Hong Kong",
    kpis: [
      { l: "On-time Quotes", v: "78%" },
      { l: "Open RFQs", v: "41" },
      { l: "At Risk", v: "5", danger: true },
      { l: "Avg Turnaround", v: "2.1d" },
    ],
    stages: [
      { n: "100", name: "Enquiry", c: 18 },
      { n: "200", name: "Suppliers", c: 11 },
      { n: "300", name: "Quotes", c: 8, hot: true },
      { n: "400", name: "Ordered", c: 6 },
    ],
    bars: [
      { l: "Supplier delay", v: 12 },
      { l: "Wrong parts", v: 7 },
      { l: "Customs hold", v: 5 },
      { l: "Docs missing", v: 3 },
    ],
    insight: "5 RFQs stalled awaiting quotes from 2 suppliers — chasing them unlocks orders worth HK$1.2M.",
    unit: "RFQs",
  },
];

function MockDash({ sc, animate = false }) {
  const maxBar = Math.max(...sc.bars.map(b => b.v), 1);
  const aStyle = (i) => animate
    ? { animation: `vl-rise .5s cubic-bezier(.16,1,.3,1) ${i * 90}ms both` }
    : {};
  const lbl = { fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "rgba(255,255,255,0.32)", fontWeight: 600, marginBottom: 10 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {sc.kpis.map((k, i) => (
          <div key={i} className="vl-card" style={{ padding: "12px 13px", ...aStyle(i) }}>
            <div style={{ fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)", marginBottom: 7, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>{k.l}</div>
            <div className="vl-mono" style={{ fontSize: 21, fontWeight: 700,
              color: k.danger ? COLORS.critical : "#fff" }}>{k.v}</div>
          </div>
        ))}
      </div>
      {/* Pipeline */}
      <div className="vl-card" style={{ padding: 14, ...aStyle(4) }}>
        <div style={lbl}>Pipeline · live flow</div>
        <div style={{ display: "flex", gap: 8 }}>
          {sc.stages.map((s, i) => (
            <div key={i} className={"vl-pill-stage" + (s.hot ? " hot" : "")}>
              <div className="vl-mono" style={{ fontSize: 8.5, color: "rgba(255,255,255,0.32)" }}>{s.n}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: "4px 0 6px" }}>{s.name}</div>
              <div className="vl-mono" style={{ fontSize: 18, fontWeight: 700 }}>{s.c}</div>
              <div style={{ fontSize: 9, fontWeight: 600, marginTop: 4,
                color: s.hot ? COLORS.critical : (i === sc.stages.length - 1 ? COLORS.low : "rgba(255,255,255,0.3)") }}>
                {s.hot ? "● blocked" : (i === sc.stages.length - 1 ? "ready" : "on pace")}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Bars + insight */}
      <div className="vl-card" style={{ padding: 14, ...aStyle(5) }}>
        <div style={lbl}>Top issues</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {sc.bars.map((b, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.74)" }}>{b.l}</span>
                <span className="vl-mono" style={{ fontSize: 11, fontWeight: 700 }}>{b.v}</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(b.v / maxBar) * 100}%`, borderRadius: 3,
                  background: i === 0 ? `linear-gradient(90deg,${COLORS.critical},${COLORS.high})` : "rgba(255,255,255,0.5)" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11.5, lineHeight: 1.5, color: "rgba(255,255,255,0.66)", display: "flex", gap: 7 }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>✦</span>
          <span>{sc.insight}</span>
        </div>
      </div>
    </div>
  );
}

function GenerativeDemo() {
  const [si, setSi] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("typing"); // typing | building | done

  useEffect(() => {
    const sc = SCENARIOS[si];
    const timers = [];
    let i = 0;
    setTyped(""); setPhase("typing");
    const typeNext = () => {
      i += 1;
      setTyped(sc.prompt.slice(0, i));
      if (i < sc.prompt.length) timers.push(setTimeout(typeNext, 20 + Math.random() * 32));
      else {
        timers.push(setTimeout(() => setPhase("building"), 480));
        timers.push(setTimeout(() => setPhase("done"), 1480));
        timers.push(setTimeout(() => setSi((si + 1) % SCENARIOS.length), 7200));
      }
    };
    timers.push(setTimeout(typeNext, 650));
    return () => timers.forEach(clearTimeout);
  }, [si]);

  const sc = SCENARIOS[si];
  return (
    <div className="vl-card" style={{ padding: 0, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
      {/* window chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
        <span className="vl-mono" style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.32)" }}>viro.app</span>
        <span style={{ marginLeft: "auto", fontSize: 10.5, color: COLORS.low, letterSpacing: "0.06em" }}>● live</span>
      </div>

      {/* prompt */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Describe your operation</div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "13px 15px", fontSize: 13.5, lineHeight: 1.55, minHeight: 70,
          color: "rgba(255,255,255,0.9)" }}>
          {typed}{phase === "typing" && <span className="vl-caret" />}
        </div>
      </div>

      {/* result */}
      <div style={{ padding: "0 16px 16px", minHeight: 320 }}>
        {phase === "typing" && (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.22)", fontSize: 12.5 }}>Viro is listening…</div>
        )}
        {phase === "building" && (
          <div style={{ height: 300, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 7 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#fff",
                  animation: `vl-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              Generating {sc.who}'s platform…
            </div>
          </div>
        )}
        {phase === "done" && (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>{sc.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{sc.sub}</div>
              </div>
              <span className="vl-chip" style={{ padding: "4px 11px", fontSize: 11 }}>
                <span style={{ color: COLORS.low }}>✦</span> generated for {sc.who}
              </span>
            </div>
            <MockDash sc={sc} animate />
          </div>
        )}
      </div>
    </div>
  );
}

const AUTOMATIONS = [
  { icon: "📄", title: "Weekly quality report", body: "Drafts Monday's QC summary from the week's defects — trends, top issues, what shipped. Ready before the standup." },
  { icon: "✉️", title: "Supplier emails", body: "Writes the chase email to the supplier holding up five orders, with the part numbers and dates already filled in." },
  { icon: "🧾", title: "Invoices from ship events", body: "The moment a unit is approved to ship, the invoice drafts itself from the order — no re-keying." },
  { icon: "🔁", title: "Shift handovers", body: "End-of-shift handover written automatically: what's blocked, what's at risk, what the next shift owns." },
];

export default function Landing({ onSignIn, onGetStarted }) {
  useLandingStyles();

  return (
    <div className="vl-root" style={{ minHeight: "100vh", overflowY: "auto", height: "100vh" }}>
      {/* NAV */}
      <div className="vl-nav">
        <div className="vl-wrap" style={{ display: "flex", alignItems: "center", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", color: "#08090a",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800 }}>⬡</div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</span>
          </div>
          <div className="vl-nav-links" style={{ display: "flex", gap: 26, margin: "0 auto" }}>
            <a className="vl-link" href="#how">How it works</a>
            <a className="vl-link" href="#proof">One system</a>
            <a className="vl-link" href="#automations">Automations</a>
          </div>
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button className="vl-btn vl-btn-ghost" onClick={onSignIn}>Sign in</button>
            <button className="vl-btn vl-btn-primary" onClick={onGetStarted}>Get started</button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: "relative" }}>
        <div className="vl-grid-bg" />
        <div className="vl-orb" style={{ width: 620, height: 480, top: "8%", left: "18%",
          background: "rgba(255,255,255,0.05)" }} />
        <div className="vl-orb" style={{ width: 520, height: 520, top: "44%", left: "82%",
          background: "rgba(255,255,255,0.035)" }} />
        <div className="vl-wrap" style={{ position: "relative", zIndex: 1, padding: "76px 28px 64px" }}>
          <div className="vl-hero">
            <Reveal>
              <span className="vl-chip" style={{ marginBottom: 22 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.low }} />
                The operating system for operations
              </span>
              <h1 className="vl-h1" style={{ margin: "0 0 20px" }}>
                Describe your<br />operation.<br />Watch it build.
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.6)",
                maxWidth: 480, margin: "0 0 30px" }}>
                Viro turns a sentence about how your company runs into a custom
                platform — live dashboards, the answers your team needs, and the
                documents every department writes by hand, drafted for them.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="vl-btn vl-btn-primary" style={{ padding: "13px 24px", fontSize: 14.5 }}
                  onClick={onGetStarted}>Build your platform →</button>
                <button className="vl-btn vl-btn-ghost" style={{ padding: "13px 22px", fontSize: 14.5 }}
                  onClick={onSignIn}>Sign in</button>
              </div>
              <div style={{ marginTop: 26, display: "flex", gap: 18, flexWrap: "wrap",
                fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
                <span>✦ No templates</span>
                <span>✦ Live in minutes</span>
                <span>✦ Built around your work</span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <GenerativeDemo />
            </Reveal>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="vl-wrap" style={{ padding: "60px 28px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 38 }}>
            <div className="vl-section-label">How it works</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.03em",
              margin: "12px 0 0" }}>From a conversation to a control room.</h2>
          </div>
        </Reveal>
        <div className="vl-steps">
          {[
            { n: "01", t: "Describe", d: "Tell Viro who works there and what you track. No setup forms, no template to pick — just how your operation actually runs." },
            { n: "02", t: "Generate", d: "Viro builds the platform — the right dashboards, the right metrics, the right vocabulary — per company and per role." },
            { n: "03", t: "Operate", d: "Every screen answers a question. Ask in plain English and the dashboard reshapes. The paperwork drafts itself." },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="vl-card" style={{ padding: 24, height: "100%" }}>
                <div className="vl-mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* TWO-COMPANY PROOF */}
      <div id="proof" className="vl-wrap" style={{ padding: "60px 28px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 38 }}>
            <div className="vl-section-label">One system</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.03em",
              margin: "12px 0 10px" }}>Every operation. Its own platform.</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto" }}>
              Same engine. A van plant and a marine procurement desk get completely
              different platforms — because Viro builds around the work, not a template.
            </p>
          </div>
        </Reveal>
        <div className="vl-proof">
          {SCENARIOS.map((sc, i) => (
            <Reveal key={i} delay={i * 110}>
              <div className="vl-card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>{sc.who}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{sc.sub}</div>
                </div>
                <MockDash sc={sc} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* AUTOMATIONS */}
      <div id="automations" className="vl-wrap" style={{ padding: "60px 28px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 38 }}>
            <div className="vl-section-label">Role automations</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-0.03em",
              margin: "12px 0 10px" }}>The paperwork writes itself.</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto" }}>
              Viro knows your live data — so it drafts the documents every department
              spends hours on. You review and send.
            </p>
          </div>
        </Reveal>
        <div className="vl-autos">
          {AUTOMATIONS.map((a, i) => (
            <Reveal key={i} delay={(i % 2) * 90}>
              <div className="vl-card vl-auto-card" style={{ padding: 22, display: "flex", gap: 16, height: "100%" }}>
                <div style={{ fontSize: 26, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{a.body}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* CLOSING CTA */}
      <div className="vl-wrap" style={{ padding: "40px 28px 90px" }}>
        <Reveal>
          <div className="vl-card" style={{ position: "relative", overflow: "hidden",
            padding: "clamp(40px,7vw,80px) 28px", textAlign: "center",
            background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="vl-orb" style={{ width: 460, height: 320, top: "50%", left: "50%",
              background: "rgba(255,255,255,0.06)", animation: "vl-float 18s ease-in-out infinite" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.035em",
                margin: "0 0 16px", lineHeight: 1.05 }}>
                Run your operation<br />on Viro.
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 460, margin: "0 auto 28px" }}>
                Describe how your company works. Have a platform built around it before your coffee's cold.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="vl-btn vl-btn-primary" style={{ padding: "14px 28px", fontSize: 15 }}
                  onClick={onGetStarted}>Build your platform →</button>
                <button className="vl-btn vl-btn-ghost" style={{ padding: "14px 24px", fontSize: 15 }}
                  onClick={onSignIn}>Sign in</button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="vl-wrap" style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "26px 28px", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff", color: "#08090a",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>⬡</div>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Viro</span>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>
              The operating system for operations.
            </span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Viro</span>
        </div>
      </div>
    </div>
  );
}
