import { useState } from "react";
import { askAI } from "../api/client";
import { COLORS } from './Layout';

const navItems = [
  { label: "Dashboard", icon: "⬡" },
  { label: "Vehicle Search", icon: "🔍" },
  { label: "Log Defect", icon: "📸" },
  { label: "Analytics", icon: "📊" },
  { label: "Predictive", icon: "⚠️" },
];

export default function Sidebar({ 
  activePage, setActivePage, company, companies, 
  setCompany, stats, onNewReport 
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi — ask me anything about your data. I can also generate reports.",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (question) => {
    if (!question.trim() || loading || !company) return;

    setMessages(prev => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await askAI(question, company.company_id, messages);
      const answer = res.data.answer;
      const data = res.data.data;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: answer,
        data: data?.length > 0 ? data : null,
      }]);

      // If response has data, offer to open as report tab
      if (data?.length > 0 && onNewReport) {
        onNewReport({
          title: question.slice(0, 40) + (question.length > 40 ? "..." : ""),
          data,
          answer,
          sql: res.data.sql,
        });
      }

    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Could not connect. Make sure the backend is running.",
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      width: 230,
      background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
            borderRadius: 10,
            display: "flex", alignItems: "center",
            justifyContent: "center",
            fontSize: 18, fontWeight: 800,
          }}>
            ⬡
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Viro</div>
            <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Manufacturing AI
            </div>
          </div>
        </div>
      </div>

      {/* Company selector */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: 6, paddingLeft: 4 }}>
          COMPANY
        </div>
        <select
          value={company?.company_id || ""}
          onChange={e => {
            const selected = companies.find(c => c.company_id === e.target.value);
            setCompany(selected);
          }}
          style={{
            width: "100%",
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: COLORS.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {companies.map(c => (
            <option key={c.company_id} value={c.company_id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: COLORS.border, marginBottom: 8 }} />

      {/* Nav */}
      <div style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
        {navItems.map(item => {
          const isActive = activePage === item.label;
          return (
            <div
              key={item.label}
              onClick={() => setActivePage(item.label)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                cursor: "pointer", marginBottom: 2,
                background: isActive ? COLORS.accentGlow : "transparent",
                border: isActive ? `1px solid ${COLORS.accent}44` : "1px solid transparent",
                color: isActive ? COLORS.accentLight : COLORS.muted,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: COLORS.border }} />

      {/* Live stats */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
            LIVE STATUS
          </div>
          {[
            { label: "Products", value: stats?.total_products || 0, color: COLORS.text },
            { label: "Unresolved", value: stats?.unresolved || 0, color: COLORS.high },
            { label: "At Risk", value: stats?.at_risk || 0, color: COLORS.critical },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}>
              <span style={{ fontSize: 12, color: COLORS.muted }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: COLORS.border }} />

      {/* AI Panel toggle */}
      <div
        onClick={() => setAiOpen(!aiOpen)}
        style={{
          padding: "14px 20px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: aiOpen ? COLORS.accentGlow : "transparent",
          transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: aiOpen ? COLORS.accentLight : COLORS.muted }}>
            Ask Viro AI
          </span>
        </div>
        <span style={{ fontSize: 12, color: COLORS.muted }}>
          {aiOpen ? "▼" : "▲"}
        </span>
      </div>

      {/* AI Chat Panel */}
      {aiOpen && (
        <div style={{
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex", flexDirection: "column",
          height: 320,
        }}>
          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "85%",
                  background: msg.role === "user"
                    ? `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`
                    : COLORS.card,
                  border: `1px solid ${msg.role === "user" ? "transparent" : COLORS.border}`,
                  borderRadius: msg.role === "user"
                    ? "12px 12px 2px 12px"
                    : "12px 12px 12px 2px",
                  padding: "8px 12px",
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: COLORS.text,
                }}>
                  {msg.role === "assistant" && (
                    <div style={{
                      fontSize: 9, color: COLORS.accentLight,
                      fontWeight: 700, marginBottom: 4,
                      letterSpacing: "0.08em"
                    }}>
                      VIRO AI
                    </div>
                  )}
                  {msg.content}
                  {msg.data && (
                    <div style={{
                      marginTop: 6, fontSize: 10,
                      color: COLORS.accentLight,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                      onClick={() => onNewReport && onNewReport({
                        title: messages[i - 1]?.content?.slice(0, 40) || "Report",
                        data: msg.data,
                        answer: msg.content,
                      })}
                    >
                      📊 Open as report tab →
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px 12px 12px 2px",
                padding: "8px 12px",
                fontSize: 11, color: COLORS.muted,
                alignSelf: "flex-start",
              }}>
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "8px 12px",
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex", gap: 6,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "8px 12px",
                color: COLORS.text,
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading}
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                border: "none", borderRadius: 8,
                padding: "8px 12px",
                color: "white", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 12, opacity: loading ? 0.6 : 1,
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
