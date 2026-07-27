#!/usr/bin/env node
/*
 * Prepare merged requirement-coverage input by combining browser and SW test logs.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const baseDir = __dirname;

const defaultPaths = Object.freeze({
  browserLog: path.join(baseDir, "harness-output.txt"),
  browserSampleLog: path.join(baseDir, "fixtures", "harness-output.sample.txt"),
  swLog: path.join(baseDir, "sw-harness-output.txt"),
  mergedLog: path.join(baseDir, "coverage-input.txt"),
  swRunner: path.join(baseDir, "sw.tests.node.js"),
});

function printHelp(exitCode, errorMessage) {
  if (errorMessage) {
    console.error(`Error: ${errorMessage}`);
  }

  console.log("Requirement coverage input preparation");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node requirements-coverage.prepare.js [--browser-source auto|file|sample] [--browser-input <path>] [--sw-output <path>] [--output <path>]",
  );
  console.log("");
  console.log("Defaults:");
  console.log("  --browser-source auto");
  console.log(`  --browser-input ${defaultPaths.browserLog}`);
  console.log(`  --sw-output ${defaultPaths.swLog}`);
  console.log(`  --output ${defaultPaths.mergedLog}`);

  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = {
    browserSource: "auto",
    browserInput: defaultPaths.browserLog,
    swOutput: defaultPaths.swLog,
    output: defaultPaths.mergedLog,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--browser-source") {
      args.browserSource = String(argv[i + 1] || "").toLowerCase();
      i += 1;
      continue;
    }

    if (arg === "--browser-input") {
      args.browserInput = path.resolve(process.cwd(), argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (arg === "--sw-output") {
      args.swOutput = path.resolve(process.cwd(), argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (arg === "--output") {
      args.output = path.resolve(process.cwd(), argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp(0);
    }
  }

  if (!["auto", "file", "sample"].includes(args.browserSource)) {
    printHelp(1, "Invalid --browser-source. Use auto, file, or sample.");
  }

  return args;
}

function ensureParentDir(filePath) {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

function runSwTestsAndCapture(swOutputPath) {
  const stdout = execFileSync(process.execPath, [defaultPaths.swRunner], {
    encoding: "utf8",
  });

  ensureParentDir(swOutputPath);
  fs.writeFileSync(swOutputPath, stdout, "utf8");

  return stdout;
}

function resolveBrowserLogSource({ browserSource, browserInput }) {
  const browserFileExists = fs.existsSync(browserInput);

  if (browserSource === "file") {
    if (!browserFileExists) {
      throw new Error(
        `Browser log not found at ${browserInput}. Generate it in-browser (window.EulerSquareTestHarness.runAll()) or use --browser-source sample.`,
      );
    }
    return {
      sourceType: "file",
      sourcePath: browserInput,
      text: fs.readFileSync(browserInput, "utf8"),
    };
  }

  if (browserSource === "sample") {
    return {
      sourceType: "sample",
      sourcePath: defaultPaths.browserSampleLog,
      text: fs.readFileSync(defaultPaths.browserSampleLog, "utf8"),
    };
  }

  if (browserFileExists) {
    return {
      sourceType: "file",
      sourcePath: browserInput,
      text: fs.readFileSync(browserInput, "utf8"),
    };
  }

  return {
    sourceType: "sample",
    sourcePath: defaultPaths.browserSampleLog,
    text: fs.readFileSync(defaultPaths.browserSampleLog, "utf8"),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const browserSource = resolveBrowserLogSource({
    browserSource: args.browserSource,
    browserInput: args.browserInput,
  });

  const swText = runSwTestsAndCapture(args.swOutput);

  const mergedText = `${browserSource.text.trimEnd()}\n\n${swText.trimEnd()}\n`;
  ensureParentDir(args.output);
  fs.writeFileSync(args.output, mergedText, "utf8");

  console.log("Prepared merged coverage input.");
  console.log(`Browser source: ${browserSource.sourceType}`);
  console.log(`Browser input: ${browserSource.sourcePath}`);
  console.log(`SW output: ${args.swOutput}`);
  console.log(`Merged output: ${args.output}`);
}

try {
  main();
} catch (error) {
  console.error(`Failed to prepare coverage input: ${error.message}`);
  process.exit(1);
}
