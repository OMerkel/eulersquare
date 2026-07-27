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
  let puzzleTexture = null;
  let tileCombos = [];
  let pieceW = 0;
  let pieceH = 0;
  let solvedCount = 0;
  let zCounter = 10;
  let gridRows = GRID_DEFAULT;
  let gridCols = GRID_DEFAULT;
  let isSolving = false;
  const boardOccupancy = new Map();

  const activeDrag = {
    piece: null,
    offsetX: 0,
    offsetY: 0,
  };

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
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    const state = {
      gridRows,
      gridCols,
      boardWidth,
      boardHeight,
      tileCombos: tileCombos.map((row) =>
        row.map((combo) => ({
          outerColor: combo.outerColor,
          innerColor: combo.innerColor,
        })),
      ),
      pieces: pieces.map((piece) => {
        const pieceData = {
          row: piece.row,
          col: piece.col,
          placedRow: piece.placedRow,
          placedCol: piece.placedCol,
          solved: piece.solved,
          outerColor: piece.outerColor,
          innerColor: piece.innerColor,
        };

        // For placed tiles, store grid position; for others, store relative position
        if (piece.placedRow === null || piece.placedCol === null) {
          pieceData.relX = boardWidth > 0 ? piece.x / boardWidth : 0;
          pieceData.relY = boardHeight > 0 ? piece.y / boardHeight : 0;
        }

        return pieceData;
      }),
    };
    localStorage.setItem("eulersquareState", JSON.stringify(state));
  }

  function restoreGameState() {
    try {
      const saved = localStorage.getItem("eulersquareState");
      if (!saved) {
        return false;
      }

      const state = JSON.parse(saved);
      if (
        !state.gridRows ||
        !state.gridCols ||
        !state.pieces ||
        !state.tileCombos
      ) {
        return false;
      }

      gridRows = state.gridRows;
      gridCols = state.gridCols;

      // Restore the exact tile combinations (colors) that were used
      tileCombos = state.tileCombos;
      buildBoardLayout();
      buildPieces();

      // Restore piece positions and state
      state.pieces.forEach((savedPiece, index) => {
        if (index < pieces.length) {
          const piece = pieces[index];
          piece.placedRow = savedPiece.placedRow;
          piece.placedCol = savedPiece.placedCol;
          piece.solved = savedPiece.solved;

          // For placed tiles, calculate position from grid coordinates
          if (piece.placedRow !== null && piece.placedCol !== null) {
            piece.x = boardRect.x + piece.placedCol * pieceW;
            piece.y = boardRect.y + piece.placedRow * pieceH;
            boardOccupancy.set(`${piece.placedRow}:${piece.placedCol}`, piece);
            piece.canvas.style.zIndex = String(
              1 + piece.placedRow * gridCols + piece.placedCol,
            );
            solvedCount += 1;
          } else {
            // For misplaced tiles, restore to scaled relative position
            if (
              savedPiece.relX !== undefined &&
              savedPiece.relY !== undefined
            ) {
              piece.x = savedPiece.relX * boardRect.width;
              piece.y = savedPiece.relY * boardRect.height;
            }
          }

          piece.canvas.style.left = `${piece.x}px`;
          piece.canvas.style.top = `${piece.y}px`;
        }
      });

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

      return true;
    } catch {
      return false;
    }
  }

  function setGridSize(nextRows, nextCols) {
    gridRows = clamp(nextRows, GRID_MIN, GRID_MAX);
    gridCols = clamp(nextCols, GRID_MIN, GRID_MAX);
  }

  function hasNoEulerSquareSolution() {
    return gridRows === gridCols && NO_SOLUTION_SIZES.has(gridRows);
  }

  function getGuideCombo(row, col, palette) {
    if (hasNoEulerSquareSolution()) {
      return null;
    }

    const template = EVEN_GUIDE_TEMPLATES[gridRows];
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
    return tileCombos[row][col];
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

      // Find the grid position where this tile's colors belong according to guide
      let targetRow = -1;
      let targetCol = -1;

      for (let row = 0; row < gridRows; row += 1) {
        for (let col = 0; col < gridCols; col += 1) {
          const key = cellKey(row, col);
          if (boardOccupancy.has(key)) {
            continue; // Position already occupied
          }

          const guideCombo = getGuideCombo(row, col, palette);
          if (
            guideCombo &&
            guideCombo.outerColor === outerColor &&
            guideCombo.innerColor === innerColor
          ) {
            targetRow = row;
            targetCol = col;
            break;
          }
        }
        if (targetRow !== -1) {
          break;
        }
      }

      if (targetRow === -1) {
        console.log(
          `Cannot place tile with colors outer:${outerColor} inner:${innerColor} - no matching guide position available`,
        );
        continue;
      }

      const key = cellKey(targetRow, targetCol);
      const targetX = boardRect.x + targetCol * pieceW;
      const targetY = boardRect.y + targetRow * pieceH;

      console.log(
        `Placing tile to [${targetRow}, ${targetCol}] from (${piece.x}, ${piece.y}) to (${targetX}, ${targetY})`,
      );

      await animatePieceToPosition(piece, targetX, targetY, animationDuration);

      piece.x = targetX;
      piece.y = targetY;
      piece.solved = true;
      piece.placedRow = targetRow;
      piece.placedCol = targetCol;
      piece.canvas.style.left = `${targetX}px`;
      piece.canvas.style.top = `${targetY}px`;
      piece.canvas.style.zIndex = String(1 + targetRow * gridCols + targetCol);

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

  function tryFindSnapCell(piece) {
    const col = Math.round((piece.x - boardRect.x) / pieceW);
    const row = Math.round((piece.y - boardRect.y) / pieceH);

    if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) {
      return null;
    }

    const snapX = boardRect.x + col * pieceW;
    const snapY = boardRect.y + row * pieceH;
    const dx = piece.x - snapX;
    const dy = piece.y - snapY;
    const snapTolerance = Math.max(
      4,
      Math.min(SNAP_DISTANCE, pieceW * 0.22, pieceH * 0.22),
    );
    const withinSnapWindow =
      Math.abs(dx) <= snapTolerance && Math.abs(dy) <= snapTolerance;

    if (!withinSnapWindow) {
      return null;
    }

    const key = cellKey(row, col);
    if (boardOccupancy.has(key)) {
      return null;
    }

    return { row, col, x: snapX, y: snapY, key };
  }

  function validateSolvedLayout() {
    if (solvedCount !== pieces.length) {
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
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const padding = 0;
    const combo = tileCombos[row][col];
    const tileSize = Math.min(pieceW, pieceH);

    canvas.width = Math.max(1, Math.floor(tileSize));
    canvas.height = Math.max(1, Math.floor(tileSize));
    canvas.className = "piece";

    ctx.fillStyle = combo.outerColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const innerXPos = canvas.width * 0.2;
    const innerYPos = canvas.height * 0.2;
    const innerW = canvas.width * 0.6;
    const innerH = canvas.height * 0.6;

    ctx.fillStyle = combo.innerColor;
    ctx.fillRect(innerXPos, innerYPos, innerW, innerH);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(0.375, canvas.width * 0.00875);
    ctx.strokeRect(innerXPos, innerYPos, innerW, innerH);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    return { canvas, padding };
  }

  function buildBoardLayout() {
    const fieldW = playfield.clientWidth;
    const fieldH = playfield.clientHeight;
    const margin = 8;
    const maxBoardW = Math.max(80, fieldW - margin * 2);
    const maxBoardH = Math.max(80, fieldH - margin * 2);
    const tileSize = Math.max(
      8,
      Math.floor(Math.min(maxBoardW / gridCols, maxBoardH / gridRows)),
    );
    const boardW = tileSize * gridCols;
    const boardH = tileSize * gridRows;

    pieceW = tileSize;
    pieceH = tileSize;

    const boardX = Math.round((fieldW - boardW) / 2);
    const boardY = Math.round((fieldH - boardH) / 2);

    const textureW = boardW;
    const textureH = boardH;
    puzzleTexture = document.createElement("canvas");
    puzzleTexture.width = textureW;
    puzzleTexture.height = textureH;
    const tctx = puzzleTexture.getContext("2d");
    tctx.clearRect(0, 0, textureW, textureH);
    const palette = createPalette(gridRows);
    const noSolution = hasNoEulerSquareSolution();

    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols; col += 1) {
        const combo = getGuideCombo(row, col, palette);
        const x = col * pieceW;
        const y = row * pieceH;
        const innerX = x + pieceW * 0.2;
        const innerY = y + pieceH * 0.2;
        const innerW = pieceW * 0.6;
        const innerH = pieceH * 0.6;

        tctx.fillStyle = combo ? combo.outerColor : "#8c564b";
        tctx.fillRect(x, y, pieceW, pieceH);

        tctx.fillStyle = combo ? combo.innerColor : "#f3ecd6";
        tctx.fillRect(innerX, innerY, innerW, innerH);

        tctx.strokeStyle = "#000000";
        tctx.lineWidth = Math.max(0.375, pieceW * 0.00875);
        tctx.strokeRect(innerX, innerY, innerW, innerH);

        if (noSolution) {
          tctx.fillStyle = "rgba(21, 33, 47, 0.82)";
          tctx.font = `${Math.max(16, Math.floor(pieceW * 0.52))}px Candara, Segoe UI, sans-serif`;
          tctx.textAlign = "center";
          tctx.textBaseline = "middle";
          tctx.fillText("?", x + pieceW * 0.5, y + pieceH * 0.5);
        }
      }
    }

    board.style.left = `${boardX}px`;
    board.style.top = `${boardY}px`;
    board.style.width = `${boardW}px`;
    board.style.height = `${boardH}px`;

    boardOverlay.style.left = `${boardX}px`;
    boardOverlay.style.top = `${boardY}px`;
    boardOverlay.style.width = `${boardW}px`;
    boardOverlay.style.height = `${boardH}px`;
    boardOverlay.style.backgroundImage = `url(${puzzleTexture.toDataURL("image/png")})`;
    boardOverlay.style.backgroundSize = "100% 100%";
    boardOverlay.style.opacity = String(overlayOpacity);

    boardRect = {
      x: boardX,
      y: boardY,
      w: boardW,
      h: boardH,
      fieldW,
      fieldH,
    };
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

  function onPointerDown(event) {
    const piece = pieces.find((p) => p.canvas === event.currentTarget);
    if (!piece) {
      return;
    }

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

    activeDrag.piece = piece;
    const rect = piece.canvas.getBoundingClientRect();
    const fieldRect = playfield.getBoundingClientRect();

    activeDrag.offsetX = event.clientX - rect.left;
    activeDrag.offsetY = event.clientY - rect.top;

    piece.canvas.classList.add("dragging");
    piece.canvas.style.zIndex = String(++zCounter);

    piece.dragBoundary = {
      left: fieldRect.left,
      top: fieldRect.top,
      right: fieldRect.right,
      bottom: fieldRect.bottom,
    };

    event.preventDefault();
  }

  function onPointerMove(event) {
    const piece = activeDrag.piece;
    if (!piece) {
      return;
    }

    const bounds = piece.dragBoundary;
    const localX = clamp(
      event.clientX - bounds.left - activeDrag.offsetX,
      0,
      boardRect.fieldW - piece.canvas.width,
    );
    const localY = clamp(
      event.clientY - bounds.top - activeDrag.offsetY,
      0,
      boardRect.fieldH - piece.canvas.height,
    );

    piece.x = localX;
    piece.y = localY;
    piece.canvas.style.left = `${localX}px`;
    piece.canvas.style.top = `${localY}px`;
  }

  function onPointerUp() {
    const piece = activeDrag.piece;
    if (!piece) {
      return;
    }

    piece.canvas.classList.remove("dragging");
    const snapCell = tryFindSnapCell(piece);

    if (snapCell) {
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

    activeDrag.piece = null;
  }

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

        canvas.addEventListener("pointerdown", onPointerDown);
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
    // Save old board dimensions
    const oldBoardWidth = boardRect.width;
    const oldBoardHeight = boardRect.height;

    // Save current piece state before rebuild
    const savedPieces = pieces.map((piece) => {
      const pieceData = {
        placedRow: piece.placedRow,
        placedCol: piece.placedCol,
        solved: piece.solved,
      };

      // For misplaced tiles, store relative position based on old board size
      if (piece.placedRow === null || piece.placedCol === null) {
        pieceData.relX = oldBoardWidth > 0 ? piece.x / oldBoardWidth : 0;
        pieceData.relY = oldBoardHeight > 0 ? piece.y / oldBoardHeight : 0;
      }

      return pieceData;
    });

    buildBoardLayout();
    boardOccupancy.clear();
    buildPieces();

    // Restore saved positions to rebuilt pieces
    pieces.forEach((piece, index) => {
      if (index < savedPieces.length) {
        const saved = savedPieces[index];
        piece.placedRow = saved.placedRow;
        piece.placedCol = saved.placedCol;
        piece.solved = saved.solved;

        // For placed tiles, calculate position from grid coordinates
        if (piece.placedRow !== null && piece.placedCol !== null) {
          piece.x = boardRect.x + piece.placedCol * pieceW;
          piece.y = boardRect.y + piece.placedRow * pieceH;
          boardOccupancy.set(`${piece.placedRow}:${piece.placedCol}`, piece);
          piece.canvas.style.zIndex = String(
            1 + piece.placedRow * gridCols + piece.placedCol,
          );
        } else {
          // For misplaced tiles, restore to scaled relative position
          if (saved.relX !== undefined && saved.relY !== undefined) {
            piece.x = saved.relX * boardRect.width;
            piece.y = saved.relY * boardRect.height;
          }
        }

        piece.canvas.style.left = `${piece.x}px`;
        piece.canvas.style.top = `${piece.y}px`;
      }
    });

    // Recalculate solvedCount based on restored piece state
    solvedCount = pieces.filter(
      (piece) => piece.placedRow !== null && piece.placedCol !== null,
    ).length;
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

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

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
