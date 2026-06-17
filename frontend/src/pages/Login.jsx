import { useState, useEffect } from "react";
import { login } from "../api/client";

const GREEN = "#34d399";
const AMBER = "#f0a83c";
const RED = "#ff5a5a";

const STYLE_ID = "viro-login-styles";
function useLoginStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..900&family=JetBrains+Mono:wght@400;500;700&display=swap');
      .lg-root{font-family:'Inter',-apple-system,sans-serif;background:#08090a;color:#fff;-webkit-font-smoothing:antialiased}
      .lg-mono{font-family:'JetBrains Mono',monospace}
      .lg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;
        background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:52px 52px;
        mask-image:radial-gradient(ellipse 60% 55% at 50% 42%,#000,transparent 75%);
        -webkit-mask-image:radial-gradient(ellipse 60% 55% at 50% 42%,#000,transparent 75%)}
      .lg-card{animation:lg-in .55s cubic-bezier(.16,1,.3,1)}
      @keyframes lg-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      .lg-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
        border-radius:11px;padding:12px 15px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;
        font-family:inherit;transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}
      .lg-input::placeholder{color:rgba(255,255,255,0.28)}
      .lg-input:focus{border-color:rgba(255,255,255,0.28);background:rgba(255,255,255,0.06);
        box-shadow:0 0 0 3px rgba(255,255,255,0.05)}
      .lg-btn{width:100%;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;
        font-family:inherit;letter-spacing:-0.01em;cursor:pointer;
        transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,opacity .18s ease}
      .lg-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 12px 34px rgba(255,255,255,0.16)}
      .lg-acct{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;border-radius:10px;
        cursor:pointer;transition:background .15s ease}
      .lg-acct:hover{background:rgba(255,255,255,0.05)}
      .lg-back{display:inline-flex;align-items:center;gap:6px;color:rgba(255,255,255,0.5);font-size:13px;
        cursor:pointer;transition:color .15s ease}
      .lg-back:hover{color:#fff}
    `;
    document.head.appendChild(el);
  }, []);
}

const ACCOUNTS = [
  { email: "manager@meridianvans.com", role: "Manager", color: "#e4e4e7" },
  { email: "worker@meridianvans.com", role: "Worker", color: GREEN },
  { email: "repair@meridianvans.com", role: "Repair", color: AMBER },
];

export default function Login({ onLogin, onSignup, onBack }) {
  useLoginStyles();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password required"); return; }
    setLoading(true); setError(null);
    try {
      const res = await login(email, password);
      const { token, user } = res.data;
      localStorage.setItem("viro_token", token);
      localStorage.setItem("viro_user", JSON.stringify(user));
      onLogin(user, token);
    } catch {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div className="lg-root" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: 24 }}>
      <div className="lg-grid" />
      <div style={{ position: "absolute", width: 460, height: 380, top: "30%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.05)", borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none" }} />

      {onBack && (
        <div className="lg-back" onClick={onBack} style={{ position: "absolute", top: 22, left: 24, zIndex: 2 }}>← Back</div>
      )}

      <div className="lg-card" style={{ position: "relative", zIndex: 1, width: 412, maxWidth: "100%",
        background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, padding: 36,
        boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>

        {/* mark */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, margin: "0 auto 16px", borderRadius: 13, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 100 100"><polygon points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5" fill="#08090a" /></svg>
          </div>
          <div className="lg-mono" style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>SIGN IN</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Welcome back to Viro</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 5 }}>Your operation, where you left it.</div>
        </div>

        {/* email */}
        <div style={{ marginBottom: 14 }}>
          <div className="lg-mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 7 }}>EMAIL</div>
          <input className="lg-input" type="email" value={email} placeholder="you@company.com"
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        {/* password */}
        <div style={{ marginBottom: 22 }}>
          <div className="lg-mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 7 }}>PASSWORD</div>
          <input className="lg-input" type="password" value={password} placeholder="••••••••"
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(255,90,90,0.12)",
            border: `1px solid ${RED}40`, borderRadius: 11, fontSize: 13, color: RED }}>{error}</div>
        )}

        <button className="lg-btn" onClick={handleLogin} disabled={loading}
          style={{ background: loading ? "rgba(255,255,255,0.12)" : "#fff", color: "#08090a",
            cursor: loading ? "not-allowed" : "pointer", marginBottom: 22, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        {/* test accounts */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "13px 13px 9px" }}>
          <div className="lg-mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 8, paddingLeft: 2 }}>TEST ACCOUNTS · CLICK TO FILL</div>
          {ACCOUNTS.map((a, i) => (
            <div key={i} className="lg-acct" onClick={() => { setEmail(a.email); setPassword("password123"); }}>
              <span className="lg-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{a.email}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: a.color,
                background: a.color + "1f", border: `1px solid ${a.color}33`, padding: "2px 9px", borderRadius: 20 }}>{a.role}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 7, paddingLeft: 2 }}>Password · password123</div>
        </div>

        {/* signup */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
          New to Viro?{" "}
          <span onClick={onSignup} style={{ color: "#fff", cursor: "pointer", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>Set up your company →</span>
        </div>
      </div>
    </div>
  );
}
