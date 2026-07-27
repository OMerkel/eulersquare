(() => {
  const harness = window.EulerSquareTestHarness;
  const boardRenderer = window.EulerSquareBoardRenderer;

  if (!harness || !boardRenderer) {
    return;
  }

  const { assert, assertEqual, assertNotNull, assertGreater, registerSuite } =
    harness;

  registerSuite("board-renderer", {
    exposesExpectedApi() {
      assertEqual(typeof boardRenderer.createPieceCanvas, "function", "createPieceCanvas exposed");
      assertEqual(typeof boardRenderer.buildBoardLayout, "function", "buildBoardLayout exposed");
    },

    createsTileCanvas() {
      const canvas = boardRenderer.createPieceCanvas({
        combo: { outerColor: "#123456", innerColor: "#abcdef" },
        pieceW: 40,
        pieceH: 40,
      });

      assertNotNull(canvas, "canvas created");
      assertEqual(canvas.tagName, "CANVAS", "canvas element returned");
      assertEqual(canvas.className, "piece", "canvas has piece class");
      assertGreater(canvas.width, 0, "canvas has width");
      assertGreater(canvas.height, 0, "canvas has height");
    },

    computesBoardLayoutAndAppliesStyles() {
      const playfield = document.createElement("div");
      const board = document.createElement("div");
      const boardOverlay = document.createElement("div");

      Object.defineProperty(playfield, "clientWidth", {
        configurable: true,
        value: 360,
      });
      Object.defineProperty(playfield, "clientHeight", {
        configurable: true,
        value: 300,
      });

      const layout = boardRenderer.buildBoardLayout({
        playfield,
        board,
        boardOverlay,
        gridRows: 3,
        gridCols: 3,
        overlayOpacity: 0.2,
        createPalette: () => ["#1", "#2", "#3"],
        hasNoEulerSquareSolution: () => false,
        getGuideCombo: () => ({ outerColor: "#1", innerColor: "#2" }),
      });

      assertNotNull(layout, "layout object returned");
      assertGreater(layout.pieceW, 0, "pieceW computed");
      assertGreater(layout.pieceH, 0, "pieceH computed");
      assertNotNull(layout.boardRect, "boardRect returned");
      assertEqual(layout.boardRect.width, layout.boardRect.w, "width alias matches w");
      assertEqual(layout.boardRect.height, layout.boardRect.h, "height alias matches h");
      assert(board.style.width.endsWith("px"), "board width style applied");
      assert(boardOverlay.style.backgroundImage.startsWith("url("), "overlay texture applied");
    },
  });
})();
