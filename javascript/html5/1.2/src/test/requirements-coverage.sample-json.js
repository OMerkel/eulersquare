#!/usr/bin/env node
/*
 * Emit combined FR + NFR sample requirement coverage as JSON.
 */

const path = require("node:path");
const { execFileSync } = require("node:child_process");

const baseDir = __dirname;
const reporterPath = path.join(baseDir, "requirements-coverage.js");
const fixturePath = path.join(baseDir, "fixtures", "harness-output.sample.txt");

function runReporter(scope) {
  const stdout = execFileSync(
    process.execPath,
    [
      reporterPath,
      "--input",
      fixturePath,
      "--scope",
      scope,
      "--format",
      "json",
    ],
    { encoding: "utf8" },
  );

  return JSON.parse(stdout);
}

function main() {
  const fr = runReporter("FR");
  const nfr = runReporter("NFR");

  const combined = {
    generatedAt: new Date().toISOString(),
    fixture: path.relative(process.cwd(), fixturePath).replace(/\\/g, "/"),
    reports: {
      fr,
      nfr,
    },
  };

  console.log(JSON.stringify(combined, null, 2));
}

main();
