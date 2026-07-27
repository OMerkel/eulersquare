(() => {
  const harness = window.EulerSquareTestHarness;
  const constants = window.EulerSquareConstants;

  if (!harness || !constants) {
    return;
  }

  const {
    assert,
    assertEqual,
    assertNotNull,
    assertGreater,
    registerSuite,
  } = harness;

  function click(element) {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  registerSuite("hmi-integration", {
    requiredDomElementsExist() {
      const playfield = document.getElementById("playfield");
      const board = document.getElementById("board");
      const boardOverlay = document.getElementById("board-overlay");
      const statusEl = document.getElementById("status");

      assertNotNull(playfield, "playfield exists");
      assertNotNull(board, "board exists");
      assertNotNull(boardOverlay, "board overlay exists");
      assertNotNull(statusEl, "status exists");
    },

    sizeSelectorRangeAndDefault() {
      const sizeSelect = document.getElementById("sizeSelect");
      assertNotNull(sizeSelect, "size selector exists");
      assertEqual(
        sizeSelect.options.length,
        constants.GRID_MAX - constants.GRID_MIN + 1,
        "size selector has expected option count",
      );
      assertEqual(
        sizeSelect.value,
        String(constants.GRID_DEFAULT),
        "default grid size selected",
      );
    },

    paletteLegendRendered() {
      const paletteTitle = document.getElementById("paletteTitle");
      const paletteSwatches = document.getElementById("paletteSwatches");
      assertNotNull(paletteTitle, "palette title exists");
      assertNotNull(paletteSwatches, "palette swatches exists");
      assertGreater(paletteSwatches.children.length, 0, "palette swatches rendered");
    },

    cssAndBrowserSupportChecks() {
      const board = document.getElementById("board");
      const boardOverlay = document.getElementById("board-overlay");
      const playfield = document.getElementById("playfield");

      const boardStyle = window.getComputedStyle(board);
      const overlayStyle = window.getComputedStyle(boardOverlay);
      const fieldStyle = window.getComputedStyle(playfield);

      assertEqual(boardStyle.position, "absolute", "board is absolutely positioned");
      assertEqual(
        overlayStyle.position,
        "absolute",
        "board overlay is absolutely positioned",
      );
      assertEqual(
        overlayStyle.pointerEvents,
        "none",
        "board overlay ignores pointer events",
      );
      assertEqual(fieldStyle.position, "relative", "playfield is relatively positioned");

      const hasCanvas = !!document.createElement("canvas").getContext;
      const hasPointer = !!window.PointerEvent;
      const hasImage = !!window.Image;

      assert(hasCanvas, "canvas supported");
      assert(hasPointer, "PointerEvent supported");
      assert(hasImage, "Image supported");
    },

    togglesGuideOpacityAndButtonLabel() {
      const boardOverlay = document.getElementById("board-overlay");
      const toggleOverlayBtn = document.getElementById("toggleOverlayBtn");

      assertNotNull(boardOverlay, "board overlay exists for guide toggle");
      assertNotNull(toggleOverlayBtn, "guide toggle button exists");

      const initialLabel = toggleOverlayBtn.textContent;

      click(toggleOverlayBtn);
      assertEqual(boardOverlay.style.opacity, "0.2", "guide opacity set to 0.2");
      assertEqual(toggleOverlayBtn.textContent, "Hide Guide", "guide label switches to Hide Guide");

      click(toggleOverlayBtn);
      assertEqual(boardOverlay.style.opacity, "0", "guide opacity reset to 0");
      assertEqual(toggleOverlayBtn.textContent, "Show Guide", "guide label switches back to Show Guide");

      // Restore initial textual state if needed.
      if (initialLabel !== toggleOverlayBtn.textContent) {
        toggleOverlayBtn.textContent = initialLabel;
      }
    },

    menuOpenAndClosePaths() {
      const menuBtn = document.getElementById("menuBtn");
      const navCloseBtn = document.getElementById("navCloseBtn");
      const navBackdrop = document.getElementById("navBackdrop");
      const sideNav = document.getElementById("sideNav");

      assertNotNull(menuBtn, "menu open button exists");
      assertNotNull(navCloseBtn, "menu close button exists");
      assertNotNull(navBackdrop, "menu backdrop exists");
      assertNotNull(sideNav, "side nav exists");

      click(menuBtn);
      assert(sideNav.classList.contains("open"), "menu opens on menu button click");

      click(navCloseBtn);
      assert(!sideNav.classList.contains("open"), "menu closes on close button click");

      click(menuBtn);
      assert(sideNav.classList.contains("open"), "menu reopens for backdrop close check");

      click(navBackdrop);
      assert(!sideNav.classList.contains("open"), "menu closes on backdrop click");
    },

    overlayOpenAndClosePaths() {
      const navAbout = document.getElementById("navAbout");
      const overlayRoot = document.getElementById("overlayRoot");
      const overlayCloseBtn = document.getElementById("overlayCloseBtn");

      assertNotNull(navAbout, "about button exists");
      assertNotNull(overlayRoot, "overlay root exists");
      assertNotNull(overlayCloseBtn, "overlay close button exists");

      click(navAbout);
      assertEqual(overlayRoot.hidden, false, "overlay opens from nav action");

      click(overlayCloseBtn);
      assertEqual(overlayRoot.hidden, true, "overlay closes from close button");

      click(navAbout);
      assertEqual(overlayRoot.hidden, false, "overlay reopens for backdrop path");

      click(overlayRoot);
      assertEqual(overlayRoot.hidden, true, "overlay closes on root/backdrop click");
    },

    async solveUnsupportedAndSupportedSizes() {
      const navSolve = document.getElementById("navSolve");
      const navOptions = document.getElementById("navOptions");
      const applyOptionsBtn = document.getElementById("applyOptionsBtn");
      const sizeSelect = document.getElementById("sizeSelect");
      const statusEl = document.getElementById("status");
      const initialSize = sizeSelect.value;

      assertNotNull(navSolve, "solve button exists");
      assertNotNull(navOptions, "options button exists");
      assertNotNull(applyOptionsBtn, "apply options button exists");
      assertNotNull(sizeSelect, "size selector exists for solve tests");

      const originalRaf = window.requestAnimationFrame;
      try {
        // Unsupported size path (2x2).
        sizeSelect.value = "2";
        click(applyOptionsBtn);
        click(navSolve);
        assertEqual(statusEl.textContent, "Solve is not available for this board size.", "unsupported solve status shown for 2x2");

        // Supported size path (1x1). Force animation frames to complete instantly.
        sizeSelect.value = "1";
        click(applyOptionsBtn);

        window.requestAnimationFrame = (callback) => {
          callback(performance.now() + 1000);
          return 0;
        };

        click(navSolve);
        await sleep(0);
        await sleep(0);

        assert(statusEl.textContent.includes("Puzzle solved."), "supported solve path reaches solved status");
      } finally {
        window.requestAnimationFrame = originalRaf;
        if (sizeSelect.value !== initialSize) {
          sizeSelect.value = initialSize;
          click(applyOptionsBtn);
        }
      }
    },

    solveViaTouchEndClosesMenuAndStartsSolve() {
      const menuBtn = document.getElementById("menuBtn");
      const navSolve = document.getElementById("navSolve");
      const sideNav = document.getElementById("sideNav");
      const sizeSelect = document.getElementById("sizeSelect");
      const applyOptionsBtn = document.getElementById("applyOptionsBtn");
      const statusEl = document.getElementById("status");
      const initialSize = sizeSelect.value;

      assertNotNull(menuBtn, "menu button exists for touch solve");
      assertNotNull(navSolve, "solve nav button exists for touch solve");
      assertNotNull(sideNav, "side nav exists for touch solve");

      try {
        // Force unsupported size to produce deterministic status after solve action.
        sizeSelect.value = "2";
        click(applyOptionsBtn);

        click(menuBtn);
        assert(sideNav.classList.contains("open"), "menu is open before touch solve");

        navSolve.dispatchEvent(new Event("touchend", { bubbles: true, cancelable: true }));

        assert(!sideNav.classList.contains("open"), "menu closes on touchend solve action");
        assertEqual(statusEl.textContent, "Solve is not available for this board size.", "touchend solve starts solve flow");
      } finally {
        if (sizeSelect.value !== initialSize) {
          sizeSelect.value = initialSize;
          click(applyOptionsBtn);
        }
      }
    },

    optionsViaTouchEndOpensOverlay() {
      const menuBtn = document.getElementById("menuBtn");
      const navOptions = document.getElementById("navOptions");
      const overlayRoot = document.getElementById("overlayRoot");
      const overlayTitle = document.getElementById("overlayTitle");
      const overlayCloseBtn = document.getElementById("overlayCloseBtn");
      const navCloseBtn = document.getElementById("navCloseBtn");

      assertNotNull(menuBtn, "menu button exists for touch options");
      assertNotNull(navOptions, "options nav button exists for touch options");
      assertNotNull(overlayRoot, "overlay root exists for touch options");
      assertNotNull(overlayCloseBtn, "overlay close button exists for touch options");
      assertNotNull(navCloseBtn, "nav close button exists for touch options");

      try {
        click(menuBtn);
        navOptions.dispatchEvent(new Event("touchend", { bubbles: true, cancelable: true }));

        assertEqual(overlayRoot.hidden, false, "options overlay opens on touchend action");
        assertEqual(overlayTitle.textContent, "Options", "options overlay title is shown");
      } finally {
        if (!overlayRoot.hidden) {
          click(overlayCloseBtn);
        }
        click(navCloseBtn);
      }
    },
  });
})();
