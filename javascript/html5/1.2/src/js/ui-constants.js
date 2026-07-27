(() => {
  const DOM_IDS = Object.freeze({
    playfield: "playfield",
    board: "board",
    boardOverlay: "board-overlay",
    status: "status",
    toggleOverlayBtn: "toggleOverlayBtn",
    menuBtn: "menuBtn",
    sideNav: "sideNav",
    navBackdrop: "navBackdrop",
    navCloseBtn: "navCloseBtn",
    navNewGame: "navNewGame",
    navSolve: "navSolve",
    navOptions: "navOptions",
    navAbout: "navAbout",
    navRules: "navRules",
    navInfo: "navInfo",
    overlayRoot: "overlayRoot",
    overlayTitle: "overlayTitle",
    overlayCloseBtn: "overlayCloseBtn",
    sizeSelect: "sizeSelect",
    paletteTitle: "paletteTitle",
    paletteSwatches: "paletteSwatches",
    applyOptionsBtn: "applyOptionsBtn",
  });

  const OVERLAY_PAGES = Object.freeze({
    options: Object.freeze({
      title: "Options",
      elementId: "page-options",
    }),
    about: Object.freeze({
      title: "About",
      elementId: "page-about",
    }),
    rules: Object.freeze({
      title: "Rules",
      elementId: "page-rules",
    }),
    info: Object.freeze({
      title: "Info",
      elementId: "page-info",
    }),
  });

  const UI_LABELS = Object.freeze({
    showGuide: "Show Guide",
    hideGuide: "Hide Guide",
  });

  const UI_BEHAVIOR = Object.freeze({
    SNAP_DISTANCE: 20,
  });

  const STATUS_TEXT = Object.freeze({
    preparing: "Preparing color tiles...",
    solved:
      "Puzzle solved. Congratulations! Unique outer/inner colors per row and column!",
    invalidSolved:
      "All tiles placed, but row/column color uniqueness is not satisfied.",
    tilesPlacedSuffix: "tiles placed.",
    dragPrefix: "Drag pieces onto the board.",
    genericTilesSuffix: "tiles.",
    uniqueTilesSuffix: "unique color paired tiles.",
    noSolutionSuffix:
      "has no Euler-square solution; guide shows question marks.",
  });

  window.EulerSquareUiConstants = Object.freeze({
    DOM_IDS,
    OVERLAY_PAGES,
    UI_LABELS,
    UI_BEHAVIOR,
    STATUS_TEXT,
  });
})();
