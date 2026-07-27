#!/usr/bin/env node
/*
 * Self-test for requirements-coverage.js using a deterministic harness fixture.
 */

const path = require("node:path");
const { execFileSync } = require("node:child_process");

function fail(message) {
  console.error(`Self-test failed: ${message}`);
  process.exit(1);
}

const baseDir = __dirname;
const reporter = path.join(baseDir, "requirements-coverage.js");
const fixture = path.join(baseDir, "fixtures", "harness-output.sample.txt");

let report;
try {
  const output = execFileSync(
    process.execPath,
    [reporter, "--input", fixture, "--format", "json"],
    { encoding: "utf8" },
  );
  report = JSON.parse(output);
} catch (error) {
  fail(`unable to execute reporter: ${error.message}`);
}

function requirementStatus(id) {
  const entry = report.requirements.find((item) => item.requirementId === id);
  return entry ? entry.status : null;
}

if (report.scope !== "ALL") {
  fail(`expected scope ALL, got ${report.scope}`);
}

if (!report.totals || report.totals.requirements <= 0) {
  fail("expected non-empty requirement totals");
}

if (report.totals.pass <= 0) {
  fail("expected at least one passing requirement");
}

if (report.totals.fail <= 0) {
  fail("expected at least one failing requirement");
}

if (report.totals.untested <= 0) {
  fail("expected at least one untested requirement");
}

if (requirementStatus("FR-MOD-SOL-001") !== "Pass") {
  fail("expected FR-MOD-SOL-001 to be Pass");
}

if (requirementStatus("FR-MOD-SOL-002") !== "Fail") {
  fail("expected FR-MOD-SOL-002 to be Fail");
}

if (requirementStatus("FR-MOD-INP-001") !== "Pass") {
  fail("expected FR-MOD-INP-001 to be Pass");
}

console.log("requirements-coverage self-test passed");
