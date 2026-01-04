
//basics, setting the env
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const input = document.getElementById("digitsInput");
const setButton = document.getElementById("setNBtn");
const collisionCounter = document.getElementById("collisions");
const simulationTermination = document.getElementById("simulationTermination");
const collisionSound = new Audio("assets/beep.mp3");

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
let blocksVisible = false;
let blockAlpha = 0;          // 0 => 1 fade-in
const fadeDuration = 1;    // seconds
let axisProgress = 0;        // 0 => 1
const axisDuration = 1.5;    // seconds
let axisAnimating = false;


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
    y: 297,           // pixels from top
    width: 50,        // block width in px
    height: 50,       // block height in px
    vx: 0             // horizontal velocity 
  };

  bigBlock = {
    mass: 100 ** n,    
    x: 350,
    y: 297,
    width: 75,
    height: 75,
    vx: -100            // moving left
  };
}

//draw block function for the ref and big blocks
function drawBlock(ctx, block) {
  if (!block) return;

  const screenX = block.x - cameraX;
  const screenY = block.y - block.height;

  ctx.save();
  ctx.globalAlpha = blockAlpha;   // fade factor

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

  ctx.restore();
}

const fullPi = "π = 3.14159265359";
let piShown = false;

function showPiResult(n) {
  if (piShown) return;          // prevent running twice
  piShown = true;

  // create the paragraph under #typewriter
  const pPi = document.createElement("p");
  pPi.id = "pi-output";
  document.querySelector(".crt-content").insertBefore(
    pPi,
    document.getElementById("appear")
  );

  // number of digits after decimal we really computed  

  const digits = "3.1415926535897932384626433832795...";
  const before = "π = "

const highlighted =
  `<span class="highlight">${digits.slice(0, n + 2)}</span>` +
  digits.slice(n + 2);

  // typewriter animation 
  let i = 0;
  const temp = document.createElement("span");
  pPi.appendChild(temp);

  const target = before + highlighted;

  pPi.style.opacity = 1;


  function type() {
    if (i <= target.length) {
      temp.innerHTML = target.slice(0, i);
      i++;
      setTimeout(type, 30);
    }
  }

  type();
}

//checking if simulation is terminated
let lastTime = null;
let reachedPiTime = null;

