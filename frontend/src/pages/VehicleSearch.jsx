import { useState } from "react";
import { getProducts, getDefects } from "../api/client";
import { COLORS, Card, PageHeader, SectionLabel, Badge, Input, severityColor } from "../components/Layout";

export default function VehicleSearch({ company }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelectedProduct(null);
    setDefects([]);

    try {
      const res = await getProducts(company.company_id);
      const filtered = res.data.filter(p =>
        p.product_id.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const selectProduct = async (product) => {
    setSelectedProduct(product);
    try {
      const res = await getDefects(company.company_id, product.product_id);
      setDefects(res.data);
    } catch {
      setDefects([]);
    }
  };

  const statusColor = (s) => ({
    completed: COLORS.low,
    in_progress: COLORS.accentLight,
    on_hold: COLORS.medium,
    flagged: COLORS.critical,
  }[s] || COLORS.muted);

  return (
    <div>
      <PageHeader
        title="Vehicle Search"
        subtitle={`Search by ${company.universal_id_field?.toUpperCase() || "Product ID"}`}
      />

      {/* Search bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Enter ${company.universal_id_field || "product ID"}...`}
          style={{ flex: 1 }}
        />
        <button
          onClick={search}
          onKeyDown={e => e.key === "Enter" && search()}
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, #4f46e5)`,
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Search
        </button>
      </div>

      {loading && (
        <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>
          Searching...
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div style={{ display: "grid", gridTemplateColumns: selectedProduct ? "1fr 1.5fr" : "1fr", gap: 16 }}>

          {/* Results list */}
          <div>
            <SectionLabel>{results.length} result{results.length !== 1 ? "s" : ""} found</SectionLabel>
            {results.length === 0 ? (
              <Card>
                <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>
                  No products found matching "{query}"
                </div>
              </Card>
            ) : (
              results.map((product, i) => (
                <div
                  key={i}
                  onClick={() => selectProduct(product)}
                  style={{
                    background: selectedProduct?.product_id === product.product_id
                      ? COLORS.accentGlow
                      : COLORS.card,
                    border: `1px solid ${selectedProduct?.product_id === product.product_id
                      ? COLORS.accent + "55"
                      : COLORS.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        {product.product_id}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.muted }}>
                        Stage {product.current_stage} · {product.total_defects} defects
                      </div>
                    </div>
                    <Badge color={statusColor(product.status)}>
                      {product.status?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Product detail */}
          {selectedProduct && (
            <div>
              <SectionLabel>Product Detail</SectionLabel>
              <Card style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                    {selectedProduct.product_id}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Badge color={statusColor(selectedProduct.status)}>
                      {selectedProduct.status?.replace("_", " ")}
                    </Badge>
                    <Badge color={COLORS.accentLight}>
                      Stage {selectedProduct.current_stage}
                    </Badge>
                    <Badge color={selectedProduct.total_defects > 3 ? COLORS.high : COLORS.low}>
                      {selectedProduct.total_defects} defects
                    </Badge>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Stage", value: selectedProduct.current_stage },
                    { label: "Status", value: selectedProduct.status?.replace("_", " ") },
                    { label: "Total Defects", value: selectedProduct.total_defects, color: selectedProduct.total_defects > 3 ? COLORS.high : COLORS.low },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                    }}>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: stat.color || COLORS.text }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Defects list */}
              <SectionLabel>Defect History</SectionLabel>
              {defects.length === 0 ? (
                <Card>
                  <div style={{ color: COLORS.low, textAlign: "center", padding: 20 }}>
                    ✅ No defects recorded for this product
                  </div>
                </Card>
              ) : (
                defects.map((defect, i) => (
                  <div key={i} style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: severityColor(defect.severity),
                        boxShadow: `0 0 8px ${severityColor(defect.severity)}`,
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                          {defect.defect_type}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>
                          Stage {defect.stage_number} · {new Date(defect.logged_at).toLocaleDateString()}
                        </div>
                        {defect.notes && (
                          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                            {defect.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <Badge color={severityColor(defect.severity)}>{defect.severity}</Badge>
                      <Badge color={defect.resolved ? COLORS.low : COLORS.high}>
                        {defect.resolved ? "resolved" : "open"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
