(() => {
  function hasNoEulerSquareSolution(gridRows, gridCols, noSolutionSizes) {
    return gridRows === gridCols && noSolutionSizes.has(gridRows);
  }

  function getGuideCombo({
    row,
    col,
    gridRows,
    gridCols,
    palette,
    evenGuideTemplates,
    noSolutionSizes,
    fallbackCombos,
  }) {
    if (hasNoEulerSquareSolution(gridRows, gridCols, noSolutionSizes)) {
      return null;
    }

    const template = evenGuideTemplates[gridRows];
    if (template) {
      return {
        outerColor: palette[template.outer[row][col]],
        innerColor: palette[template.inner[row][col]],
      };
    }

    // For odd n, this affine pair creates a valid Euler-square guide.
    if (gridRows % 2 === 1) {
      const outerIndex = (row + col) % gridRows;
      const innerIndex = (row + 2 * col) % gridRows;
      return {
        outerColor: palette[outerIndex],
        innerColor: palette[innerIndex],
      };
    }

    // Fallback for supported even orders keeps guide consistent with current tile layout.
    return fallbackCombos[row][col];
  }

  function validateSolvedLayout({
    solvedCount,
    totalPieces,
    gridRows,
    gridCols,
    boardOccupancy,
    cellKey,
  }) {
    if (solvedCount !== totalPieces) {
      return { solved: false, reason: "not-full" };
    }

    for (let row = 0; row < gridRows; row += 1) {
      const seenOuter = new Set();
      const seenInner = new Set();

      for (let col = 0; col < gridCols; col += 1) {
        const piece = boardOccupancy.get(cellKey(row, col));
        if (!piece) {
          return { solved: false, reason: "not-full" };
        }

        if (
          seenOuter.has(piece.outerColor) ||
          seenInner.has(piece.innerColor)
        ) {
          return { solved: false, reason: "row-duplicate" };
        }

        seenOuter.add(piece.outerColor);
        seenInner.add(piece.innerColor);
      }
    }

    for (let col = 0; col < gridCols; col += 1) {
      const seenOuter = new Set();
      const seenInner = new Set();

      for (let row = 0; row < gridRows; row += 1) {
        const piece = boardOccupancy.get(cellKey(row, col));
        if (!piece) {
          return { solved: false, reason: "not-full" };
        }

        if (
          seenOuter.has(piece.outerColor) ||
          seenInner.has(piece.innerColor)
        ) {
          return { solved: false, reason: "col-duplicate" };
        }

        seenOuter.add(piece.outerColor);
        seenInner.add(piece.innerColor);
      }
    }

    return { solved: true, reason: "ok" };
  }

  function findSolveTargetForColors({
    outerColor,
    innerColor,
    gridRows,
    gridCols,
    boardOccupancy,
    cellKey,
    getGuideComboForCell,
  }) {
    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols; col += 1) {
        const key = cellKey(row, col);
        if (boardOccupancy.has(key)) {
          continue;
        }

        const guideCombo = getGuideComboForCell(row, col);
        if (
          guideCombo &&
          guideCombo.outerColor === outerColor &&
          guideCombo.innerColor === innerColor
        ) {
          return { row, col };
        }
      }
    }

    return null;
  }

  window.EulerSquareSolver = Object.freeze({
    hasNoEulerSquareSolution,
    getGuideCombo,
    validateSolvedLayout,
    findSolveTargetForColors,
  });
})();
