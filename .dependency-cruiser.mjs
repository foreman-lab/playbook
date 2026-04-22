/** Boundary rules for the Playbook codebase.
 *  Enforces:
 *    1. No cross-module imports between sibling modules.
 *    2. Inside graph: domain files stay pure; no circulars.
 *  File-pattern based per TS-library conventions.
 */

const DOMAIN_FILES = "^src/graph/(types|schemas|transition|errors)\\.ts$";
const APP_FILES = "^src/graph/(engine|catalog|store|create-engine)\\.ts$";
const ADAPTER_FILES = "^src/graph/adapters/";

export default {
  forbidden: [
    {
      name: "no-cross-module-imports",
      severity: "error",
      comment: "Siblings of graph/orchestrator/transport must not import each other.",
      from: { path: "^src/graph/" },
      to: { path: "^src/(orchestrator|transport)/" },
    },
    {
      name: "no-cross-module-imports-reverse",
      severity: "error",
      from: { path: "^src/(orchestrator|transport)/" },
      to: { path: "^src/graph/(?!index\\.ts)" },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      comment: "Domain files must only import domain. No application, no adapters.",
      from: { path: DOMAIN_FILES },
      to: {
        path: "^src/",
        pathNot: DOMAIN_FILES,
      },
    },
    {
      name: "application-no-adapters",
      severity: "error",
      comment: "Application must not depend on adapter implementations directly.",
      from: { path: APP_FILES },
      to: { path: ADAPTER_FILES },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    includeOnly: "^(src|tests)/",
  },
};
