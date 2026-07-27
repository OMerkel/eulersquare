/**
 * Modular test runner entry point.
 * Test suites are registered by individual test files.
 */

(() => {
  function resetUiAfterTests() {
    const overlayRoot = document.getElementById("overlayRoot");
    const sideNav = document.getElementById("sideNav");
    const navBackdrop = document.getElementById("navBackdrop");

    if (overlayRoot) {
      overlayRoot.hidden = true;
    }

    if (sideNav) {
      sideNav.classList.remove("open");
      sideNav.setAttribute("aria-hidden", "true");
    }

    if (navBackdrop) {
      navBackdrop.classList.remove("open");
      navBackdrop.setAttribute("aria-hidden", "true");
    }
  }

  function run() {
    if (!window.EulerSquareTestHarness) {
      console.error("EulerSquareTestHarness is missing.");
      return;
    }
    window.EulerSquareTestHarness
      .runAll()
      .then(() => {
        resetUiAfterTests();
      })
      .catch((error) => {
        resetUiAfterTests();
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
