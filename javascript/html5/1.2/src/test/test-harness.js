/**
 * Shared browser test harness for Euler Square.
 */

(() => {
  const suites = [];
  const results = [];
  let testCount = 0;
  let passCount = 0;

  function log(msg) {
    results.push(msg);
    console.log(msg);
  }

  function assert(condition, message) {
    testCount += 1;
    if (condition) {
      passCount += 1;
      log(`OK ${message}`);
    } else {
      log(`FAIL ${message}`);
    }
  }

  function assertEqual(actual, expected, message) {
    assert(
      actual === expected,
      `${message} (expected: ${expected}, got: ${actual})`,
    );
  }

  function assertNotNull(value, message) {
    assert(
      value !== null && value !== undefined,
      `${message} should not be null`,
    );
  }

  function assertGreater(value, min, message) {
    assert(value > min, `${message} should be > ${min}, got ${value}`);
  }

  function registerSuite(name, tests) {
    suites.push({ name, tests });
  }

  function report() {
    const summary = `\n${"=".repeat(50)}\nTest Results: ${passCount}/${testCount} passed\n${"=".repeat(50)}`;
    log(summary);
    return { passed: passCount, total: testCount, results: results.slice() };
  }

  async function runAll() {
    console.log("\nStarting Euler Square module tests...\n");

    for (const suite of suites) {
      console.log(`\nSuite: ${suite.name}`);
      for (const testName of Object.keys(suite.tests)) {
        try {
          console.log(`- ${testName}`);
          const maybePromise = suite.tests[testName]();
          if (maybePromise && typeof maybePromise.then === "function") {
            await maybePromise;
          }
        } catch (e) {
          log(`FAIL ${suite.name}.${testName} threw error: ${e.message}`);
        }
      }
    }

    return report();
  }

  window.EulerSquareTestHarness = Object.freeze({
    assert,
    assertEqual,
    assertNotNull,
    assertGreater,
    registerSuite,
    runAll,
    report,
  });
})();
