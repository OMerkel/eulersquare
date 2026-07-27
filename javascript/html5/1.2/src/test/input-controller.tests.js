(() => {
  const harness = window.EulerSquareTestHarness;
  const inputControllerModule = window.EulerSquareInputController;

  if (!harness || !inputControllerModule) {
    return;
  }

  const { assert, assertEqual, registerSuite } = harness;

  registerSuite("input-controller", {
    exposesExpectedApi() {
      assertEqual(typeof inputControllerModule.create, "function", "create exposed");
    },

    handlesLiftMoveAndSnapLifecycle() {
      const playfield = document.createElement("div");
      const canvas = document.createElement("canvas");
      canvas.width = 20;
      canvas.height = 20;
      canvas.style.left = "0px";
      canvas.style.top = "0px";

      const piece = {
        canvas,
        solved: true,
        placedRow: 0,
        placedCol: 0,
        x: 0,
        y: 0,
      };

      playfield.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
      });
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0 });

      const occupancy = new Map(["0:0"].map((k) => [k, piece]));
      let liftedCalled = false;
      let snappedCalled = false;

      const controller = inputControllerModule.create({
        playfield,
        getPieces: () => [piece],
        getBoardRect: () => ({ x: 0, y: 0, fieldW: 200, fieldH: 200 }),
        getPieceSize: () => ({ pieceW: 20, pieceH: 20 }),
        getGridSize: () => ({ gridRows: 2, gridCols: 2 }),
        getSnapDistance: () => 20,
        cellKey: (row, col) => `${row}:${col}`,
        boardOccupancy: occupancy,
        clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
        nextZIndex: () => 11,
        onPieceLiftedFromSolvedCell: (p) => {
          liftedCalled = true;
          occupancy.delete("0:0");
          p.solved = false;
          p.placedRow = null;
          p.placedCol = null;
        },
        onPieceSnapped: (p, snapCell) => {
          snappedCalled = true;
          p.solved = true;
          p.placedRow = snapCell.row;
          p.placedCol = snapCell.col;
          p.x = snapCell.x;
          p.y = snapCell.y;
          occupancy.set(snapCell.key, p);
        },
      });

      controller.onPointerDown({
        currentTarget: canvas,
        clientX: 2,
        clientY: 2,
        preventDefault: () => {},
      });
      controller.onPointerMove({ clientX: 22, clientY: 2 });
      controller.onPointerUp();

      assert(liftedCalled, "lift callback invoked for solved piece");
      assert(snappedCalled, "snap callback invoked after move");
      assertEqual(piece.placedRow, 0, "piece snapped to row 0");
      assertEqual(piece.placedCol, 1, "piece snapped to col 1");
      assert(occupancy.has("0:1"), "occupancy updated to snapped cell");
    },

    rejectsSnapToOccupiedCell() {
      const playfield = document.createElement("div");

      const blockedCanvas = document.createElement("canvas");
      blockedCanvas.width = 20;
      blockedCanvas.height = 20;

      const movingCanvas = document.createElement("canvas");
      movingCanvas.width = 20;
      movingCanvas.height = 20;
      movingCanvas.style.left = "80px";
      movingCanvas.style.top = "0px";

      const blockedPiece = {
        canvas: blockedCanvas,
        solved: true,
        placedRow: 0,
        placedCol: 0,
        x: 0,
        y: 0,
      };

      const movingPiece = {
        canvas: movingCanvas,
        solved: false,
        placedRow: null,
        placedCol: null,
        x: 80,
        y: 0,
      };

      playfield.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
      });
      movingCanvas.getBoundingClientRect = () => ({ left: 80, top: 0 });

      const occupancy = new Map([["0:0", blockedPiece]]);
      let snappedCalled = false;

      const controller = inputControllerModule.create({
        playfield,
        getPieces: () => [blockedPiece, movingPiece],
        getBoardRect: () => ({ x: 0, y: 0, fieldW: 200, fieldH: 200 }),
        getPieceSize: () => ({ pieceW: 20, pieceH: 20 }),
        getGridSize: () => ({ gridRows: 2, gridCols: 2 }),
        getSnapDistance: () => 20,
        cellKey: (row, col) => `${row}:${col}`,
        boardOccupancy: occupancy,
        clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
        nextZIndex: () => 20,
        onPieceLiftedFromSolvedCell: () => {},
        onPieceSnapped: () => {
          snappedCalled = true;
        },
      });

      controller.onPointerDown({
        currentTarget: movingCanvas,
        clientX: 81,
        clientY: 1,
        preventDefault: () => {},
      });

      // Move onto occupied cell [0,0].
      controller.onPointerMove({ clientX: 1, clientY: 1 });
      controller.onPointerUp();

      assert(!snappedCalled, "snap callback is not invoked for occupied target");
      assertEqual(movingPiece.solved, false, "moving piece remains unsolved");
      assertEqual(movingPiece.placedRow, null, "moving piece row remains null");
      assertEqual(movingPiece.placedCol, null, "moving piece col remains null");
      assertEqual(occupancy.size, 1, "occupancy keeps only original blocked cell");
      assert(occupancy.has("0:0"), "occupied cell remains assigned to original piece");
    },
  });
})();
