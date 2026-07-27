(() => {
  const harness = window.EulerSquareTestHarness;
  const gameState = window.EulerSquareGameState;

  if (!harness || !gameState) {
    return;
  }

  const { assert, assertEqual, assertNotNull, registerSuite } = harness;

  registerSuite("game-state", {
    exposesExpectedApi() {
      assertEqual(typeof gameState.createPersistedState, "function", "createPersistedState exposed");
      assertEqual(typeof gameState.parsePersistedState, "function", "parsePersistedState exposed");
      assertEqual(typeof gameState.createPieceSnapshot, "function", "createPieceSnapshot exposed");
      assertEqual(typeof gameState.restorePiecesFromSnapshot, "function", "restorePiecesFromSnapshot exposed");
    },

    createsAndParsesPersistedState() {
      const state = gameState.createPersistedState({
        gridRows: 2,
        gridCols: 2,
        boardRect: { width: 100, height: 100 },
        tileCombos: [
          [
            { outerColor: "#111", innerColor: "#aaa" },
            { outerColor: "#222", innerColor: "#bbb" },
          ],
          [
            { outerColor: "#333", innerColor: "#ccc" },
            { outerColor: "#444", innerColor: "#ddd" },
          ],
        ],
        pieces: [
          { row: 0, col: 0, placedRow: 0, placedCol: 0, solved: true, outerColor: "#111", innerColor: "#aaa", x: 0, y: 0 },
          { row: 0, col: 1, placedRow: null, placedCol: null, solved: false, outerColor: "#222", innerColor: "#bbb", x: 50, y: 25 },
        ],
      });

      const parsed = gameState.parsePersistedState(JSON.stringify(state));
      assertNotNull(parsed, "persisted state parses");
      assertEqual(parsed.gridRows, 2, "gridRows persisted");
      assertEqual(parsed.gridCols, 2, "gridCols persisted");
      assertEqual(parsed.pieces.length, 2, "pieces length persisted");
      assert(parsed.pieces[1].relX > 0, "relative X persisted for unplaced tile");
      assert(parsed.pieces[1].relY > 0, "relative Y persisted for unplaced tile");
    },

    restoresSnapshotAndOccupancy() {
      const canvasA = document.createElement("canvas");
      const canvasB = document.createElement("canvas");
      const pieces = [
        { canvas: canvasA, placedRow: null, placedCol: null, solved: false, x: 0, y: 0 },
        { canvas: canvasB, placedRow: null, placedCol: null, solved: false, x: 0, y: 0 },
      ];

      const snapshot = [
        { placedRow: 0, placedCol: 1, solved: true },
        { placedRow: null, placedCol: null, solved: false, relX: 0.5, relY: 0.25 },
      ];
      const occupancy = new Map();
      const cellKey = (row, col) => `${row}:${col}`;

      const solvedCount = gameState.restorePiecesFromSnapshot({
        pieces,
        snapshot,
        boardRect: { x: 10, y: 20, width: 100, height: 80 },
        pieceW: 40,
        pieceH: 40,
        gridCols: 2,
        boardOccupancy: occupancy,
        cellKey,
      });

      assertEqual(solvedCount, 1, "solved count recalculated from snapshot");
      assertEqual(pieces[0].x, 50, "placed piece restored X");
      assertEqual(pieces[0].y, 20, "placed piece restored Y");
      assertEqual(pieces[1].x, 50, "unplaced piece restored relative X");
      assertEqual(pieces[1].y, 20, "unplaced piece restored relative Y");
      assert(occupancy.has("0:1"), "occupancy map restored");
    },

    rejectsMalformedPersistedPayloads() {
      assertEqual(gameState.parsePersistedState(null), null, "null payload rejected");
      assertEqual(gameState.parsePersistedState(""), null, "empty payload rejected");
      assertEqual(gameState.parsePersistedState("{"), null, "invalid JSON rejected");

      const missingRows = JSON.stringify({
        gridCols: 2,
        pieces: [],
        tileCombos: [],
      });
      assertEqual(gameState.parsePersistedState(missingRows), null, "missing gridRows rejected");

      const missingPieces = JSON.stringify({
        gridRows: 2,
        gridCols: 2,
        tileCombos: [],
      });
      assertEqual(gameState.parsePersistedState(missingPieces), null, "missing pieces rejected");

      const missingCombos = JSON.stringify({
        gridRows: 2,
        gridCols: 2,
        pieces: [],
      });
      assertEqual(gameState.parsePersistedState(missingCombos), null, "missing tileCombos rejected");
    },
  });
})();
