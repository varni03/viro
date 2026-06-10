import { useState, useEffect } from "react";
import { COLORS, Card, PageHeader, SectionLabel, Input, Button } from "../components/Layout";

const API = "http://localhost:8000";

export default function Settings({ company, user, onCompanyUpdate }) {
  const [activeTab, setActiveTab] = useState("stages");
  const [stages, setStages] = useState([]);
  const [defectTypes, setDefectTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // New stage form
  const [newStage, setNewStage] = useState({ stage_number: "", stage_name: "", expected_duration_mins: "" });

  // New defect type form
  const [newDefectType, setNewDefectType] = useState({ name: "", default_severity: "medium" });

  // New user form
  const [newUser, setNewUser] = useState({ email: "", password: "", first_name: "", last_name: "", role: "worker" });

  // Company profile
  const [companyProfile, setCompanyProfile] = useState({
    name: company?.name || "",
    industry: company?.industry || "",
    universal_id_field: company?.universal_id_field || "product_id",
  });

  const [connectors, setConnectors] = useState([]);
const [terminology, setTerminology] = useState({
    term_product: "Product",
    term_defect: "Defect",
    term_stage: "Stage",
    term_issue: "Issue",
});
const [newConnector, setNewConnector] = useState({
    connector_name: "",
    connector_type: "csv",
    sync_schedule: "manual",
});
const [uploadFile, setUploadFile] = useState(null);
const [filePreview, setFilePreview] = useState(null);
const [columnMapping, setColumnMapping] = useState({
    product_id_col: "",
    stage_col: "",
    status_col: "",
    issue_type_col: "",
    severity_col: "",
    logged_at_col: "",
});
const [syncing, setSyncing] = useState(false);
const [selectedConnector, setSelectedConnector] = useState(null);


const load = async () => {
    setLoading(true);
    try {
      const [stageRes, defectRes, userRes, connectorRes, configRes] = await Promise.all([
        fetch(`${API}/stages/${company.company_id}`).then(r => r.json()),
        fetch(`${API}/settings/defect-types/${company.company_id}`).then(r => r.json()),
        fetch(`${API}/settings/users/${company.company_id}`).then(r => r.json()),
        fetch(`${API}/connectors/${company.company_id}`).then(r => r.json()),
        fetch(`${API}/config/${company.company_id}`).then(r => r.json()),
      ]);
      setStages(stageRes);
      setDefectTypes(defectRes);
      setUsers(userRes);
      setConnectors(connectorRes);
      setTerminology(configRes);
    } catch {}
    setLoading(false);
};


  useEffect(() => { load(); }, [company]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // Stage actions
  const addStage = async () => {
    if (!newStage.stage_number || !newStage.stage_name) return showError("Stage number and name required");
    try {
      await fetch(`${API}/settings/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStage, company_id: company.company_id })
      });
      setNewStage({ stage_number: "", stage_name: "", expected_duration_mins: "" });
      load();
      showSuccess("Stage added successfully");
    } catch { showError("Failed to add stage"); }
  };

  const deleteStage = async (stageId) => {
    try {
      await fetch(`${API}/settings/stages/${stageId}`, { method: "DELETE" });
      load();
      showSuccess("Stage deleted");
    } catch { showError("Failed to delete stage"); }
  };

  // Defect type actions
  const addDefectType = async () => {
    if (!newDefectType.name) return showError("Defect type name required");
    try {
      await fetch(`${API}/settings/defect-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newDefectType, company_id: company.company_id })
      });
      setNewDefectType({ name: "", default_severity: "medium" });
      load();
      showSuccess("Defect type added");
    } catch { showError("Failed to add defect type"); }
  };

  const deleteDefectType = async (typeId) => {
    try {
      await fetch(`${API}/settings/defect-types/${typeId}`, { method: "DELETE" });
      load();
      showSuccess("Defect type deleted");
    } catch { showError("Failed to delete"); }
  };

  // User actions
  const addUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name) {
      return showError("All user fields required");
    }
    try {
      await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, company_id: company.company_id })
      });
      setNewUser({ email: "", password: "", first_name: "", last_name: "", role: "worker" });
      load();
      showSuccess("User created successfully");
    } catch { showError("Failed to create user"); }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await fetch(`${API}/settings/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      load();
      showSuccess("Role updated");
    } catch { showError("Failed to update role"); }
  };

  const deactivateUser = async (userId) => {
    try {
      await fetch(`${API}/settings/users/${userId}/deactivate`, { method: "PUT" });
      load();
      showSuccess("User deactivated");
    } catch { showError("Failed to deactivate user"); }
  };

  // Company profile
  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/settings/company/${company.company_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyProfile)
      });
      showSuccess("Company profile updated");
      if (onCompanyUpdate) onCompanyUpdate(companyProfile);
    } catch { showError("Failed to save profile"); }
    setSaving(false);
  };

  const tabs = [
    { id: "stages", label: "🏭 Stages" },
    { id: "defects", label: "⚠️ Defect Types" },
    { id: "users", label: "👥 Users" },
    { id: "connectors", label: "🔌 Connectors" },
    { id: "terminology", label: "🏷️ Terminology" },
    { id: "company", label: "🏢 Company Profile" },
];
  

  const roleColor = (r) => ({
    manager: COLORS.accentLight,
    worker: COLORS.low,
    repair: COLORS.high,
    admin: COLORS.critical,
  }[r] || COLORS.muted);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: COLORS.muted }}>
      Loading settings...
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle={`Configure ${company.name}'s Viro platform`}
      />

      {/* Success / Error */}
      {success && (
        <div style={{
          marginBottom: 16, padding: "12px 16px",
          background: COLORS.low + "20", border: `1px solid ${COLORS.low}40`,
          borderRadius: 10, color: COLORS.low, fontSize: 13,
        }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{
          marginBottom: 16, padding: "12px 16px",
          background: COLORS.critical + "20", border: `1px solid ${COLORS.critical}40`,
          borderRadius: 10, color: COLORS.critical, fontSize: 13,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              padding: "10px 16px",
              color: activeTab === tab.id ? COLORS.accentLight : COLORS.muted,
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer", marginBottom: -1,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONNECTORS TAB */}
{activeTab === "connectors" && (
  <div>
    <SectionLabel>Connected Data Sources</SectionLabel>

    {/* Existing connectors */}
    {connectors.length === 0 ? (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>
          No connectors yet — add one below to import data from any source
        </div>
      </Card>
    ) : (
      connectors.map((connector, i) => (
        <div key={i} style={{
          background: COLORS.card,
          border: `1px solid ${selectedConnector?.connector_id === connector.connector_id
            ? COLORS.accent + "55" : COLORS.border}`,
          borderRadius: 14, padding: "16px 20px",
          marginBottom: 8,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
          onClick={() => setSelectedConnector(
            selectedConnector?.connector_id === connector.connector_id ? null : connector
          )}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40,
              background: COLORS.accentGlow,
              border: `1px solid ${COLORS.accent}44`,
              borderRadius: 8,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20,
            }}>
              {connector.connector_type === "csv" ? "📄" :
               connector.connector_type === "excel" ? "📊" :
               connector.connector_type === "postgresql" ? "🐘" :
               connector.connector_type === "snowflake" ? "❄️" :
               connector.connector_type === "salesforce" ? "☁️" : "🔌"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
                {connector.connector_name}
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>
                {connector.connector_type.toUpperCase()} ·
                Sync: {connector.sync_schedule} ·
                {connector.last_sync
                  ? ` Last synced: ${new Date(connector.last_sync).toLocaleString()}`
                  : " Never synced"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{
              background: connector.is_active ? COLORS.low + "20" : COLORS.muted + "20",
              color: connector.is_active ? COLORS.low : COLORS.muted,
              border: `1px solid ${connector.is_active ? COLORS.low + "40" : COLORS.muted + "40"}`,
              borderRadius: 20, padding: "3px 10px",
              fontSize: 11, fontWeight: 600,
            }}>
              {connector.is_active ? "Active" : "Inactive"}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                fetch(`${API}/connectors/${connector.connector_id}`, { method: "DELETE" })
                  .then(() => { load(); showSuccess("Connector deleted"); });
              }}
              style={{
                background: COLORS.critical + "20",
                border: `1px solid ${COLORS.critical}40`,
                borderRadius: 8, padding: "4px 10px",
                color: COLORS.critical, fontSize: 11, cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))
    )}

    {/* File upload sync panel */}
    {selectedConnector && (selectedConnector.connector_type === "csv" || selectedConnector.connector_type === "excel") && (
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Sync Data — {selectedConnector.connector_name}</SectionLabel>

        {/* File upload */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>UPLOAD FILE</div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              setUploadFile(file);
              setFilePreview(null);
              setColumnMapping({
                product_id_col: "", stage_col: "", status_col: "",
                issue_type_col: "", severity_col: "", logged_at_col: ""
              });

              const formData = new FormData();
              formData.append("file", file);

              try {
                const res = await fetch(
                  `${API}/connectors/${selectedConnector.connector_id}/upload?company_id=${company.company_id}`,
                  { method: "POST", body: formData }
                ).then(r => r.json());
                setFilePreview(res);
              } catch { showError("Failed to read file"); }
            }}
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10, padding: "10px 14px",
              color: COLORS.text, fontSize: 13,
              cursor: "pointer", width: "100%",
            }}
          />
        </div>

        {/* Column preview */}
        {filePreview && (
          <div>
            <div style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10, padding: "12px 16px",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>
                📄 {filePreview.filename} · {filePreview.total_rows} rows · {filePreview.columns.length} columns
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {filePreview.columns.map(col => (
                  <span key={col} style={{
                    background: COLORS.accentGlow,
                    border: `1px solid ${COLORS.accent}33`,
                    borderRadius: 6, padding: "2px 10px",
                    fontSize: 11, color: COLORS.accentLight,
                  }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Column mapping */}
            <SectionLabel>Map Your Columns to Viro Fields</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { key: "product_id_col", label: "Product ID *", required: true },
                { key: "stage_col", label: "Stage Number" },
                { key: "status_col", label: "Status" },
                { key: "issue_type_col", label: "Issue / Defect Type" },
                { key: "severity_col", label: "Severity" },
                { key: "logged_at_col", label: "Date Logged" },
              ].map(field => (
                <div key={field.key}>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
                    {field.label}
                  </div>
                  <select
                    value={columnMapping[field.key]}
                    onChange={e => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      width: "100%",
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10, padding: "10px 14px",
                      color: COLORS.text, fontSize: 13,
                      outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">— Skip this field —</option>
                    {filePreview.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10, overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: COLORS.muted, padding: "8px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                DATA PREVIEW — First 3 rows
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: COLORS.card }}>
                      {filePreview.columns.slice(0, 6).map(col => (
                        <th key={col} style={{
                          padding: "8px 12px", textAlign: "left",
                          color: COLORS.muted, fontSize: 10,
                          fontWeight: 600, letterSpacing: "0.06em",
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filePreview.preview.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        {filePreview.columns.slice(0, 6).map(col => (
                          <td key={col} style={{ padding: "8px 12px", color: COLORS.text, fontSize: 12 }}>
                            {String(row[col] ?? "").slice(0, 20)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sync button */}
            <button
              onClick={async () => {
                if (!columnMapping.product_id_col) return showError("Product ID column is required");
                setSyncing(true);
                const formData = new FormData();
                formData.append("file", uploadFile);

                const params = new URLSearchParams({
                  company_id: company.company_id,
                  ...columnMapping,
                });

                try {
                  const res = await fetch(
                    `${API}/connectors/${selectedConnector.connector_id}/sync?${params}`,
                    { method: "POST", body: formData }
                  ).then(r => r.json());
                  showSuccess(`Synced ${res.imported} records successfully`);
                  setFilePreview(null);
                  setUploadFile(null);
                  load();
                } catch { showError("Sync failed"); }
                setSyncing(false);
              }}
              disabled={syncing}
              style={{
                background: syncing ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                border: "none", borderRadius: 10,
                padding: "12px 24px", color: "white",
                fontSize: 13, fontWeight: 700,
                cursor: syncing ? "not-allowed" : "pointer",
              }}
            >
              {syncing ? "Syncing..." : `⚡ Sync ${filePreview.total_rows} Records into Viro`}
            </button>
          </div>
        )}
      </Card>
    )}

    {/* Add new connector */}
    <SectionLabel>Add Data Source</SectionLabel>
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>CONNECTOR NAME</div>
          <Input
            value={newConnector.connector_name}
            onChange={e => setNewConnector(prev => ({ ...prev, connector_name: e.target.value }))}
            placeholder="e.g. Weekly Defect Export"
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>TYPE</div>
          <select
            value={newConnector.connector_type}
            onChange={e => setNewConnector(prev => ({ ...prev, connector_type: e.target.value }))}
            style={{
              width: "100%",
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10, padding: "12px 14px",
              color: COLORS.text, fontSize: 13,
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="csv">CSV File</option>
            <option value="excel">Excel File</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="snowflake">Snowflake</option>
            <option value="salesforce">Salesforce</option>
            <option value="mysql">MySQL</option>
            <option value="mssql">Microsoft SQL</option>
            <option value="api">Custom API</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>SYNC SCHEDULE</div>
          <select
            value={newConnector.sync_schedule}
            onChange={e => setNewConnector(prev => ({ ...prev, sync_schedule: e.target.value }))}
            style={{
              width: "100%",
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10, padding: "12px 14px",
              color: COLORS.text, fontSize: 13,
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="manual">Manual</option>
            <option value="hourly">Every Hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* Info for non-file connectors */}
      {!["csv", "excel"].includes(newConnector.connector_type) && (
        <div style={{
          background: COLORS.accentGlow,
          border: `1px solid ${COLORS.accent}33`,
          borderRadius: 10, padding: "12px 16px",
          marginBottom: 16, fontSize: 12,
          color: COLORS.accentLight,
        }}>
          💡 {newConnector.connector_type === "snowflake" && "Snowflake connector — you'll need your account identifier, warehouse, database, and credentials."}
          {newConnector.connector_type === "postgresql" && "PostgreSQL connector — you'll need host, port, database name, and credentials."}
          {newConnector.connector_type === "salesforce" && "Salesforce connector — you'll need your instance URL and OAuth credentials."}
          {newConnector.connector_type === "mysql" && "MySQL connector — you'll need host, database name, and credentials."}
          {newConnector.connector_type === "mssql" && "Microsoft SQL Server connector — you'll need server address and credentials."}
          {newConnector.connector_type === "api" && "Custom API connector — you'll need the endpoint URL and authentication details."}
          {" "}Connection configuration coming in the next release. Create it now and configure later.
        </div>
      )}

      <button
        onClick={async () => {
          if (!newConnector.connector_name) return showError("Connector name required");
          try {
            await fetch(`${API}/connectors`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...newConnector, company_id: company.company_id })
            });
            setNewConnector({ connector_name: "", connector_type: "csv", sync_schedule: "manual" });
            load();
            showSuccess("Connector added");
          } catch { showError("Failed to add connector"); }
        }}
        style={{
          background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
          border: "none", borderRadius: 10,
          padding: "10px 20px", color: "white",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}
      >
        + Add Connector
      </button>
    </Card>
  </div>
)}

{/* TERMINOLOGY TAB */}
{activeTab === "terminology" && (
  <div>
    <SectionLabel>Customize Terminology</SectionLabel>
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20, lineHeight: 1.6 }}>
        Change how Viro refers to things in your platform. These labels appear throughout the app — on buttons, tables, and in the AI assistant. Your data is never affected, only the display labels change.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { key: "term_product", label: "Product / Item", placeholder: "e.g. Vehicle, RFQ, Batch, Order", example: "Meridian Vans: Vehicle · Tidewater: RFQ · FreshPack: Batch" },
          { key: "term_defect", label: "Defect / Issue", placeholder: "e.g. Defect, Issue, Delay, Incident", example: "Manufacturing: Defect · Shipping: Delay · Healthcare: Incident" },
          { key: "term_stage", label: "Stage / Step", placeholder: "e.g. Stage, Station, Phase, Step", example: "Factory: Station · Logistics: Phase · Consulting: Step" },
          { key: "term_issue", label: "Issue / Problem", placeholder: "e.g. Issue, Problem, Finding, Flag", example: "Quality: Finding · Operations: Flag · Service: Problem" },
        ].map(field => (
          <div key={field.key}>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>
              {field.label.toUpperCase()}
            </div>
            <Input
              value={terminology[field.key] || ""}
              onChange={e => setTerminology(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4 }}>
              {field.example}
            </div>
          </div>
        ))}
      </div>
    </Card>

    {/* Preview */}
    <SectionLabel>Preview</SectionLabel>
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>
        This is how your platform will refer to things:
      </div>
      {[
        { label: "Main item tracked", value: terminology.term_product || "Product" },
        { label: "Quality issue logged", value: terminology.term_defect || "Defect" },
        { label: "Workflow step", value: terminology.term_stage || "Stage" },
        { label: "Problem flagged", value: terminology.term_issue || "Issue" },
      ].map((item, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between",
          padding: "10px 0",
          borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none",
        }}>
          <span style={{ fontSize: 13, color: COLORS.muted }}>{item.label}</span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: COLORS.accentLight,
            background: COLORS.accentGlow,
            border: `1px solid ${COLORS.accent}33`,
            borderRadius: 6, padding: "2px 12px",
          }}>
            {item.value}
          </span>
        </div>
      ))}
    </Card>

    <button
      onClick={async () => {
        setSaving(true);
        try {
          await fetch(`${API}/config/${company.company_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(terminology)
          });
          showSuccess("Terminology saved — refresh to see changes throughout the app");
        } catch { showError("Failed to save terminology"); }
        setSaving(false);
      }}
      disabled={saving}
      style={{
        background: saving ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
        border: "none", borderRadius: 10,
        padding: "12px 24px", color: "white",
        fontSize: 13, fontWeight: 700,
        cursor: saving ? "not-allowed" : "pointer",
      }}
    >
      {saving ? "Saving..." : "Save Terminology"}
    </button>
  </div>
)}


      {/* STAGES TAB */}
      {activeTab === "stages" && (
        <div>
          <SectionLabel>Production Stages</SectionLabel>
          <Card style={{ marginBottom: 16 }}>
            {stages.length === 0 ? (
              <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>
                No stages configured yet
              </div>
            ) : (
              stages.map((stage, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < stages.length - 1 ? `1px solid ${COLORS.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 40, height: 40,
                      background: COLORS.accentGlow,
                      border: `1px solid ${COLORS.accent}44`,
                      borderRadius: 8,
                      display: "flex", alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      color: COLORS.accentLight,
                    }}>
                      {stage.stage_number}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                        {stage.stage_name}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>
                        {stage.expected_duration_mins} min expected
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteStage(stage.stage_id)}
                    style={{
                      background: COLORS.critical + "20",
                      border: `1px solid ${COLORS.critical}40`,
                      borderRadius: 8, padding: "6px 12px",
                      color: COLORS.critical, fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </Card>

          <SectionLabel>Add New Stage</SectionLabel>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>STAGE NUMBER</div>
                <Input
                  value={newStage.stage_number}
                  onChange={e => setNewStage(prev => ({ ...prev, stage_number: e.target.value }))}
                  placeholder="e.g. 110"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>STAGE NAME</div>
                <Input
                  value={newStage.stage_name}
                  onChange={e => setNewStage(prev => ({ ...prev, stage_name: e.target.value }))}
                  placeholder="e.g. Entry - In The Door"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>DURATION (MIN)</div>
                <Input
                  value={newStage.expected_duration_mins}
                  onChange={e => setNewStage(prev => ({ ...prev, expected_duration_mins: e.target.value }))}
                  placeholder="e.g. 30"
                />
              </div>
            </div>
            <button
              onClick={addStage}
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                border: "none", borderRadius: 10,
                padding: "10px 20px", color: "white",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Add Stage
            </button>
          </Card>
        </div>
      )}

      {/* DEFECT TYPES TAB */}
      {activeTab === "defects" && (
        <div>
          <SectionLabel>Defect Types</SectionLabel>
          <Card style={{ marginBottom: 16 }}>
            {defectTypes.length === 0 ? (
              <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>
                No custom defect types — using defaults
              </div>
            ) : (
              defectTypes.map((type, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < defectTypes.length - 1 ? `1px solid ${COLORS.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, textTransform: "capitalize" }}>
                      {type.name.replace(/_/g, " ")}
                    </div>
                    <span style={{
                      background: COLORS.medium + "20",
                      color: COLORS.medium,
                      border: `1px solid ${COLORS.medium}40`,
                      borderRadius: 20, padding: "2px 10px",
                      fontSize: 11, fontWeight: 600,
                    }}>
                      Default: {type.default_severity}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteDefectType(type.id)}
                    style={{
                      background: COLORS.critical + "20",
                      border: `1px solid ${COLORS.critical}40`,
                      borderRadius: 8, padding: "6px 12px",
                      color: COLORS.critical, fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </Card>

          <SectionLabel>Add Defect Type</SectionLabel>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>DEFECT TYPE NAME</div>
                <Input
                  value={newDefectType.name}
                  onChange={e => setNewDefectType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. brake_fluid_leak"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>DEFAULT SEVERITY</div>
                <select
                  value={newDefectType.default_severity}
                  onChange={e => setNewDefectType(prev => ({ ...prev, default_severity: e.target.value }))}
                  style={{
                    width: "100%",
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10, padding: "12px 16px",
                    color: COLORS.text, fontSize: 14,
                    outline: "none", cursor: "pointer",
                  }}
                >
                  {["low", "medium", "high", "critical"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addDefectType}
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                border: "none", borderRadius: 10,
                padding: "10px 20px", color: "white",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Add Defect Type
            </button>
          </Card>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div>
          <SectionLabel>Team Members</SectionLabel>
          <Card style={{ marginBottom: 16 }}>
            {users.length === 0 ? (
              <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>No users found</div>
            ) : (
              users.map((u, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < users.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  opacity: u.is_active === 0 ? 0.5 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36,
                      background: COLORS.accentGlow,
                      border: `1px solid ${COLORS.accent}44`,
                      borderRadius: 8,
                      display: "flex", alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14, fontWeight: 700,
                      color: COLORS.accentLight,
                    }}>
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                        {u.first_name} {u.last_name}
                        {u.is_active === 0 && (
                          <span style={{ color: COLORS.muted, fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                            (inactive)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{u.email}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Role selector */}
                    {u.user_id !== user?.user_id && (
                      <select
                        value={u.role}
                        onChange={e => updateUserRole(u.user_id, e.target.value)}
                        style={{
                          background: roleColor(u.role) + "20",
                          border: `1px solid ${roleColor(u.role)}44`,
                          borderRadius: 8, padding: "4px 10px",
                          color: roleColor(u.role),
                          fontSize: 12, fontWeight: 600,
                          cursor: "pointer", outline: "none",
                        }}
                      >
                        {["worker", "repair", "manager", "admin"].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}

                    {u.user_id === user?.user_id && (
                      <span style={{
                        background: roleColor(u.role) + "20",
                        color: roleColor(u.role),
                        border: `1px solid ${roleColor(u.role)}44`,
                        borderRadius: 8, padding: "4px 10px",
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {u.role} (you)
                      </span>
                    )}

                    {u.user_id !== user?.user_id && u.is_active !== 0 && (
                      <button
                        onClick={() => deactivateUser(u.user_id)}
                        style={{
                          background: COLORS.critical + "20",
                          border: `1px solid ${COLORS.critical}40`,
                          borderRadius: 8, padding: "4px 12px",
                          color: COLORS.critical, fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>

          <SectionLabel>Add Team Member</SectionLabel>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>FIRST NAME</div>
                <Input
                  value={newUser.first_name}
                  onChange={e => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>LAST NAME</div>
                <Input
                  value={newUser.last_name}
                  onChange={e => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>EMAIL</div>
                <Input
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>PASSWORD</div>
                <Input
                  value={newUser.password}
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>ROLE</div>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    width: "100%",
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10, padding: "12px 16px",
                    color: COLORS.text, fontSize: 14,
                    outline: "none", cursor: "pointer",
                  }}
                >
                  {["worker", "repair", "manager"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addUser}
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                border: "none", borderRadius: 10,
                padding: "10px 20px", color: "white",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Add Team Member
            </button>
          </Card>
        </div>
      )}

      {/* COMPANY PROFILE TAB */}
      {activeTab === "company" && (
        <div>
          <SectionLabel>Company Profile</SectionLabel>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>COMPANY NAME</div>
                <Input
                  value={companyProfile.name}
                  onChange={e => setCompanyProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>INDUSTRY</div>
                <Input
                  value={companyProfile.industry}
                  onChange={e => setCompanyProfile(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g. Automotive, Medical Devices"
                />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>UNIVERSAL ID FIELD NAME</div>
              <Input
                value={companyProfile.universal_id_field}
                onChange={e => setCompanyProfile(prev => ({ ...prev, universal_id_field: e.target.value }))}
                placeholder="e.g. vin, serial_number, batch_number"
              />
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
                This is what your product identifier is called — VIN for vehicles, batch number for food, serial number for medical devices
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                background: saving ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
                border: "none", borderRadius: 10,
                padding: "12px 24px", color: "white",
                fontSize: 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
