#!/usr/bin/env node
/*
 * Requirement coverage reporter for Euler Square browser harness logs.
 *
 * Usage:
 *   node src/test/requirements-coverage.js --input <logFile>
 *   node src/test/requirements-coverage.js --input <logFile> --scope FR
 *   node src/test/requirements-coverage.js --input <logFile> --format json
 */

const fs = require("node:fs");
const path = require("node:path");

const TEST_TO_REQUIREMENTS = Object.freeze({
  "constants.exposesExpectedApi": ["FR-MOD-CON-001", "FR-MOD-CON-002"],
  "constants.providesBasePaletteContract": ["FR-MOD-CON-003"],
  "ui-constants.exposesExpectedApi": ["FR-MOD-UIC-001"],
  "ui-constants.providesUiLabelsAndStatusTokens": ["FR-MOD-UIC-002", "FR-MOD-UIC-003"],
  "solver.exposesExpectedApi": ["FR-MOD-SOL-001"],
  "solver.detectsNoSolutionSizes": ["FR-MOD-SOL-002", "FR-APP-002"],
  "solver.buildsGuideComboForOddOrders": ["FR-MOD-SOL-003", "FR-APP-007"],
  "solver.validatesSolvedLayoutRules": ["FR-MOD-SOL-004", "FR-APP-007"],
  "solver.findsSolveTargetForColors": ["FR-MOD-SOL-005"],
  "game-state.exposesExpectedApi": ["FR-MOD-GST-001"],
  "game-state.createsAndParsesPersistedState": [
    "FR-MOD-GST-002",
    "FR-MOD-GST-003",
    "FR-APP-009",
    "NFR-GLOB-004",
  ],
  "game-state.restoresSnapshotAndOccupancy": ["FR-MOD-GST-004", "FR-APP-010"],
  "game-state.rejectsMalformedPersistedPayloads": ["FR-MOD-GST-005", "NFR-GLOB-004"],
  "board-renderer.exposesExpectedApi": ["FR-MOD-BRD-001"],
  "board-renderer.createsTileCanvas": ["FR-MOD-BRD-002", "NFR-GLOB-006"],
  "board-renderer.computesBoardLayoutAndAppliesStyles": [
    "FR-MOD-BRD-003",
    "FR-MOD-BRD-004",
    "FR-MOD-BRD-005",
    "FR-APP-001",
  ],
  "input-controller.exposesExpectedApi": ["FR-MOD-INP-001"],
  "input-controller.handlesLiftMoveAndSnapLifecycle": [
    "FR-MOD-INP-002",
    "FR-MOD-INP-003",
    "FR-MOD-INP-004",
    "FR-MOD-INP-005",
    "FR-MOD-INP-006",
    "FR-APP-003",
    "FR-APP-004",
  ],
  "input-controller.rejectsSnapToOccupiedCell": [
    "FR-APP-005",
    "FR-MOD-INP-004",
    "FR-MOD-INP-005",
  ],
  "hmi-integration.requiredDomElementsExist": [
    "FR-MOD-HMI-001",
    "FR-MOD-UIC-001",
    "FR-APP-001",
  ],
  "hmi-integration.sizeSelectorRangeAndDefault": [
    "FR-APP-002",
    "FR-MENU-003",
    "FR-MOD-CON-001",
  ],
  "hmi-integration.paletteLegendRendered": ["FR-MOD-HMI-002", "FR-MENU-005"],
  "hmi-integration.cssAndBrowserSupportChecks": [
    "FR-APP-001",
    "NFR-GLOB-003",
    "NFR-GLOB-006",
  ],
  "hmi-integration.togglesGuideOpacityAndButtonLabel": [
    "FR-APP-006",
    "FR-MOD-HMI-004",
  ],
  "hmi-integration.menuOpenAndClosePaths": [
    "FR-MENU-002",
    "FR-MOD-HMI-003",
  ],
  "hmi-integration.overlayOpenAndClosePaths": [
    "FR-MENU-004",
    "FR-MOD-HMI-003",
  ],
  "hmi-integration.solveUnsupportedAndSupportedSizes": [
    "FR-APP-008",
  ],
  "sw-node.registersLifecycleEventHandlers": [
    "FR-MOD-SW-001",
  ],
  "sw-node.precacheCoreAssetsInProductionHost": [
    "FR-MOD-SW-001",
    "NFR-MOD-SW-001",
  ],
  "sw-node.precacheDevTestAssetsOnLocalhost": [
    "FR-MOD-SW-002",
  ],
  "sw-node.servesStaticFromCacheFirst": [
    "FR-MOD-SW-003",
  ],
  "sw-node.fallbackBehaviorForStaticAndDocuments": [
    "FR-MOD-SW-005",
  ],
  "sw-node.networkFirstForNonStaticAndRuntimeCaching": [
    "FR-MOD-SW-004",
  ],
});

function parseArgs(argv) {
  const args = {
    input: "",
    scope: "ALL",
    format: "text",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") {
      args.input = argv[i + 1] || "";
      i += 1;
    } else if (arg === "--scope" || arg === "-s") {
      args.scope = (argv[i + 1] || "ALL").toUpperCase();
      i += 1;
    } else if (arg === "--format" || arg === "-f") {
      args.format = (argv[i + 1] || "text").toLowerCase();
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp(0);
    }
  }

  if (!args.input) {
    printHelp(1, "Missing required --input <logFile> argument.");
  }

  if (!["ALL", "FR", "NFR"].includes(args.scope)) {
    printHelp(1, "Invalid --scope. Use ALL, FR, or NFR.");
  }

  if (!["text", "json"].includes(args.format)) {
    printHelp(1, "Invalid --format. Use text or json.");
  }

  return args;
}

