(() => {
  function createPersistedState({ gridRows, gridCols, boardRect, tileCombos, pieces }) {
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    return {
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

        if (piece.placedRow === null || piece.placedCol === null) {
          pieceData.relX = boardWidth > 0 ? piece.x / boardWidth : 0;
          pieceData.relY = boardHeight > 0 ? piece.y / boardHeight : 0;
        }

        return pieceData;
      }),
    };
  }

  function parsePersistedState(rawState) {
    if (!rawState) {
      return null;
    }

    try {
      const state = JSON.parse(rawState);
      if (!state.gridRows || !state.gridCols || !state.pieces || !state.tileCombos) {
        return null;
      }
      return state;
    } catch {
      return null;
    }
  }

  function createPieceSnapshot({ pieces, boardRect }) {
    const oldBoardWidth = boardRect.width;
    const oldBoardHeight = boardRect.height;

    return pieces.map((piece) => {
      const pieceData = {
        placedRow: piece.placedRow,
        placedCol: piece.placedCol,
        solved: piece.solved,
      };

      if (piece.placedRow === null || piece.placedCol === null) {
        pieceData.relX = oldBoardWidth > 0 ? piece.x / oldBoardWidth : 0;
        pieceData.relY = oldBoardHeight > 0 ? piece.y / oldBoardHeight : 0;
      }

      return pieceData;
    });
  }

  function restorePiecesFromSnapshot({
    pieces,
    snapshot,
    boardRect,
    pieceW,
    pieceH,
    gridCols,
    boardOccupancy,
    cellKey,
  }) {
    let solvedCount = 0;

    pieces.forEach((piece, index) => {
      if (index >= snapshot.length) {
        return;
      }

      const saved = snapshot[index];
      piece.placedRow = saved.placedRow;
      piece.placedCol = saved.placedCol;
      piece.solved = saved.solved;

      if (piece.placedRow !== null && piece.placedCol !== null) {
        piece.x = boardRect.x + piece.placedCol * pieceW;
        piece.y = boardRect.y + piece.placedRow * pieceH;
        boardOccupancy.set(cellKey(piece.placedRow, piece.placedCol), piece);
        piece.canvas.style.zIndex = String(
          1 + piece.placedRow * gridCols + piece.placedCol,
        );
        solvedCount += 1;
      } else if (saved.relX !== undefined && saved.relY !== undefined) {
        piece.x = saved.relX * boardRect.width;
        piece.y = saved.relY * boardRect.height;
      }

      piece.canvas.style.left = `${piece.x}px`;
      piece.canvas.style.top = `${piece.y}px`;
    });

    return solvedCount;
  }

  window.EulerSquareGameState = Object.freeze({
    createPersistedState,
    parsePersistedState,
    createPieceSnapshot,
    restorePiecesFromSnapshot,
  });
})();
