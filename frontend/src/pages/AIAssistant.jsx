import { useState } from "react";
import { askAI } from "../api/client";
import { COLORS, Card, PageHeader, Button, Input } from "../components/Layout";

const EXAMPLE_QUESTIONS = [
  "Which stage has the most defects?",
  "How many critical defects are unresolved?",
  "Show me all flagged products",
  "What is the most common defect type?",
  "Which products have more than 3 defects?",
  "What percentage of defects are high severity?",
];

export default function AIAssistant({ company }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi — I'm Viro AI. Ask me anything about your quality data in plain English. I'll query your database and give you a direct answer.",
      data: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (question) => {
    if (!question.trim() || loading) return;

    const userMsg = { role: "user", content: question, data: null };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await askAI(question, company.company_id, history);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.answer,
        data: res.data.data?.length > 0 ? res.data.data : null,
        sql: res.data.sql,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Could not connect to the API. Make sure the backend is running.",
        data: null,
      }]);
    }

    setLoading(false);
  };

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask anything about your quality data in plain English"
      />

      {/* Example questions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {EXAMPLE_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => send(q)}
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: "6px 14px",
              color: COLORS.muted,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{
        flex: 1,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 24,
        overflowY: "auto",
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{ maxWidth: "75%" }}>
              <div style={{
                background: msg.role === "user"
                  ? `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`
                  : COLORS.surface,
                border: `1px solid ${msg.role === "user" ? "transparent" : COLORS.border}`,
                borderRadius: msg.role === "user"
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                padding: "12px 16px",
                fontSize: 13,
                lineHeight: 1.6,
                color: COLORS.text,
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    fontSize: 10, color: COLORS.accentLight,
                    fontWeight: 700, marginBottom: 6,
                    letterSpacing: "0.08em"
                  }}>
                    VIRO AI
                  </div>
                )}
                {msg.content}
              </div>

              {/* Data table */}
              {msg.data && msg.data.length > 0 && (
                <div style={{
                  marginTop: 8,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: COLORS.card }}>
                          {Object.keys(msg.data[0]).map(col => (
                            <th key={col} style={{
                              padding: "8px 12px",
                              textAlign: "left",
                              color: COLORS.muted,
                              fontWeight: 600,
                              fontSize: 11,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.data.slice(0, 10).map((row, ri) => (
                          <tr key={ri} style={{
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}>
                            {Object.values(row).map((val, vi) => (
                              <td key={vi} style={{
                                padding: "8px 12px",
                                color: COLORS.text,
                                fontSize: 12,
                              }}>
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {msg.data.length > 10 && (
                    <div style={{
                      padding: "8px 12px",
                      color: COLORS.muted,
                      fontSize: 11,
                      borderTop: `1px solid ${COLORS.border}`,
                    }}>
                      Showing 10 of {msg.data.length} results
                    </div>
                  )}
                </div>
              )}

              {/* SQL */}
              {msg.sql && (
                <div style={{
                  marginTop: 6,
                  padding: "6px 12px",
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: COLORS.muted,
                  fontFamily: "monospace",
                }}>
                  {msg.sql}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "16px 16px 16px 4px",
              padding: "12px 16px",
              color: COLORS.muted,
              fontSize: 13,
            }}>
              <div style={{
                fontSize: 10, color: COLORS.accentLight,
                fontWeight: 700, marginBottom: 6,
                letterSpacing: "0.08em"
              }}>
                VIRO AI
              </div>
              Querying your data...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 12 }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Viro anything about your data..."
          style={{
            flex: 1,
            onKeyDown: e => e.key === "Enter" && send(input)
          }}
        />
        <button
          onClick={() => send(input)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          disabled={loading}
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            color: "white",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            opacity: loading ? 0.6 : 1,
          }}
        >
          Ask →
        </button>
      </div>
    </div>
  );
}
