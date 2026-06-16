// Hardcoded starter config for Meridian Vans.
// This is exactly the JSON shape the AI generator will eventually output.
// Proves the renderer works before wiring up generation.

export const MERIDIAN_CONFIG = {
    title: "Production Overview",
    subtitle_template: "{company} · Live · Plant 1 plant",
    sources: {
      summary: "/analytics/summary/{cid}",
      byStage: "/defects/by-stage/{cid}",
      topIssues: "/analytics/top-defects/{cid}",
      line: "/production/line/{cid}",
    },
    sections: [
      {
        // pipeline strip — the signature Meridian element
        layout: "row",
        cols: "1fr",
        blocks: [
          {
            type: "pipeline",
            source: "line",
            label: "Vehicle pipeline · VIN flow",
            stage_field: "current_stage",
            unit: "vehicles",
            stages: [
              { number: 110, name: "Entry — In The Door" },
              { number: 310, name: "Upfit Line" },
              { number: 510, name: "Quality Inspection" },
              { number: 710, name: "Approved to Ship" },
            ],
          },
        ],
      },
      {
        // KPI row — FPY is hero
        layout: "row",
        cols: "repeat(4, 1fr)",
        blocks: [
          { type: "kpi", source: "summary", field: "first_pass_yield", suffix: "%", label: "First Pass Yield", sub: "Products with zero defects", accent: true },
          { type: "kpi", source: "summary", field: "unresolved", label: "Open Defects", sub: "Currently unresolved" },
          { type: "kpi", source: "summary", field: "critical", label: "Critical Open", sub: "Requires immediate action" },
          { type: "kpi", source: "summary", field: "avg_resolution_hours", suffix: "h", label: "Avg Resolution", sub: "Time to resolve" },
        ],
      },
      {
        // station defect ranking + top issue types
        layout: "row",
        cols: "1.5fr 1fr",
        blocks: [
          {
            type: "ranked_bars",
            source: "byStage",
            label: "Defects by station",
            name: "stage_number",
            value: "total_defects",
            limit: 6,
          },
          {
            type: "table",
            source: "topIssues",
            label: "Top issue types",
            limit: 6,
            columns: [
              { field: "defect_type", label: "Issue" },
              { field: "count", label: "Count" },
              { field: "critical_count", label: "Critical" },
            ],
          },
        ],
      },
    ],
  };
  