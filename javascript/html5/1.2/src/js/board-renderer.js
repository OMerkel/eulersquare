(() => {
  function createPieceCanvas({ combo, pieceW, pieceH }) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
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

    return canvas;
  }

  function buildBoardLayout({
    playfield,
    board,
    boardOverlay,
    gridRows,
    gridCols,
    overlayOpacity,
    createPalette,
    hasNoEulerSquareSolution,
    getGuideCombo,
  }) {
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

    const boardX = Math.round((fieldW - boardW) / 2);
    const boardY = Math.round((fieldH - boardH) / 2);

    const texture = document.createElement("canvas");
    texture.width = boardW;
    texture.height = boardH;
    const tctx = texture.getContext("2d");
    tctx.clearRect(0, 0, boardW, boardH);
    const palette = createPalette(gridRows);
    const noSolution = hasNoEulerSquareSolution();

    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols; col += 1) {
        const combo = getGuideCombo(row, col, palette);
        const x = col * tileSize;
        const y = row * tileSize;
        const innerX = x + tileSize * 0.2;
        const innerY = y + tileSize * 0.2;
        const innerW = tileSize * 0.6;
        const innerH = tileSize * 0.6;

        tctx.fillStyle = combo ? combo.outerColor : "#8c564b";
        tctx.fillRect(x, y, tileSize, tileSize);

        tctx.fillStyle = combo ? combo.innerColor : "#f3ecd6";
        tctx.fillRect(innerX, innerY, innerW, innerH);

        tctx.strokeStyle = "#000000";
        tctx.lineWidth = Math.max(0.375, tileSize * 0.00875);
        tctx.strokeRect(innerX, innerY, innerW, innerH);

        if (noSolution) {
          tctx.fillStyle = "rgba(21, 33, 47, 0.82)";
          tctx.font = `${Math.max(16, Math.floor(tileSize * 0.52))}px Candara, Segoe UI, sans-serif`;
          tctx.textAlign = "center";
          tctx.textBaseline = "middle";
          tctx.fillText("?", x + tileSize * 0.5, y + tileSize * 0.5);
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
    boardOverlay.style.backgroundImage = `url(${texture.toDataURL("image/png")})`;
    boardOverlay.style.backgroundSize = "100% 100%";
    boardOverlay.style.opacity = String(overlayOpacity);

    return {
      pieceW: tileSize,
      pieceH: tileSize,
      boardRect: {
        x: boardX,
        y: boardY,
        w: boardW,
        h: boardH,
        width: boardW,
        height: boardH,
        fieldW,
        fieldH,
      },
    };
  }

  window.EulerSquareBoardRenderer = Object.freeze({
    createPieceCanvas,
    buildBoardLayout,
  });
})();
