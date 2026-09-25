// Builds a company's default dashboard from ITS OWN stages + terminology.
// This is what keeps Viro generic: every company gets a dashboard derived
// from their workflow — the vehicle-upfitter demo is just one instance, not the default.

const plural = (w) => {
  if (!w) return "items";
  if (/[^aeiou]y$/i.test(w)) return w.slice(0, -1) + "ies";
  if (/(s|x|z|ch|sh)$/i.test(w)) return w + "es";
  return w + "s";
};

export function buildDefaultConfig({ company, stages, terminology } = {}) {
  const termProduct = (terminology && terminology.term_product) || company?.universal_id_field || "Item";
  const termIssue = (terminology && terminology.term_defect) || "Issue";
  const unit = plural(termProduct).toLowerCase();
  const stageList = (stages || [])
    .slice()
    .sort((a, b) => a.stage_number - b.stage_number)
    .map((s) => ({ number: s.stage_number, name: s.stage_name }));

  return {
    title: "Operations Overview",
    subtitle_template: "{company} · Live",
    sources: {
      summary: "/analytics/summary/{cid}",
      byStage: "/defects/by-stage/{cid}",
      topIssues: "/analytics/top-defects/{cid}",
      line: "/production/line/{cid}",
    },
    sections: [
      {
        cols: "1fr",
        blocks: [
          { type: "pipeline", source: "line", label: `${termProduct} pipeline`, stage_field: "current_stage", unit, stages: stageList },
        ],
      },
      {
        cols: "repeat(4, 1fr)",
        blocks: [
          { type: "kpi", source: "summary", field: "first_pass_yield", suffix: "%", label: "First Pass Yield", sub: `${termProduct}s with zero ${termIssue.toLowerCase()}s`, accent: true },
          { type: "kpi", source: "summary", field: "unresolved", label: `Open ${plural(termIssue)}`, sub: "Currently unresolved" },
          { type: "kpi", source: "summary", field: "critical", label: "Critical Open", sub: "Requires action", danger: true },
          { type: "kpi", source: "summary", field: "avg_resolution_hours", suffix: "h", label: "Avg Resolution", sub: "Time to resolve" },
        ],
      },
      {
        cols: "1.5fr 1fr",
        blocks: [
          { type: "ranked_bars", source: "byStage", label: `${plural(termIssue)} by stage`, name: "stage_number", value: "total_defects", limit: 6 },
          { type: "table", source: "topIssues", label: `Top ${termIssue.toLowerCase()} types`, limit: 6,
            columns: [{ field: "defect_type", label: termIssue }, { field: "count", label: "Count" }, { field: "critical_count", label: "Critical" }] },
        ],
      },
    ],
  };
}
