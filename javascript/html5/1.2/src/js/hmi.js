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
			rebuildGame();
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
	startNewGame();
})();
