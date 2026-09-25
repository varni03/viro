import { useState, useRef, useEffect } from "react";
import { askAI } from "../api/client";
import { COLORS } from "./Layout";

const API = "https://viro1.vercel.app";

const SUGGESTIONS = [
  "Focus the dashboard on critical defects",
  "Pie chart of defects by type",
  "Defects logged per day as a line chart",
  "Which stage has the most defects?",
  "What's blocking shipping today?",
  "Best practices for reducing defects?",
];

export default function AIPanel({ company, onNewReport, activePage, onFilterChange, currentFilters, prefs, onPrefsChange: setPrefs, onReshape, currentConfig, hasEntities, onEntityReshaped, pendingAsk }) {
    const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi, I'm your AI assistant. Tell me to rebuild the dashboard (like "focus on critical defects" or "show resolution trends") and the screen reshapes live. Or just ask a question and I'll answer here.`,
      data: null,
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const hasActiveFilters = currentFilters && (
    currentFilters.stages?.length > 0 ||
    currentFilters.severities?.length > 0 ||
    currentFilters.status ||
    currentFilters.defect_type ||
    currentFilters.product_id
  );

  const resetFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        stages: [], severities: [], status: null,
        defect_type: null, product_id: null,
        date_from: null, date_to: null
      });
    }
  };

  // Live dashboard reshape: rebuilds the Dashboard config from a request.
  // Returns true if it handled the message (a reshape), false to fall through.
  const tryReshape = async (question) => {
    // Generative (entity) companies reshape their AI-designed entity dashboard;
    // legacy companies reshape the SQL/config dashboard.
    const url = hasEntities
      ? `${API}/entities/dashboard/${company.company_id}/reshape`
      : `${API}/ai/reshape-dashboard`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.company_id,
          instruction: question,
          current_config: hasEntities ? {} : currentConfig,
        }),
      }).then(r => r.json());
      if (res.is_reshape && res.config) {
        if (hasEntities) { if (onEntityReshaped) onEntityReshaped(); }
        else if (onReshape) onReshape(res.config);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `✅ ${res.message}\n\nThe dashboard has been rebuilt to match.`,
          data: null,
          isFilterChange: true,
        }]);
        return true;
      }
    } catch {
      // fall through to the normal Q&A path
    }
    return false;
  };

  // Questions handed over from the omnibar ("Ask Viro: …").
  useEffect(() => {
    if (pendingAsk && pendingAsk.q) send(pendingAsk.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAsk?.ts]);

  const send = async (question) => {
    if (!question.trim() || loading || !company) return;

    setMessages(prev => [...prev, { role: "user", content: question, data: null }]);
    setInput("");
    setLoading(true);

    try {
        // First check if this is a platform command
        const commandRes = await fetch(`${API}/ai/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            company_id: company.company_id,
            current_prefs: prefs || {},
            current_modules: [],
          })
        }).then(r => r.json());
  
        if (commandRes.type === "display") {
          const newPrefs = { ...prefs, ...commandRes.changes };
          setPrefs && setPrefs(newPrefs);
          // Save to backend
          await fetch(`${API}/prefs/${company.company_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPrefs)
          });
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `✅ ${commandRes.message}`,
            data: null,
            isCommand: true,
          }]);
  
        } else if (commandRes.type === "filter") {
          if (onFilterChange) {
            onFilterChange(prev => ({
              ...prev,
              severities: commandRes.default_severity_filter === "all"
                ? [] : [commandRes.default_severity_filter]
            }));
          }
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `✅ ${commandRes.message}`,
            data: null,
            isCommand: true,
          }]);
  
        } else if (commandRes.type === "module") {
          // Toggle module
          await fetch(`${API}/modules/${company.company_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modules: [{ id: commandRes.module_id, enabled: commandRes.enabled,
                custom_label: commandRes.module_id, custom_icon: "" }]
            })
          });
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `✅ ${commandRes.message} (refresh the page to see the change)`,
            data: null,
            isCommand: true,
          }]);
  
        } else if (onReshape && currentConfig && activePage === "Dashboard" &&
                   await tryReshape(question)) {
          // handled by tryReshape (rebuilt the dashboard live)
        } else {
          // Check if filter change
          const filterRes = await fetch(`${API}/ai/interpret-filters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: question,
              company_id: company.company_id,
              current_filters: currentFilters || {},
            })
          }).then(r => r.json());
  
          if (filterRes.is_filter_change && onFilterChange) {
            onFilterChange(filterRes.filters);
            setMessages(prev => [...prev, {
              role: "assistant",
              content: `✅ ${filterRes.message}\n\nThe dashboard has been updated to show your filtered view.`,
              data: null,
              isFilterChange: true,
            }]);
          } else {
            // Regular question
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await askAI(question, company.company_id, history);
            const answer = res.data.answer;
            const data = res.data.data;
  
            setMessages(prev => [...prev, {
              role: "assistant",
              content: answer,
              data: data?.length > 0 ? data : null,
              sql: res.data.sql,
            }]);
  
            if (data?.length > 0 && onNewReport) {
              onNewReport({
                title: question.slice(0, 50),
                data,
                answer,
                sql: res.data.sql,
              });
            }
          }
        }
  
      } catch {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Could not connect to backend. Make sure it is running.",
          data: null,
        }]);
      }
      setLoading(false);
  
  };

  return (
    <div style={{
      width: 380,
      background: "rgba(255,255,255,0.02)",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      flexShrink: 0,
    }}>

      {/* Header */}
      <div style={{
        padding: "20px 20px 14px",
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.1)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16,
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{company?.name} AI</div>
            <div style={{ fontSize: 10, color: COLORS.low, letterSpacing: "0.06em" }}>
              ● LIVE · Data + Web
            </div>
          </div>
          <button
            onClick={() => setMessages([{
              role: "assistant",
              content: "Chat cleared. Ask me anything about your data or tell me how to filter the dashboard.",
              data: null,
            }])}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "4px 10px",
              color: COLORS.muted,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {/* Context + filter status */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: COLORS.accentGlow,
            border: `1px solid ${COLORS.accent}33`,
            borderRadius: 20, padding: "4px 12px",
            fontSize: 11, color: COLORS.accentLight,
          }}>
            <span>📍</span>
            <span>{company?.name} · {activePage}</span>
          </div>

          {hasActiveFilters && (
            <div
              onClick={resetFilters}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: COLORS.high + "20",
                border: `1px solid ${COLORS.high}44`,
                borderRadius: 20, padding: "4px 12px",
                fontSize: 11, color: COLORS.high,
                cursor: "pointer",
              }}
            >
              ⚡ Filters active · Reset
            </div>
          )}
        </div>
      </div>

      {/* Quick suggestions */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10, color: COLORS.muted,
          letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600
        }}>
          QUICK ACTIONS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20, padding: "4px 10px",
                color: COLORS.muted, fontSize: 11,
                cursor: "pointer", transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{ maxWidth: "88%" }}>
              <div style={{
                background: msg.role === "user"
                  ? "rgba(255,255,255,0.12)"
                  : msg.isFilterChange
                  ? COLORS.low + "20"
                  : COLORS.card,
                border: `1px solid ${
                  msg.role === "user" ? "transparent"
                  : msg.isFilterChange ? COLORS.low + "44"
                  : COLORS.border
                }`,
                borderRadius: msg.role === "user"
                  ? "14px 14px 2px 14px"
                  : "14px 14px 14px 2px",
                padding: "10px 14px",
                fontSize: 12,
                lineHeight: 1.6,
                color: msg.isFilterChange ? COLORS.low : COLORS.text,
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    fontSize: 9,
                    color: msg.isFilterChange ? COLORS.low : COLORS.accentLight,
                    fontWeight: 700, marginBottom: 5,
                    letterSpacing: "0.08em"
                  }}>
                    {msg.isFilterChange ? "DASHBOARD UPDATED" : `${company?.name?.toUpperCase()} AI`}
                  </div>
                )}
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              </div>

              {/* Data preview */}
              {msg.data && msg.data.length > 0 && (
                <div style={{
                  marginTop: 8,
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10, overflow: "hidden",
                }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: COLORS.card }}>
                          {Object.keys(msg.data[0]).slice(0, 4).map(col => (
                            <th key={col} style={{
                              padding: "6px 10px", textAlign: "left",
                              color: COLORS.muted, fontSize: 10,
                              fontWeight: 600, letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.data.slice(0, 5).map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            {Object.values(row).slice(0, 4).map((val, vi) => (
                              <td key={vi} style={{
                                padding: "6px 10px",
                                color: COLORS.text, fontSize: 11,
                              }}>
                                {String(val).slice(0, 20)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => onNewReport && onNewReport({
                      title: messages[i - 1]?.content?.slice(0, 50) || "AI Report",
                      data: msg.data,
                      answer: msg.content,
                      sql: msg.sql,
                    })}
                    style={{
                      width: "100%",
                      background: COLORS.accentGlow,
                      border: "none",
                      borderTop: `1px solid ${COLORS.border}`,
                      padding: "8px",
                      color: COLORS.accentLight,
                      fontSize: 11, fontWeight: 600,
                      cursor: "pointer", textAlign: "center",
                    }}
                  >
                    📊 Open as report tab →
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px 14px 14px 2px",
            padding: "10px 14px",
            alignSelf: "flex-start",
          }}>
            <div style={{
              fontSize: 9, color: COLORS.accentLight,
              fontWeight: 700, marginBottom: 4,
              letterSpacing: "0.08em"
            }}>
              VIRO AI
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: COLORS.accentLight,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input)}
            placeholder="Ask or filter the dashboard..."
            style={{
              flex: 1,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "10px 14px",
              color: COLORS.text,
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none", borderRadius: 10,
              padding: "10px 16px",
              color: "#08090a", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, opacity: loading ? 0.6 : 1,
            }}
          >
            →
          </button>
        </div>
        <div style={{
          marginTop: 8, fontSize: 10,
          color: COLORS.muted, textAlign: "center"
        }}>
          Connected to {company?.name} data + web search
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
