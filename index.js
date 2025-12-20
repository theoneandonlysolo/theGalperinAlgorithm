const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "white";
ctx.font = "15px Times New Roman";
ctx.textAlign = "center";
ctx.textBaseline = "middle"
ctx.fillRect(0, 298, 600, 2); // x axis
ctx.fillRect(0, 0, 2, 300); // y axis

const block1 = {
  mass: 1,          // kg
  x: 50,           // pixels from left
  y: 297,           // pixels from top (we’ll set this to sit on the axis)
  width: 100,        // block width in px
  height: 100,       // block height in px
  vx: 0             // horizontal velocity (px / second) – 0 for now
};

function drawBlock(ctx, block) {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;             // color of the block
  ctx.strokeRect(block.x, block.y - block.height, block.width, block.height);
  
  const centerX = block.x + block.width / 2;
  const centerY = block.y - block.height / 2;
  ctx.fillText(block.mass + " kg", centerX, centerY);
}

drawBlock(ctx, block1);