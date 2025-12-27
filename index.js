//basics, setting the env
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const input = document.getElementById("digitsInput");
const setButton = document.getElementById("setNBtn");
const collisionCounter = document.getElementById("collisions");
const simulationTermination = document.getElementById("simulationTermination");

//styles
ctx.fillStyle = "white";
ctx.font = "15px Times New Roman";
ctx.textAlign = "center";
ctx.textBaseline = "middle"


//storing n (n=1 by def)
let n = 1; 
let running = null;
let cameraX = 0;
let cameraFrozen = false;


//setting variables
let refBlock = null;
let bigBlock = null;
let collisions = null;

function setVariables() {
  collisions = 0;
  cameraX = 0;

  refBlock = {
    mass: 1,          // kg
    x: 50,           // pixels from left
    y: 297,           // pixels from top (we’ll set this to sit on the axis)
    width: 50,        // block width in px
    height: 50,       // block height in px
    vx: 0             // horizontal velocity (px / second) – 0 for now
  };

  bigBlock = {
    mass: 100 ** n,    
    x: 350,
    y: 297,
    width: 75,
    height: 75,
    vx: -50            // moving left
  };
}

//draw block function for the ref and big blocks
function drawBlock(ctx, block) {
  if (!block) return;

  const screenX = block.x - cameraX;
  const screenY = block.y - block.height;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, screenY, block.width, block.height);

  ctx.fillText("x = " + Math.round(block.x),
    screenX + block.width / 2,
    320
  );
  ctx.fillText(block.mass + " kg",
    screenX + block.width / 2,
    screenY - 10
  );

}


//checking if simulation is terminated
let lastTime = null;
function checkTermination() {
  const expected = Math.floor(Math.PI * Math.pow(10, n));

  // 1. When π-based collision count is reached → freeze camera
  if (!cameraFrozen && collisions >= expected) {
    cameraFrozen = true;
    console.log("camera frozen — pi limit reached");
  }

  // 2. Once camera is frozen, wait until BOTH blocks exit screen
  if (cameraFrozen) {
    const smallGone = (refBlock.x - cameraX) + 1 > canvas.width;
    const bigGone   = (bigBlock.x - cameraX) + 1 > canvas.width;

    if (smallGone && bigGone) {
      running = false;
      console.log("sim terminated after drift-off");
      console.log("total collisions =", collisions);
      simulationTermination.textContent = "simulation terminate";
    }
  }
}


  let lastCollision = null;

  function updateCollision(value) {
    if (value !== lastCollision) {
      console.log("collisions:", value)
      lastCollision = value;
    }
  }

  // animation function
function animate(time) {
  
  if (!running) {
    updateRunning(running);
    return;
  }
  requestAnimationFrame(animate);


  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  //clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw axes
  ctx.fillRect(0 - cameraX, 298, canvas.width + cameraX, 2); // long axis with moving camera, aka cameraX variable
  ctx.fillRect(0 - cameraX, 0, 2, 300);

  // physics in small substeps
  const steps = 200;
  for (let i = 0; i < steps; i++) {
    const dt2 = dt / steps;

    // move
    refBlock.x += refBlock.vx * dt2;
    bigBlock.x += bigBlock.vx * dt2;

    // update positions 
    // console.log("refBlock:", refBlock);
    // console.log("bigBlock:", bigBlock);

    // 1. wall bounce — only if moving left
    if (refBlock.x < 0) {
      refBlock.x = 0;
      if (refBlock.vx < 0) {
        refBlock.vx *= -1;
        collisions++;
      }
    }

    // 2. block–block collision — only if small isn't stuck on wall
    if (bigBlock.x <= refBlock.x + refBlock.width) {
      bigBlock.x = refBlock.x + refBlock.width;

      const m1 = refBlock.mass;
      const m2 = bigBlock.mass;
      const u1 = refBlock.vx;
      const u2 = bigBlock.vx;

      const v1 =
        ((m1 - m2) / (m1 + m2)) * u1 +
        (2 * m2 / (m1 + m2)) * u2;

      const v2 =
        (2 * m1 / (m1 + m2)) * u1 +
        ((m2 - m1) / (m1 + m2)) * u2;

      refBlock.vx = v1;
      bigBlock.vx = v2;
      collisions++;
    }
  }


  // CAMERA FOLLOW – keep largest x visible
      const rightmost = Math.max(
    refBlock.x + refBlock.width,
    bigBlock.x + bigBlock.width
  );

   const leftmost = Math.min(
    refBlock.x + refBlock.width,
    bigBlock.x + bigBlock.width
  );



  updateCollision(collisions);
  collisionCounter.textContent = `# of collisions: ${collisions}`


  checkTermination();

  // ONLY move camera if not frozen
if (!cameraFrozen) {
  const rightmost = Math.max(
    refBlock.x + refBlock.width,
    bigBlock.x + bigBlock.width
  );
  const expected = Math.floor(Math.PI * Math.pow(10, n));
  const margin = 200;
  if (rightmost > canvas.width - margin && collisions - 1 === expected) {
    cameraX = rightmost - (canvas.width - margin);
  } else {
    cameraX = leftmost - (canvas.width - margin);
  }
}
  // clamp so we never scroll into empty left space
if (cameraX < 0) cameraX = 0;

  ctx.fillRect(0 - cameraX, 298, canvas.width + cameraX, 2);
  ctx.fillRect(0 - cameraX, 0, 2, 300);

  drawBlock(ctx, refBlock);
  drawBlock(ctx, bigBlock);
  
}


setButton.addEventListener("click", () => {
  let newN = Number(input.value);
  console.clear();
  simulationTermination.textContent = ""

  //restricting n between 0 and 4, because if its superior to 4, the mass and therefore physics would be too much for the average browser to handle
  if (newN < 0) newN = 0;
  if (newN > 4) newN = 4;

  n = newN;
  input.value = n; //reset input visually if needed
  console.log("new n = ", n);

  setVariables();
  lastTime = null;              // resets simulation time
  running = true;
  cameraFrozen = false;
  requestAnimationFrame(animate);
});