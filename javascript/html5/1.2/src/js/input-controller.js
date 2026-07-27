(() => {
  function create(config) {
    const activeDrag = {
      piece: null,
      offsetX: 0,
      offsetY: 0,
    };

    function tryFindSnapCell(piece) {
      const boardRect = config.getBoardRect();
      const { pieceW, pieceH } = config.getPieceSize();
      const { gridRows, gridCols } = config.getGridSize();
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
        Math.min(config.getSnapDistance(), pieceW * 0.22, pieceH * 0.22),
      );
      const withinSnapWindow =
        Math.abs(dx) <= snapTolerance && Math.abs(dy) <= snapTolerance;

      if (!withinSnapWindow) {
        return null;
      }

      const key = config.cellKey(row, col);
      if (config.boardOccupancy.has(key)) {
        return null;
      }

      return { row, col, x: snapX, y: snapY, key };
    }

    function onPointerDown(event) {
      const piece = config
        .getPieces()
        .find((candidate) => candidate.canvas === event.currentTarget);
      if (!piece) {
        return;
      }

      if (piece.solved && piece.placedRow !== null && piece.placedCol !== null) {
        config.onPieceLiftedFromSolvedCell(piece);
      }

      activeDrag.piece = piece;
      const rect = piece.canvas.getBoundingClientRect();
      const fieldRect = config.playfield.getBoundingClientRect();

      activeDrag.offsetX = event.clientX - rect.left;
      activeDrag.offsetY = event.clientY - rect.top;

      piece.canvas.classList.add("dragging");
      piece.canvas.style.zIndex = String(config.nextZIndex());

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

      const boardRect = config.getBoardRect();
      const bounds = piece.dragBoundary;
      const localX = config.clamp(
        event.clientX - bounds.left - activeDrag.offsetX,
        0,
        boardRect.fieldW - piece.canvas.width,
      );
      const localY = config.clamp(
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
        config.onPieceSnapped(piece, snapCell);
      }

      activeDrag.piece = null;
    }

    function bindPiece(canvas) {
      canvas.addEventListener("pointerdown", onPointerDown);
    }

    function bindDocument(doc) {
      doc.addEventListener("pointermove", onPointerMove);
      doc.addEventListener("pointerup", onPointerUp);
      doc.addEventListener("pointercancel", onPointerUp);
    }

    return Object.freeze({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      bindPiece,
      bindDocument,
    });
  }

  window.EulerSquareInputController = Object.freeze({
    create,
  });
})();
