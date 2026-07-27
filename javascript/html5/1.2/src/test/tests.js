/**
 * Modular test runner entry point.
 * Test suites are registered by individual test files.
 */

(() => {
  function run() {
    if (!window.EulerSquareTestHarness) {
      console.error("EulerSquareTestHarness is missing.");
      return;
    }
    window.EulerSquareTestHarness.runAll().catch((error) => {
      console.error("Test harness run failed:", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(run, 1000);
    });
  } else {
    setTimeout(run, 1000);
  }
})();
