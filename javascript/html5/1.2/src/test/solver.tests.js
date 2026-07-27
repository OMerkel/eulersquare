(() => {
  const harness = window.EulerSquareTestHarness;
  const solver = window.EulerSquareSolver;
  const constants = window.EulerSquareConstants;

  if (!harness || !solver || !constants) {
    return;
  }

  const {
    assert,
    assertEqual,
    assertNotNull,
    registerSuite,
  } = harness;

  registerSuite("solver", {
    exposesExpectedApi() {
      assertEqual(typeof solver.hasNoEulerSquareSolution, "function", "hasNoEulerSquareSolution exposed");
      assertEqual(typeof solver.getGuideCombo, "function", "getGuideCombo exposed");
      assertEqual(typeof solver.validateSolvedLayout, "function", "validateSolvedLayout exposed");
      assertEqual(typeof solver.findSolveTargetForColors, "function", "findSolveTargetForColors exposed");
    },

    detectsNoSolutionSizes() {
      assert(solver.hasNoEulerSquareSolution(2, 2, constants.NO_SOLUTION_SIZES), "2x2 flagged as no-solution");
      assert(solver.hasNoEulerSquareSolution(6, 6, constants.NO_SOLUTION_SIZES), "6x6 flagged as no-solution");
      assert(!solver.hasNoEulerSquareSolution(5, 5, constants.NO_SOLUTION_SIZES), "5x5 allowed");
    },

    buildsGuideComboForOddOrders() {
      const palette = ["a", "b", "c", "d", "e"];
      const combo = solver.getGuideCombo({
        row: 1,
        col: 2,
        gridRows: 5,
        gridCols: 5,
        palette,
        evenGuideTemplates: constants.EVEN_GUIDE_TEMPLATES,
        noSolutionSizes: constants.NO_SOLUTION_SIZES,
        fallbackCombos: [],
      });

      assertNotNull(combo, "odd order guide combo exists");
      assertEqual(combo.outerColor, palette[(1 + 2) % 5], "odd guide outer index formula");
      assertEqual(combo.innerColor, palette[(1 + 2 * 2) % 5], "odd guide inner index formula");
    },

    validatesSolvedLayoutRules() {
      const occupancy = new Map();
      const cellKey = (row, col) => `${row}:${col}`;

      occupancy.set(cellKey(0, 0), { outerColor: "A", innerColor: "1" });
      occupancy.set(cellKey(0, 1), { outerColor: "B", innerColor: "2" });
      occupancy.set(cellKey(1, 0), { outerColor: "B", innerColor: "1" });
      occupancy.set(cellKey(1, 1), { outerColor: "A", innerColor: "2" });

      const valid = solver.validateSolvedLayout({
        solvedCount: 4,
        totalPieces: 4,
        gridRows: 2,
        gridCols: 2,
        boardOccupancy: occupancy,
        cellKey,
      });
      assert(valid.solved, "2x2 latin/orthogonality style layout validates");

      occupancy.set(cellKey(1, 1), { outerColor: "B", innerColor: "2" });
      const invalid = solver.validateSolvedLayout({
        solvedCount: 4,
        totalPieces: 4,
        gridRows: 2,
        gridCols: 2,
        boardOccupancy: occupancy,
        cellKey,
      });
      assert(!invalid.solved, "duplicate in column or row is rejected");
    },

    findsSolveTargetForColors() {
      const occupancy = new Map();
      occupancy.set("0:0", { occupied: true });

      const target = solver.findSolveTargetForColors({
        outerColor: "outer-b",
        innerColor: "inner-b",
        gridRows: 2,
        gridCols: 2,
        boardOccupancy: occupancy,
        cellKey: (row, col) => `${row}:${col}`,
        getGuideComboForCell: (row, col) => {
          if (row === 0 && col === 0) {
            return { outerColor: "outer-a", innerColor: "inner-a" };
          }
          if (row === 0 && col === 1) {
            return { outerColor: "outer-b", innerColor: "inner-b" };
          }
          return { outerColor: "outer-c", innerColor: "inner-c" };
        },
      });

      assertNotNull(target, "target found for matching free color pair");
      assertEqual(target.row, 0, "target row resolved");
      assertEqual(target.col, 1, "target col resolved");

      const noMatch = solver.findSolveTargetForColors({
        outerColor: "outer-z",
        innerColor: "inner-z",
        gridRows: 2,
        gridCols: 2,
        boardOccupancy: occupancy,
        cellKey: (row, col) => `${row}:${col}`,
        getGuideComboForCell: () => ({ outerColor: "outer-a", innerColor: "inner-a" }),
      });
      assertEqual(noMatch, null, "returns null when no free matching target exists");
    },
  });
})();
