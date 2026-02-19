export function setupCanvas(ctx, style) {
  ctx.fillStyle = style.fillStyle;
  ctx.font = style.font;
  ctx.textAlign = style.textAlign;
  ctx.textBaseline = style.textBaseline;
}

function drawScientific(ctx, base, exp, x, y) {
  ctx.save();

  ctx.font = "15px Computer Modern Serif";
  ctx.fillText(base, x, y);

  const baseWidth = ctx.measureText(base).width;

  ctx.font = "11px Computer Modern Serif";
  ctx.fillText(exp.toString(), x + baseWidth - 1, y - 8);

  ctx.restore();
}

function drawBlock(ctx, block, cameraX, blockAlpha) {
  if (!block) return;

  const screenX = block.x - cameraX;
  const screenY = block.y - block.height;

  ctx.save();
  ctx.globalAlpha = blockAlpha;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, screenY, block.width, block.height);

  ctx.fillText(
    "x = " + Math.round(block.x),
    screenX + block.width / 2,
    320
  );

  // mass label
  const labelX = screenX + block.width / 2;
  const labelY = screenY - 10;

  if (block.mass >= 1000) {
    const exp = Math.floor(Math.log10(block.mass));
    drawScientific(ctx, "10", exp, labelX - 10, labelY);
    ctx.fillText(" kg", labelX + 20, labelY);
  } else {
    ctx.fillText(block.mass + " kg", labelX, labelY);
  }

  ctx.restore();
}

/**
 * Render one frame (axis + blocks).
 * viewState: { cameraX, axisProgress, blocksVisible, blockAlpha }
 * simState: { refBlock, bigBlock }
 */
export function renderFrame(ctx, canvas, viewState, simState) {
  const { cameraX, axisProgress, blockAlpha } = viewState;
  const { refBlock, bigBlock } = simState;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const axisWidth = (canvas.width + cameraX) * axisProgress;
  const axisHeight = 300 * axisProgress;

  // axis
  ctx.fillRect(0 - cameraX, 298, axisWidth, 1);
  ctx.fillRect(0 - cameraX, 298 - axisHeight, 1, axisHeight);

  // blocks
  drawBlock(ctx, refBlock, cameraX, blockAlpha);
  drawBlock(ctx, bigBlock, cameraX, blockAlpha);
}