function checkTermination() {
  const expected = Math.floor(Math.PI * Math.pow(10, n));

  if (!cameraFrozen && collisions >= expected) {
    cameraFrozen = true;
    reachedPiTime = performance.now();     // start timer
    console.log("camera frozen pi limit reached");
  }

  if (cameraFrozen && reachedPiTime !== null) {
    const elapsed = performance.now() - reachedPiTime;

    if (elapsed >= 3000 && !piShown) {     // 5 seconds
      showPiResult(n);
    }
  }

  if (cameraFrozen) {
    const smallGone = (refBlock.x - cameraX) - 10  > canvas.width;
    const bigGone   = (bigBlock.x - cameraX)  > canvas.width;

    if (smallGone && bigGone) {
      running = false;

      console.log("sim terminated after drift-off");
      console.log("total collisions =", collisions);
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

function playCollisionSound() {
  collisionSound.currentTime = 0; 
  // collisionSound.play();
}

  // animation function
function animate(time) {
  
  if (!running) return;
  requestAnimationFrame(animate);


  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  //clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);



// axis animation
if (axisAnimating) {
  axisProgress += dt / axisDuration;
  if (axisProgress >= 1) {
    axisProgress = 1;
    axisAnimating = false;
  }
}

// X axis extends right
const axisWidth = (canvas.width + cameraX) * axisProgress;

// Y axis extends upward
const axisHeight = 300 * axisProgress;

// draw animated axes
ctx.fillRect(0 - cameraX, 298, axisWidth, 1);          // X axis
ctx.fillRect(0 - cameraX, 298 - axisHeight, 1, axisHeight);  // Y axis


const axisCoversBig =
  axisWidth >= (bigBlock.x + bigBlock.width - cameraX);

if (!blocksVisible && axisCoversBig) {
  blocksVisible = true;
}


if (blocksVisible && blockAlpha < 1) {
  blockAlpha += dt / fadeDuration;
  if (blockAlpha > 1) blockAlpha = 1;
}
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

    // 1. wall bounce  only if moving left
    // if (refBlock.x < 0) {
    //   refBlock.x = 0;
    //   if (refBlock.vx < 0) {
    //     refBlock.vx *= -1;
    //     collisions++;
    //   }
    // }

    if (refBlock.x <= 0 && refBlock.vx < 0) {
      refBlock.x = 0;
      refBlock.vx = -refBlock.vx;
      collisions++;
      playCollisionSound();
    }

    // 2. block–block collision  only if small isn't stuck on wall
    // if (bigBlock.x <= refBlock.x + refBlock.width) {
    //   bigBlock.x = refBlock.x + refBlock.width;

    //   const m1 = refBlock.mass;
    //   const m2 = bigBlock.mass;
    //   const u1 = refBlock.vx;
    //   const u2 = bigBlock.vx;

    //   const v1 =
    //     ((m1 - m2) / (m1 + m2)) * u1 +
    //     (2 * m2 / (m1 + m2)) * u2;

    //   const v2 =
    //     (2 * m1 / (m1 + m2)) * u1 +
    //     ((m2 - m1) / (m1 + m2)) * u2;

    //   refBlock.vx = v1;
    //   bigBlock.vx = v2;
    //   collisions++;
    // }
    if (
        bigBlock.x <= refBlock.x + refBlock.width &&
        bigBlock.vx < refBlock.vx      // must be moving TOWARD each other
      ) {
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
        playCollisionSound();
      }
  }


  // CAMERA FOLLOW keep largest x visible
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

  drawBlock(ctx, refBlock);
  drawBlock(ctx, bigBlock);

  
}



// setButton.addEventListener("click", () => {
  
//   let newN = Number(input.value);
//   console.clear();
//   simulationTermination.textContent = ""

//   //restricting n between 0 and 6, because if its superior to 6, the mass and therefore physics would be too much for the average browser to handle
//   if (newN < 0) newN = 0;
//   if (newN > 6) newN = 4;

//   n = newN;
//   input.value = n; //reset input visually if needed
//   console.log("new n = ", n);

//   setVariables();
//   blocksVisible = false;
//   blockAlpha = 0;
//   lastTime = null;              // resets simulation time

//     // reset axis animation
//   axisProgress = 0;
//   axisAnimating = true;

//   running = true;
//   cameraFrozen = false;
//   requestAnimationFrame(animate);
// });

//intro text
const text = `In 2003, physicist Gregory Galperin published a research paper showing how an idealized elastic collision simulation between two blocks can be used to compute digits of π. The setup is famously absurd in its inefficiency, requiring exponentially more collisions, and thus time, to reveal each additional digit, and it has since become known in the mathematics community as one of the most comically impractical ways to approximate π. But we couldn’t possibly pass up the chance to try it out for ourselves, could we? So let’s go ahead;

How many digits of π would you like to compute today? `;

const p = document.getElementById("typewriter");

// split text into "before" and "last line"
const lines = text.split("\n");
const lastLine = lines.pop();             
const beforeText = lines.join("\n") + "\n"; 

const normalSpan = document.createElement("span");
const boldSpan   = document.createElement("strong");

const cursor = document.createElement("span");
cursor.className = "cursor";
cursor.textContent = ""; 

// put them in the paragraph in order
p.appendChild(normalSpan);
p.appendChild(boldSpan);
p.appendChild(cursor);

let i = 0;  
let j = 0;  
let phase = "normal"; 
let typingDone = false;
let userInput = "";

function type() {
  if (phase === "normal") {
    if (i < beforeText.length) {
      normalSpan.textContent += beforeText[i];
      i++;
      setTimeout(type, 1); //typing speed, og is 25
    } else {
      phase = "bold";   
      setTimeout(type, 500); 
    }
  } else if (phase === "bold") {
    if (j < lastLine.length) {
      boldSpan.textContent += lastLine[j];
      j++;
      setTimeout(type, 25);
      if (j === 53) {
        typingDone = true;
      }
    }
  }
}

type();


const canvasDiv = document.getElementById("appear");
const crtC = document.getElementById("crtC");
canvasDiv.style.display = "none";


// typing numbers
document.addEventListener("keydown", e => {

  if (!typingDone) return;

  // numbers only
  if (e.key >= "0" && e.key <= "9") {
    userInput += e.key;
    p.insertBefore(document.createTextNode(e.key), cursor);
  }

  // delete
  if (e.key === "Backspace" && userInput.length > 0) {
    userInput = userInput.slice(0, -1);
    p.removeChild(cursor.previousSibling);
  }
});


//estimate time
function collisionCount(n) {
  return Math.floor(Math.PI * Math.pow(10, n));
}

let msPerCollision = 0.0;

(function benchmark() {
  const testN = 3; // cheap test
  const tests = collisionCount(testN);

  let x1 = 1, v1 = 0, m1 = 1;
  let x2 = 2, v2 = -50, m2 = 100;

  const t0 = performance.now();

  for (let i = 0; i < tests; i++) {
    const v1n =
      ((m1 - m2) / (m1 + m2)) * v1 +
      (2 * m2 / (m1 + m2)) * v2;

    const v2n =
      (2 * m1 / (m1 + m2)) * v1 +
      ((m2 - m1) / (m1 + m2)) * v2;

    v1 = v1n;
    v2 = v2n;

    x1 += v1 * 0.001;
    x2 += v2 * 0.001;
  }

  const t1 = performance.now();
  msPerCollision = (t1 - t0) / tests;
})();

function humanDuration(seconds) {
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600) return `${(seconds/60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds/3600).toFixed(1)} hours`;
  if (seconds < 31557600) return `${(seconds/86400).toFixed(1)} days`;
  return `${(seconds/31557600).toFixed(1)} years`;
}


function estimateYears(n) {
  const collisions = collisionCount(n);

  const seconds = (collisions * msPerCollision) / 1000;

  return humanDuration(seconds);
}


let warningActive = false;
let pendingN = null;


// simulation
document.addEventListener("keydown", e => {

  if (!typingDone) return;

  console.log(running)
  

  let newN = Number(userInput);

      

  if (e.key === "Enter" && userInput.length > 0) {

    if (running === true) return;

    if (warningActive && userInput == newN ) {
      warningActive = false;

      const warning = document.getElementById("pi-warning");
      warning.classList.remove("show");
      normalSpan.classList.add("fade-out")

      setTimeout(() => {
          p.classList.add("move-to-top");
      }, 20);

      n = newN;

      console.log("starting with n = ", n);

      setVariables();
      lastTime = null;
      axisProgress  = 0;
      axisAnimating = true;
      blocksVisible = false;
      blockAlpha    = 0;

      cameraFrozen  = false;
      running       = true;

      canvasDiv.style.display = "block";
      requestAnimationFrame(animate);
      collisionCounter.classList.add("fade-in");
      return;
    }

    if (newN > 3) {

      const warning = document.getElementById("pi-warning");
      const text = document.getElementById("warn-text");

      const years = estimateYears(newN);

      text.innerHTML =
        `are you sure? this operation would take 
         <span style="color:#ff4d4d">${years}</span> to finish.`;

      warning.classList.remove("hidden");
      warning.classList.add("show");

      warningActive = true;  
      pendingN = newN;        

      return;
    }


    normalSpan.classList.add("fade-out")

    setTimeout(() => {
        p.classList.add("move-to-top");
    }, 20);


    setTimeout(() => { 

 

      console.log("starting with n = ", n);

      setVariables();
      lastTime = null;
      axisProgress  = 0;
      axisAnimating = true;
      blocksVisible = false;
      blockAlpha    = 0;

      cameraFrozen  = false;
      running       = true;

      canvasDiv.style.display = "block";
      requestAnimationFrame(animate);
      collisionCounter.classList.add("fade-in");
    }, 400);
  }
});