function printHelp(exitCode, errorMessage) {
  if (errorMessage) {
    console.error(`Error: ${errorMessage}`);
  }
  console.log("Requirement coverage reporter");
  console.log("");
  console.log("Usage:");
  console.log("  node src/test/requirements-coverage.js --input <logFile>");
  console.log("  node src/test/requirements-coverage.js --input <logFile> --scope FR");
  console.log("  node src/test/requirements-coverage.js --input <logFile> --format json");
  process.exit(exitCode);
}

function parseHarnessLog(logText) {
  const testStatus = new Map();
  const lines = logText.split(/\r?\n/);
  let currentSuite = "";
  let currentTestName = "";
  let currentKey = "";

  function ensureCurrentTestInitialized() {
    if (!currentKey) {
      return;
    }
    if (!testStatus.has(currentKey)) {
      testStatus.set(currentKey, "pass");
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const suiteMatch = line.match(/^Suite:\s+(.+)$/);
    if (suiteMatch) {
      currentSuite = suiteMatch[1].trim();
      currentTestName = "";
      currentKey = "";
      continue;
    }

    const testStartMatch = line.match(/^-\s+([A-Za-z0-9_]+)$/);
    if (testStartMatch && currentSuite) {
      currentTestName = testStartMatch[1];
      currentKey = `${currentSuite}.${currentTestName}`;
      ensureCurrentTestInitialized();
      continue;
    }

    const thrownMatch = line.match(/^FAIL\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_]+)\s+threw error:/);
    if (thrownMatch) {
      testStatus.set(thrownMatch[1], "fail");
      continue;
    }

    if (line.startsWith("FAIL ")) {
      ensureCurrentTestInitialized();
      if (currentKey) {
        testStatus.set(currentKey, "fail");
      }
    }
  }

  return testStatus;
}

function filterRequirementIdsByScope(ids, scope) {
  if (scope === "ALL") {
    return ids;
  }
  if (scope === "FR") {
    return ids.filter((id) => id.startsWith("FR-"));
  }
  return ids.filter((id) => id.startsWith("NFR-"));
}

function buildCoverage(testStatus, scope) {
  const reqToTests = new Map();
  const reqToStatus = new Map();

  Object.entries(TEST_TO_REQUIREMENTS).forEach(([testKey, reqIds]) => {
    const scopedReqIds = filterRequirementIdsByScope(reqIds, scope);
    scopedReqIds.forEach((reqId) => {
      if (!reqToTests.has(reqId)) {
        reqToTests.set(reqId, []);
      }
      reqToTests.get(reqId).push(testKey);
    });
  });

  reqToTests.forEach((tests, reqId) => {
    const statuses = tests
      .map((testKey) => testStatus.get(testKey))
      .filter((status) => status === "pass" || status === "fail");

    if (statuses.length === 0) {
      reqToStatus.set(reqId, "Untested");
      return;
    }

    const hasFail = statuses.includes("fail");
    reqToStatus.set(reqId, hasFail ? "Fail" : "Pass");
  });

  const entries = Array.from(reqToStatus.entries())
    .map(([requirementId, status]) => ({
      requirementId,
      status,
      tests: reqToTests.get(requirementId) || [],
    }))
    .sort((a, b) => a.requirementId.localeCompare(b.requirementId));

  const totals = {
    requirements: entries.length,
    pass: entries.filter((r) => r.status === "Pass").length,
    fail: entries.filter((r) => r.status === "Fail").length,
    untested: entries.filter((r) => r.status === "Untested").length,
  };

  const testedRequirements = totals.pass + totals.fail;
  const coverage = totals.requirements > 0 ? testedRequirements / totals.requirements : 0;
  const passRate = testedRequirements > 0 ? totals.pass / testedRequirements : 0;

  return {
    scope,
    totals,
    metrics: {
      coverage,
      passRate,
    },
    requirements: entries,
  };
}

function renderTextReport(report) {
  const lines = [];
  lines.push(`Requirement Coverage Report (scope=${report.scope})`);
  lines.push("=".repeat(72));
  lines.push(
    `Requirements: ${report.totals.requirements}, Pass: ${report.totals.pass}, Fail: ${report.totals.fail}, Untested: ${report.totals.untested}`,
  );
  lines.push(
    `Coverage: ${(report.metrics.coverage * 100).toFixed(1)}% | Requirement Pass Rate: ${(report.metrics.passRate * 100).toFixed(1)}%`,
  );
  lines.push("");
  lines.push("Per Requirement:");
  lines.push("-".repeat(72));
  report.requirements.forEach((entry) => {
    lines.push(
      `${entry.requirementId.padEnd(18)} ${entry.status.padEnd(8)} ${entry.tests.join(", ")}`,
    );
  });
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(2);
  }

  const logText = fs.readFileSync(inputPath, "utf8");
  const testStatus = parseHarnessLog(logText);
  const report = buildCoverage(testStatus, args.scope);

  if (args.format === "json") {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(renderTextReport(report));
}

main();
