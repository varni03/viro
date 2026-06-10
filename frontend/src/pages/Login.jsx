import { useState } from "react";
import { login } from "../api/client";
import { COLORS } from "../components/Layout";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      const { token, user } = res.data;
      localStorage.setItem("viro_token", token);
      localStorage.setItem("viro_user", JSON.stringify(user));
      onLogin(user, token);
    } catch (e) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: "100vh",
      background: COLORS.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        width: 400, height: 400,
        background: COLORS.accent + "15",
        borderRadius: "50%",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: 400,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: 40,
        position: "relative",
      }}>
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
          <div style={{
            fontSize: 26, fontWeight: 800,
            letterSpacing: "-0.02em", color: COLORS.text,
            marginBottom: 4,
          }}>
            Viro
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>
            Manufacturing Intelligence Platform
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, color: COLORS.muted,
            letterSpacing: "0.08em", marginBottom: 6
          }}>
            EMAIL
          </div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="you@company.com"
            style={{
              width: "100%",
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              color: COLORS.text,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: COLORS.muted,
            letterSpacing: "0.08em", marginBottom: 6
          }}>
            PASSWORD
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{
              width: "100%",
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              color: COLORS.text,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16,
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

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: loading
              ? COLORS.border
              : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
            border: "none",
            borderRadius: 12,
            padding: "14px",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            marginBottom: 20,
          }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        {/* Test accounts */}
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "14px 16px",
        }}>
          <div style={{
            fontSize: 10, color: COLORS.muted,
            letterSpacing: "0.08em", marginBottom: 10,
            fontWeight: 700
          }}>
            TEST ACCOUNTS
          </div>
          {[
            { email: "manager@meridianvans.com", role: "Manager", color: COLORS.accentLight },
            { email: "worker@meridianvans.com", role: "Worker", color: COLORS.low },
            { email: "repair@meridianvans.com", role: "Repair", color: COLORS.high },
            ].map((acc, i) => (
            <div
              key={i}
              onClick={() => {
                setEmail(acc.email);
                setPassword("password123");
              }}
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                cursor: "pointer",
                borderBottom: i < 2 ? `1px solid ${COLORS.border}` : "none",
              }}
            >
              <span style={{ fontSize: 12, color: COLORS.muted }}>{acc.email}</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: acc.color,
                background: acc.color + "20",
                padding: "2px 8px", borderRadius: 20,
              }}>
                {acc.role}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
            Password: password123 · Click to autofill
          </div>
        </div>
      </div>
    </div>
  );
}
