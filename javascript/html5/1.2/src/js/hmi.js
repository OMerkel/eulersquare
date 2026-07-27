(() => {
  const constants = window.EulerSquareConstants;
  if (!constants) {
    throw new Error(
      "EulerSquareConstants missing. Load js/constants.js before js/hmi.js.",
    );
  }

  const uiConstants = window.EulerSquareUiConstants;
  if (!uiConstants) {
    throw new Error(
      "EulerSquareUiConstants missing. Load js/ui-constants.js before js/hmi.js.",
    );
  }

  const solver = window.EulerSquareSolver;
  if (!solver) {
    throw new Error(
      "EulerSquareSolver missing. Load js/solver.js before js/hmi.js.",
    );
  }

  const gameState = window.EulerSquareGameState;
  if (!gameState) {
    throw new Error(
      "EulerSquareGameState missing. Load js/game-state.js before js/hmi.js.",
    );
  }

  const boardRenderer = window.EulerSquareBoardRenderer;
  if (!boardRenderer) {
    throw new Error(
      "EulerSquareBoardRenderer missing. Load js/board-renderer.js before js/hmi.js.",
    );
  }

  const inputControllerModule = window.EulerSquareInputController;
  if (!inputControllerModule) {
    throw new Error(
      "EulerSquareInputController missing. Load js/input-controller.js before js/hmi.js.",
    );
  }

  const {
    GRID_MIN,
    GRID_MAX,
    GRID_DEFAULT,
    NO_SOLUTION_SIZES,
    EVEN_GUIDE_TEMPLATES,
    BASE_PALETTE,
  } = constants;

  const { DOM_IDS, OVERLAY_PAGES, UI_LABELS, UI_BEHAVIOR, STATUS_TEXT } =
    uiConstants;

  const { SNAP_DISTANCE } = UI_BEHAVIOR;

  const getEl = (key) => document.getElementById(DOM_IDS[key]);

  const playfield = getEl("playfield");
  const board = getEl("board");
  const boardOverlay = getEl("boardOverlay");
  const statusEl = getEl("status");
  const toggleOverlayBtn = getEl("toggleOverlayBtn");
  const menuBtn = getEl("menuBtn");
  const sideNav = getEl("sideNav");
  const navBackdrop = getEl("navBackdrop");
  const navCloseBtn = getEl("navCloseBtn");
  const navNewGame = getEl("navNewGame");
  const navSolve = getEl("navSolve");
  const navOptions = getEl("navOptions");
  const navAbout = getEl("navAbout");
  const navRules = getEl("navRules");
  const navInfo = getEl("navInfo");
  const overlayRoot = getEl("overlayRoot");
  const overlayTitle = getEl("overlayTitle");
  const overlayCloseBtn = getEl("overlayCloseBtn");
  const sizeSelect = getEl("sizeSelect");
  const paletteTitle = getEl("paletteTitle");
  const paletteSwatches = getEl("paletteSwatches");
  const applyOptionsBtn = getEl("applyOptionsBtn");

  const overlayPages = {
    options: {
      title: OVERLAY_PAGES.options.title,
      element: document.getElementById(OVERLAY_PAGES.options.elementId),
    },
    about: {
      title: OVERLAY_PAGES.about.title,
      element: document.getElementById(OVERLAY_PAGES.about.elementId),
    },
    rules: {
      title: OVERLAY_PAGES.rules.title,
      element: document.getElementById(OVERLAY_PAGES.rules.elementId),
    },
    info: {
      title: OVERLAY_PAGES.info.title,
      element: document.getElementById(OVERLAY_PAGES.info.elementId),
    },
  };

  let overlayOpacity = 0;
  let pieces = [];
  let boardRect = null;
  let tileCombos = [];
  let pieceW = 0;
  let pieceH = 0;
  let solvedCount = 0;
  let zCounter = 10;
  let gridRows = GRID_DEFAULT;
  let gridCols = GRID_DEFAULT;
  let isSolving = false;
  const boardOccupancy = new Map();
  let inputController = null;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function saveGameState() {
    const state = gameState.createPersistedState({
      gridRows,
      gridCols,
      boardRect,
      tileCombos,
      pieces,
    });

    localStorage.setItem("eulersquareState", JSON.stringify(state));
  }

  function restoreGameState() {
    const rawState = localStorage.getItem("eulersquareState");
    const state = gameState.parsePersistedState(rawState);
    if (!state) {
      return false;
    }

    gridRows = state.gridRows;
    gridCols = state.gridCols;

    // Restore the exact tile combinations (colors) that were used
    tileCombos = state.tileCombos;
    buildBoardLayout();
    buildPieces();
    boardOccupancy.clear();
    solvedCount = gameState.restorePiecesFromSnapshot({
      pieces,
      snapshot: state.pieces,
      boardRect,
      pieceW,
      pieceH,
      gridCols,
      boardOccupancy,
      cellKey,
    });

    if (solvedCount === pieces.length) {
      const result = validateSolvedLayout();
      if (result.solved) {
        setStatus(STATUS_TEXT.solved);
      } else {
        setStatus(STATUS_TEXT.invalidSolved);
      }
    } else {
      setStatus(`${solvedCount}/${pieces.length} ${STATUS_TEXT.tilesPlacedSuffix}`);
    }

    return true;
  }

  function setGridSize(nextRows, nextCols) {
    gridRows = clamp(nextRows, GRID_MIN, GRID_MAX);
    gridCols = clamp(nextCols, GRID_MIN, GRID_MAX);
  }

  function hasNoEulerSquareSolution() {
    return solver.hasNoEulerSquareSolution(
      gridRows,
      gridCols,
      NO_SOLUTION_SIZES,
    );
  }

  function getGuideCombo(row, col, palette) {
    return solver.getGuideCombo({
      row,
      col,
      gridRows,
      gridCols,
      palette,
      evenGuideTemplates: EVEN_GUIDE_TEMPLATES,
      noSolutionSizes: NO_SOLUTION_SIZES,
      fallbackCombos: tileCombos,
    });
  }

  function cellKey(row, col) {
    return `${row}:${col}`;
  }

  function animatePieceToPosition(piece, targetX, targetY, duration) {
    return new Promise((resolve) => {
      const startX = piece.x;
      const startY = piece.y;
      const startTime = performance.now();

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        piece.x = startX + (targetX - startX) * progress;
        piece.y = startY + (targetY - startY) * progress;

        piece.canvas.style.left = `${piece.x}px`;
        piece.canvas.style.top = `${piece.y}px`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(animate);
    });
  }

  async function solvePuzzle() {
    if (isSolving) {
      return;
    }

    if (gridRows === 2 || gridRows === 6 || gridRows === 14) {
      setStatus("Solve is not available for this board size.");
      return;
    }

    isSolving = true;
    const palette = BASE_PALETTE;
    const animationDuration = 800;

    // Categorize tiles:
    // 1. Correctly placed: on grid AND colors match guide at that position
    // 2. Incorrectly placed: on grid BUT colors don't match guide at that position
    // 3. Unplaced: not on grid (will be moved from off-board later)

    // Phase 1: Move incorrectly placed tiles (Category 2) away from board
    setStatus("Moving incorrect tiles away...");

    const incorrectlyPlaced = pieces.filter((piece) => {
      // If not placed on grid, skip (Category 3)
      if (piece.placedRow === null || piece.placedCol === null) {
        return false;
      }

      // Check if colors match guide at current position
      const guideCombo = getGuideCombo(
        piece.placedRow,
        piece.placedCol,
        palette,
      );
      if (!guideCombo) {
        return true; // No guide, treat as incorrect
      }

      // Return true if colors don't match guide
      return !(
        piece.outerColor === guideCombo.outerColor &&
        piece.innerColor === guideCombo.innerColor
      );
    });

    // Animate each incorrectly placed tile to random on-board positions
    // (but not snapped to grid positions)
    for (let i = 0; i < incorrectlyPlaced.length; i += 1) {
      const piece = incorrectlyPlaced[i];

      // Generate random position on-board, but offset from grid alignment
      const randomRow = Math.floor(Math.random() * gridRows);
      const randomCol = Math.floor(Math.random() * gridCols);

      // Base grid position
      const gridX = boardRect.x + randomCol * pieceW;
      const gridY = boardRect.y + randomRow * pieceH;

      // Add random offset within ±20% of piece size to avoid grid alignment
      const offsetRange = Math.min(pieceW, pieceH) * 0.2;
      const offsetX = rand(-offsetRange, offsetRange);
      const offsetY = rand(-offsetRange, offsetRange);

      let relocatedX = gridX + offsetX;
      let relocatedY = gridY + offsetY;

      // Clamp to keep tile within board bounds
      relocatedX = clamp(
        relocatedX,
        boardRect.x,
        boardRect.x + boardRect.w - piece.canvas.width,
      );
      relocatedY = clamp(
        relocatedY,
        boardRect.y,
        boardRect.y + boardRect.h - piece.canvas.height,
      );

      piece.canvas.style.zIndex = String(1000 + i);
      piece.solved = false;
      piece.placedRow = null;
      piece.placedCol = null;

      await animatePieceToPosition(
        piece,
        relocatedX,
        relocatedY,
        animationDuration,
      );
      piece.x = relocatedX;
      piece.y = relocatedY;
      piece.canvas.style.left = `${relocatedX}px`;
      piece.canvas.style.top = `${relocatedY}px`;

      // Persist state after each tile movement
      saveGameState();
    }

    // Phase 2: Place unplaced tiles (Category 3) to correct positions
    setStatus("Placing tiles in correct positions...");

    // Rebuild occupancy map with only correctly placed tiles (Category 1)
    boardOccupancy.clear();
    solvedCount = 0;

    for (const piece of pieces) {
      if (piece.placedRow !== null && piece.placedCol !== null) {
        const guideCombo = getGuideCombo(
          piece.placedRow,
          piece.placedCol,
          palette,
        );
        if (
          guideCombo &&
          piece.outerColor === guideCombo.outerColor &&
          piece.innerColor === guideCombo.innerColor
        ) {
          // This is Category 1: correctly placed
          boardOccupancy.set(cellKey(piece.placedRow, piece.placedCol), piece);
          solvedCount += 1;
        }
      }
    }

    // Count how many tiles need to be placed (unplaced tiles)
    const unplacedTiles = pieces.filter(
      (p) => p.placedRow === null && p.placedCol === null,
    );
    console.log(
      `Phase 2: ${solvedCount} correctly placed, ${unplacedTiles.length} unplaced to place`,
    );

    // Place remaining unplaced tiles at their correct guide positions
    // For each unplaced tile, find which grid position its colors should occupy
    const unplacedPieces = pieces.filter(
      (p) => p.placedRow === null && p.placedCol === null,
    );

    for (const piece of unplacedPieces) {
      const { outerColor, innerColor } = piece;

      const target = solver.findSolveTargetForColors({
        outerColor,
        innerColor,
        gridRows,
        gridCols,
        boardOccupancy,
        cellKey,
        getGuideComboForCell: (row, col) => getGuideCombo(row, col, palette),
      });

      if (!target) {
        console.log(
          `Cannot place tile with colors outer:${outerColor} inner:${innerColor} - no matching guide position available`,
        );
        continue;
      }

      const key = cellKey(target.row, target.col);
      const targetX = boardRect.x + target.col * pieceW;
      const targetY = boardRect.y + target.row * pieceH;

      console.log(
        `Placing tile to [${target.row}, ${target.col}] from (${piece.x}, ${piece.y}) to (${targetX}, ${targetY})`,
      );

      await animatePieceToPosition(piece, targetX, targetY, animationDuration);

      piece.x = targetX;
      piece.y = targetY;
      piece.solved = true;
      piece.placedRow = target.row;
      piece.placedCol = target.col;
      piece.canvas.style.left = `${targetX}px`;
      piece.canvas.style.top = `${targetY}px`;
      piece.canvas.style.zIndex = String(1 + target.row * gridCols + target.col);

      boardOccupancy.set(key, piece);
      solvedCount += 1;

      // Persist state after each tile placement
      saveGameState();

      setStatus(
        `${solvedCount}/${pieces.length} ${STATUS_TEXT.tilesPlacedSuffix}`,
      );
    }

    console.log(
      `Phase 2 complete: ${solvedCount}/${pieces.length} tiles placed`,
    );

    const result = validateSolvedLayout();
    if (result.solved) {
      setStatus(STATUS_TEXT.solved);
    } else {
      setStatus(STATUS_TEXT.invalidSolved);
    }

    isSolving = false;
  }

  function validateSolvedLayout() {
    return solver.validateSolvedLayout({
      solvedCount,
      totalPieces: pieces.length,
      gridRows,
      gridCols,
      boardOccupancy,
      cellKey,
    });
  }

  function shuffleInPlace(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }
  }

  function createPalette(colorCount) {
    return BASE_PALETTE.slice(0, colorCount);
  }

  function renderPaletteLegend(size) {
    const palette = createPalette(size);
    paletteTitle.textContent = `Palette: ${size} colors`;
    paletteSwatches.replaceChildren();

    palette.forEach((color, index) => {
      const swatch = document.createElement("span");
      swatch.className = "palette-swatch";
      swatch.style.backgroundColor = color;
      swatch.setAttribute("title", `Color ${index + 1}: ${color}`);
      paletteSwatches.appendChild(swatch);
    });
  }

  function generateTileCombos() {
    const palette = createPalette(gridRows);
    const combos = [];

    for (let outer = 0; outer < palette.length; outer += 1) {
      for (let inner = 0; inner < palette.length; inner += 1) {
        combos.push({
          outerColor: palette[outer],
          innerColor: palette[inner],
        });
      }
    }

    shuffleInPlace(combos);
    tileCombos = [];

    for (let row = 0; row < gridRows; row += 1) {
      tileCombos[row] = [];
      for (let col = 0; col < gridCols; col += 1) {
        tileCombos[row][col] = combos[row * gridCols + col];
      }
    }
  }

  function createPieceCanvas(row, col) {
    const combo = tileCombos[row][col];
    const canvas = boardRenderer.createPieceCanvas({ combo, pieceW, pieceH });
    return { canvas, padding: 0 };
  }

  function buildBoardLayout() {
    const layout = boardRenderer.buildBoardLayout({
      playfield,
      board,
      boardOverlay,
      gridRows,
      gridCols,
      overlayOpacity,
      createPalette,
      hasNoEulerSquareSolution,
      getGuideCombo,
    });

    pieceW = layout.pieceW;
    pieceH = layout.pieceH;
    boardRect = layout.boardRect;
  }

  function shufflePieces() {
    solvedCount = 0;
    boardOccupancy.clear();

    pieces.forEach((piece) => {
      piece.solved = false;
      piece.placedRow = null;
      piece.placedCol = null;
      piece.canvas.style.pointerEvents = "auto";

      const maxX = boardRect.fieldW - piece.canvas.width - 6;
      const maxY = boardRect.fieldH - piece.canvas.height - 6;

      const x = rand(8, maxX);
      let y = rand(8, maxY);

      const avoidBoardX =
        x + piece.canvas.width > boardRect.x && x < boardRect.x + boardRect.w;
      const avoidBoardY =
        y + piece.canvas.height > boardRect.y && y < boardRect.y + boardRect.h;

      if (avoidBoardX && avoidBoardY) {
        const bottomZone = boardRect.y + boardRect.h + 12;
        if (bottomZone + piece.canvas.height < boardRect.fieldH) {
          y = rand(bottomZone, boardRect.fieldH - piece.canvas.height - 6);
        }
      }

      piece.x = x;
      piece.y = y;
      piece.canvas.style.left = `${x}px`;
      piece.canvas.style.top = `${y}px`;
      piece.canvas.style.zIndex = String(++zCounter);
    });

    setStatus(
      `${STATUS_TEXT.dragPrefix} ${gridRows}x${gridCols} ${STATUS_TEXT.genericTilesSuffix}`,
    );
  }

  function onPieceLiftedFromSolvedCell(piece) {
    if (piece.solved && piece.placedRow !== null && piece.placedCol !== null) {
      const previousKey = cellKey(piece.placedRow, piece.placedCol);
      boardOccupancy.delete(previousKey);
      piece.solved = false;
      piece.placedRow = null;
      piece.placedCol = null;
      solvedCount = Math.max(0, solvedCount - 1);
      setStatus(
        `${solvedCount}/${pieces.length} ${STATUS_TEXT.tilesPlacedSuffix}`,
      );
    }
  }

  function onPieceSnapped(piece, snapCell) {
      piece.x = snapCell.x;
      piece.y = snapCell.y;
      piece.solved = true;
      piece.placedRow = snapCell.row;
      piece.placedCol = snapCell.col;
      boardOccupancy.set(snapCell.key, piece);
      piece.canvas.style.left = `${snapCell.x}px`;
      piece.canvas.style.top = `${snapCell.y}px`;
      piece.canvas.style.zIndex = String(
        1 + snapCell.row * gridCols + snapCell.col,
      );
      solvedCount += 1;

      if (solvedCount === pieces.length) {
        const result = validateSolvedLayout();
        if (result.solved) {
          setStatus(STATUS_TEXT.solved);
        } else {
          setStatus(STATUS_TEXT.invalidSolved);
        }
      } else {
        setStatus(
          `${solvedCount}/${pieces.length} ${STATUS_TEXT.tilesPlacedSuffix}`,
        );
      }

      saveGameState();
  }

  inputController = inputControllerModule.create({
    playfield,
    getPieces: () => pieces,
    getBoardRect: () => boardRect,
    getPieceSize: () => ({ pieceW, pieceH }),
    getGridSize: () => ({ gridRows, gridCols }),
    getSnapDistance: () => SNAP_DISTANCE,
    cellKey,
    boardOccupancy,
    clamp,
    nextZIndex: () => ++zCounter,
    onPieceLiftedFromSolvedCell,
    onPieceSnapped,
  });

  function clearPieces() {
    pieces.forEach((piece) => {
      piece.canvas.remove();
    });
    pieces = [];
  }

  function buildPieces() {
    clearPieces();

    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols; col += 1) {
        const { canvas } = createPieceCanvas(row, col);

        const piece = {
          row,
          col,
          canvas,
          outerColor: tileCombos[row][col].outerColor,
          innerColor: tileCombos[row][col].innerColor,
          x: 0,
          y: 0,
          solved: false,
          placedRow: null,
          placedCol: null,
        };

        inputController.bindPiece(canvas);
        playfield.appendChild(canvas);
        pieces.push(piece);
      }
    }

    shufflePieces();
  }

  function rebuildGame() {
    buildBoardLayout();
    buildPieces();
  }

  function rebuildGamePreservingState() {
    const savedPieces = gameState.createPieceSnapshot({ pieces, boardRect });

    buildBoardLayout();
    boardOccupancy.clear();
    buildPieces();
    solvedCount = gameState.restorePiecesFromSnapshot({
      pieces,
      snapshot: savedPieces,
      boardRect,
      pieceW,
      pieceH,
      gridCols,
      boardOccupancy,
      cellKey,
    });
  }

  function startNewGame() {
    setStatus(STATUS_TEXT.preparing);
    generateTileCombos();
    rebuildGame();
    if (hasNoEulerSquareSolution()) {
      setStatus(
        `${STATUS_TEXT.dragPrefix} ${gridRows}x${gridCols} ${STATUS_TEXT.noSolutionSuffix}`,
      );
    } else {
      setStatus(
        `${STATUS_TEXT.dragPrefix} ${gridRows}x${gridCols} ${STATUS_TEXT.uniqueTilesSuffix}`,
      );
    }
    saveGameState();
  }

  function populateGridOptions() {
    for (let value = GRID_MIN; value <= GRID_MAX; value += 1) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = `${value}x${value}`;
      sizeSelect.appendChild(option);
    }

    sizeSelect.value = String(gridRows);
    renderPaletteLegend(gridRows);
  }

  function openMenu() {
    sideNav.classList.add("open");
    navBackdrop.classList.add("open");
    sideNav.setAttribute("aria-hidden", "false");
    navBackdrop.setAttribute("aria-hidden", "false");
  }

  function closeMenu() {
    sideNav.classList.remove("open");
    navBackdrop.classList.remove("open");
    sideNav.setAttribute("aria-hidden", "true");
    navBackdrop.setAttribute("aria-hidden", "true");
  }

  function openOverlay(pageKey) {
    const page = overlayPages[pageKey];
    if (!page) {
      return;
    }

    Object.values(overlayPages).forEach((item) => {
      item.element.classList.remove("active");
    });

    page.element.classList.add("active");
    overlayTitle.textContent = page.title;
    overlayRoot.hidden = false;
  }

  function closeOverlay() {
    overlayRoot.hidden = true;
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      rebuildGamePreservingState();
    }, 150);
  });

  inputController.bindDocument(document);

  menuBtn.addEventListener("click", openMenu);
  navCloseBtn.addEventListener("click", closeMenu);
  navBackdrop.addEventListener("click", closeMenu);

  navNewGame.addEventListener("click", () => {
    closeMenu();
    startNewGame();
  });

  navSolve.addEventListener("click", () => {
    closeMenu();
    solvePuzzle();
  });

  navOptions.addEventListener("click", () => {
    sizeSelect.value = String(gridRows);
    renderPaletteLegend(gridRows);
    openOverlay("options");
  });

  sizeSelect.addEventListener("change", () => {
    const nextSize = Number.parseInt(sizeSelect.value, 10);
    renderPaletteLegend(clamp(nextSize, GRID_MIN, GRID_MAX));
  });

  navAbout.addEventListener("click", () => {
    openOverlay("about");
  });

  navRules.addEventListener("click", () => {
    openOverlay("rules");
  });

  navInfo.addEventListener("click", () => {
    openOverlay("info");
  });

  overlayCloseBtn.addEventListener("click", closeOverlay);

  overlayRoot.addEventListener("click", (event) => {
    if (event.target === overlayRoot) {
      closeOverlay();
    }
  });

  applyOptionsBtn.addEventListener("click", () => {
    const nextSize = Number.parseInt(sizeSelect.value, 10);
    setGridSize(nextSize, nextSize);
    closeOverlay();
    closeMenu();
    startNewGame();
  });

  toggleOverlayBtn.addEventListener("click", () => {
    overlayOpacity = overlayOpacity === 0.2 ? 0 : 0.2;
    boardOverlay.style.opacity = String(overlayOpacity);
    toggleOverlayBtn.textContent =
      overlayOpacity === 0 ? UI_LABELS.showGuide : UI_LABELS.hideGuide;
  });

  populateGridOptions();
  const restored = restoreGameState();
  if (!restored) {
    startNewGame();
  } else {
    sizeSelect.value = String(gridRows);
  }
})();
