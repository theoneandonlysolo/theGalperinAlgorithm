
//basics, setting the env
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const input = document.getElementById("digitsInput");
const setButton = document.getElementById("setNBtn");
const collisionCounter = document.getElementById("collisions");
const simulationTermination = document.getElementById("simulationTermination");
const collisionSound = new Audio("assets/collision.wav");
const warningSound = new Audio("assets/warning.wav");
const remindSound = new Audio("assets/remind.mp3");

//canvas styling
ctx.fillStyle = "white";
ctx.font = "15px Computer Modern Serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";


//runtime state for simulation camera and fade in timing
let n = 1;
let running = null;
let cameraX = 0;
let cameraFrozen = false;
let blocksVisible = false;
let blockAlpha = 0;
const fadeDuration = 1;
let axisProgress = 0;
const axisDuration = 1.5;
let axisAnimating = false;


//initialize the block objects for a run
let refBlock = null;
let bigBlock = null;
let collisions = null;

//compute a visible size for the big block based on its mass 
function getBigBlockSize(n) {
  const base = 75;

  let size = base + Math.log10(100 ** n) * 12;

  size = Math.max(60, Math.min(size, 220));

  return size;
}

//reset simulation variables and create the block arrays
function setVariables() {
  collisions = 0;
  cameraX = 0;
  const size = getBigBlockSize(n);

  refBlock = {
    mass: 1,
    x: 50,
    y: 297,
    width: 50,
    height: 50,
    vx: 0
  };

  bigBlock = {
    mass: 100 ** n,
    x: 420,
    y: 297,
    width: size,
    height: size,
    vx: -100
  };
}

//draw a small label
function drawScientific(ctx, base, exp, x, y) {
  ctx.save();

  const baseFont = "15px Computer Modern Serif";
  ctx.font = baseFont;
  ctx.fillText(base, x, y);

  const baseWidth = ctx.measureText(base).width;

  const expFont = "11px Computer Modern Serif";
  ctx.font = expFont;

  ctx.fillText(exp.toString(), x + baseWidth - 1, y - 8);

  ctx.restore();
}

//draw a single block with position and mass labels
function drawBlock(ctx, block) {
  if (!block) return;

  const screenX = block.x - cameraX;
  const screenY = block.y - block.height;

  ctx.save();
  ctx.globalAlpha = blockAlpha;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, screenY, block.width, block.height);

  ctx.fillText("x = " + Math.round(block.x),
    screenX + block.width / 2,
    320
  );

  //mass label uses scientific notation when large to keep text readable
  let labelX = screenX + block.width / 2;
  let labelY = screenY - 10;

  if (block.mass >= 1000) {
    const exp = Math.floor(Math.log10(block.mass));
    drawScientific(ctx, "10", exp, labelX - 10, labelY);
    ctx.fillText(" kg", labelX + 20, labelY);
  } else {
    ctx.fillText(block.mass + " kg", labelX, labelY);
  }

  ctx.restore();
}

const fullPi = "π = 3.14159265359";
let piShown = false;

//find and reuse the collision number span for blinking
function getCollisionNumberEl() {
  let numberEl = collisionCounter.querySelector(".collision-number");
  if (!numberEl) {
    collisionCounter.innerHTML = '# of collisions: <span class="collision-number"></span>';
    numberEl = collisionCounter.querySelector(".collision-number");
  }
  return numberEl;
}

//blink the collision number while pi highlight is typing
function startCollisionBlink() {
  if (collisionBlinkTimer) return;
  const numberEl = getCollisionNumberEl();
  collisionBlinkOn = false;
  collisionBlinkTimer = setInterval(() => {
    collisionBlinkOn = !collisionBlinkOn;
    numberEl.style.textDecoration = collisionBlinkOn ? "underline" : "none";
  }, 350);
}

//stop the collision blink and leave the number plain
function stopCollisionBlink() {
  if (collisionBlinkTimer) {
    clearInterval(collisionBlinkTimer);
    collisionBlinkTimer = null;
  }
  const numberEl = getCollisionNumberEl();
  numberEl.style.textDecoration = "none";
}

//type out the pi result line and highlight the computed digits
function showPiResult(n) {
  if (piShown) return;
  piShown = true;

  let pPi = document.getElementById("pi-output");
  if (!pPi) {
    pPi = document.createElement("p");
    pPi.id = "pi-output";
    document.querySelector(".crt-content").insertBefore(
      pPi,
      document.getElementById("appear")
    );
  } else {
    pPi.innerHTML = "";
  }

  const digits = "3.1415926535897932384626433832795...";
  const before = "π = ";

  const highlighted =
    `<span class="highlight">${digits.slice(0, n + 2)}</span>` +
    digits.slice(n + 2);

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

//track the end of the run and when warnings should appear
let lastTime = null;
let reachedPiTime = null;
let tryAgainShown = false;
let simStartTime = null;
let collisionBlinkTimer = null;
let collisionBlinkOn = false;

//control when the camera freezes and when the prompt warning appears
function checkTermination() {
  const expected = Math.floor(Math.PI * Math.pow(10, n));

  if (n > 1 && simStartTime !== null && !tryAgainShown) {
    const sinceStart = performance.now() - simStartTime;
    if (sinceStart >= 7000) {
      tryAgainShown = true;
      const warning = document.getElementById("pi-warning");
      const text = document.getElementById("warn-text");
      text.innerHTML = "press enter to try again";
      warning.classList.remove("hidden");
      warning.classList.add("show");
      remindSound.currentTime = 0;
      remindSound.play().catch(() => {});
    }
  }

  if (!cameraFrozen && collisions >= expected) {
    cameraFrozen = true;
    reachedPiTime = performance.now();
    console.log("camera frozen pi limit reached");
  }

  if (cameraFrozen && reachedPiTime !== null) {
    const elapsed = performance.now() - reachedPiTime;

    if (elapsed >= 3000 && !piShown) {
      showPiResult(n);
    }
    if (n <= 1 && elapsed >= 10000 && !tryAgainShown) {
      tryAgainShown = true;

      const warning = document.getElementById("pi-warning");
      const text = document.getElementById("warn-text");

      text.innerHTML = "press enter to try again";

      warning.classList.remove("hidden");
      warning.classList.add("show");
      remindSound.currentTime = 0;
      remindSound.play().catch(() => {});
    }
  }

  if (cameraFrozen) {
    const smallGone = (refBlock.x - cameraX) - 10 > canvas.width;
    const bigGone = (bigBlock.x - cameraX) > canvas.width;

    if (smallGone && bigGone) {
      running = false;

      console.log("sim terminated after drift-off");
      console.log("total collisions =", collisions);
    }
  }
}

//log collision changes for debugging
let lastCollision = null;

function updateCollision(value) {
  if (value !== lastCollision) {
    console.log("collisions:", value);
    lastCollision = value;
  }
}

//play the collision beep when contact
function playCollisionSound() {
  collisionSound.currentTime = 0;
  collisionSound.play();
}

//main animation loop for the canvas view
//physics uses many tiny steps per frame so fast motion does not skip a collision
//each tiny step moves both blocks then checks the wall and then checks block contact
//the wall collision flips the small block velocity only when it is moving into the wall (by multiplying the velocity by -1)
//the block collision uses conservation of momentum and kinetic energy in one dimension (basic highscool physics)
//those equations compute new velocities from the two masses and the two incoming velocities
//the repeated collisions count is the pi digits because a mass ratio of one to one hundred to the power of n produces that count
function animate(time) {
  if (!running) return;
  requestAnimationFrame(animate);

  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (axisAnimating) {
    axisProgress += dt / axisDuration;
    if (axisProgress >= 1) {
      axisProgress = 1;
      axisAnimating = false;
    }
  }

  const axisWidth = (canvas.width + cameraX) * axisProgress;
  const axisHeight = 300 * axisProgress;

  ctx.fillRect(0 - cameraX, 298, axisWidth, 1);
  ctx.fillRect(0 - cameraX, 298 - axisHeight, 1, axisHeight);

  const axisCoversBig =
    axisWidth >= (bigBlock.x + bigBlock.width - cameraX);

  if (!blocksVisible && axisCoversBig) {
    blocksVisible = true;
  }

  if (blocksVisible && blockAlpha < 1) {
    blockAlpha += dt / fadeDuration;
    if (blockAlpha > 1) blockAlpha = 1;
  }

  const steps = 200;
  for (let i = 0; i < steps; i++) {
    const dt2 = dt / steps;

    refBlock.x += refBlock.vx * dt2;
    bigBlock.x += bigBlock.vx * dt2;

    if (refBlock.x <= 0 && refBlock.vx < 0) {
      refBlock.x = 0;
      refBlock.vx = -refBlock.vx;
      collisions++;
      // playCollisionSound();
    }

    if (
      bigBlock.x <= refBlock.x + refBlock.width &&
      bigBlock.vx < refBlock.vx
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
      // playCollisionSound();
    }
  }

  const rightmost = Math.max(
    refBlock.x + refBlock.width,
    bigBlock.x + bigBlock.width
  );

  const leftmost = Math.min(
    refBlock.x + refBlock.width,
    bigBlock.x + bigBlock.width
  );

  updateCollision(collisions);
  collisionCounter.textContent = `# of collisions: ${collisions}`;

  checkTermination();

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

  if (cameraX < 0) cameraX = 0;

  drawBlock(ctx, refBlock);
  drawBlock(ctx, bigBlock);
}

//intro typewriter text
const text = `In 2003, physicist Gregory Galperin published a research paper showing how an idealized elastic collision simulation between two blocks can be used to compute digits of π. The setup is famously absurd in its inefficiency, requiring exponentially more collisions, and thus time, to reveal each additional digit, and it has since become known in the mathematics community as one of the most comically impractical ways to approximate π. But we couldn’t possibly pass up the chance to try it out for ourselves, could we? So let’s go ahead;

How many digits of π would you like to compute today? `;

const p = document.getElementById("typewriter");

//split the intro into a normal span and a bold prompt line
const lines = text.split("\n");
const lastLine = lines.pop();
const beforeText = lines.join("\n") + "\n";

const normalSpan = document.createElement("span");
const boldSpan = document.createElement("strong");

const cursor = document.createElement("span");
cursor.className = "cursor";
cursor.textContent = "";

//assemble the typewriter display order
p.appendChild(normalSpan);
p.appendChild(boldSpan);
p.appendChild(cursor);

let i = 0;
let j = 0;
let phase = "normal";
let typingDone = false;
let userInput = "";

//type the intro text and the bold prompt line
function type() {
  if (phase === "normal") {
    if (i < beforeText.length) {
      normalSpan.textContent += beforeText[i];
      i++;
      setTimeout(type, 25); //default speed is 25, 1 is set to speed up testing cuz 25 is too slow and annoying
    } else {
      phase = "bold";
      setTimeout(type, 500);
    }
  } else if (phase === "bold") {
    if (j < lastLine.length) {
      boldSpan.textContent += lastLine[j];
      j++;
      setTimeout(type, 25);
      if (j >= lastLine.length) {
        typingDone = true;
      }
    } else {
      typingDone = true;
    }
  }
}

type();

const canvasDiv = document.getElementById("appear");
const crtC = document.getElementById("crtC");
canvasDiv.style.display = "none";

//capture numeric input in the prompt and update the warning when needed
document.addEventListener("keydown", e => {
  if (!typingDone) return;

  if (e.key >= "0" && e.key <= "9") {
    userInput += e.key;
    p.insertBefore(document.createTextNode(e.key), cursor);
    if (warningActive) {
      updateYearsWarning(Number(userInput));
    }
  }

  if (e.key === "Backspace" && userInput.length > 0) {
    userInput = userInput.slice(0, -1);
    p.removeChild(cursor.previousSibling);
    if (warningActive) {
      updateYearsWarning(Number(userInput || 0));
    }
  }
});

//estimate runtime from calibrated collision counts
//collision count is the integer part of pi times ten to the power of n
//this matches the theoretical total collisions for the galperin setup
function collisionCount(n) {
  return Math.floor(Math.PI * Math.pow(10, n));
}

const timeCalibration = {
  1: 5,
  2: 60,
};

//convert collision count to seconds
function estimateSecondsFromCalibration(n) {
  const c1 = collisionCount(1);
  const c2 = collisionCount(2);
  const t1 = timeCalibration[1];
  const t2 = timeCalibration[2];

  const slope = (t2 - t1) / (c2 - c1);
  const intercept = t1 - slope * c1;

  const seconds = slope * collisionCount(n) + intercept;
  return Math.max(0, seconds);
}

//convert seconds to a readable estimate for the warning text
function humanDuration(seconds) {
  if (!Number.isFinite(seconds)) return "infinite years";
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600) return `${(seconds/60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds/3600).toFixed(1)} hours`;
  if (seconds < 31557600) return `${(seconds/86400).toFixed(1)} days`;
  return `${(seconds/31557600).toFixed(1)} years`;
}

//estimate the display string for a chosen digit count
function estimateYears(n) {
  const seconds = estimateSecondsFromCalibration(n);
  return humanDuration(seconds);
}

//warning state for the years confirmation dialog and physics limit
let warningActive = false;
let pendingN = null;
let warnedN = null;
let physicsLimitActive = false;

//compute the exponent used for the big block mass label
function getBigBlockExponent(value) {
  const mass = 100 ** value;
  if (!Number.isFinite(mass)) return Infinity;
  return Math.floor(Math.log10(mass));
}

//decide if the mass scale is beyond the browser's capabilities
function isPhysicsLimit(value) {
  return !Number.isFinite(getBigBlockExponent(value));
}

//show a hard limit warning when the mass scale is not representable
function showPhysicsLimitWarning(value) {
  const warning = document.getElementById("pi-warning");
  const text = document.getElementById("warn-text");
  text.textContent = "your browser cannot handle the physics at this rate";
  warning.classList.remove("hidden");
  warning.classList.add("show");
  warningActive = true;
  physicsLimitActive = true;
  warnedN = value;
  remindSound.currentTime = 0;
  remindSound.play().catch(() => {});
}

//shake the warning card when the user retries
function triggerWarningShake() {
  const warning = document.getElementById("pi-warning");
  warning.classList.remove("shake");
  void warning.offsetWidth;
  warning.classList.add("shake");
}

//show or hide the years warning and play its sound
function updateYearsWarning(value) {
  const warning = document.getElementById("pi-warning");
  const text = document.getElementById("warn-text");

  if (value > 3) {
    const shouldPlay = !warningActive || warnedN !== value;
    const seconds = estimateSecondsFromCalibration(value);
    if (!Number.isFinite(seconds)) {
      text.innerHTML =
        `are you sure? this operation would take 
         <span style="color:#ff4d4d">infinite years</span> to finish.`;
    } else {
      const years = humanDuration(seconds);
      text.innerHTML =
        `are you sure? this operation would take 
         <span style="color:#ff4d4d">${years}</span> to finish.`;
    }
    warning.classList.remove("hidden");
    warning.classList.add("show");
    warningActive = true;
    physicsLimitActive = false;
    warnedN = value;
    if (shouldPlay) {
      warningSound.currentTime = 0;
      warningSound.play().catch(() => {});
    }
  } else {
    warning.classList.add("hidden");
    warning.classList.remove("show");
    warningActive = false;
    physicsLimitActive = false;
    warnedN = null;
  }
}

//reset per run state that should clear between runs
function resetRunState() {
  tryAgainShown = false;
  reachedPiTime = null;
  cameraFrozen = false;
  piShown = false;
  simStartTime = null;
  warnedN = null;
  stopCollisionBlink();
  const piOutput = document.getElementById("pi-output");
  if (piOutput) {
    piOutput.textContent = "";
  }
}

//keyboard handler for start confirm and warning 
document.addEventListener("keydown", e => {
  if (!typingDone) return;

  console.log(running);
  let newN = Number(userInput);

  if (e.key === "Enter" && userInput.length > 0) {
    n = newN;

    if (newN > 3) {
      if (warningActive && warnedN === newN) {
        if (isPhysicsLimit(newN)) {
          showPhysicsLimitWarning(newN);
          triggerWarningShake();
          return;
        }
        const warning = document.getElementById("pi-warning");
        warning.classList.add("hidden");
        warning.classList.remove("show");
        warningActive = false;
        physicsLimitActive = false;
        warnedN = null;
        resetRunState();

        normalSpan.classList.add("fade-out");
        setTimeout(() => {
          p.classList.add("move-to-top");
        }, 20);

        console.log("starting with n = ", n);
        setVariables();
        lastTime = null;
        axisProgress = 0;
        axisAnimating = true;
        blocksVisible = false;
        blockAlpha = 0;

        cameraFrozen = false;
        running = true;
        simStartTime = performance.now();

        canvasDiv.style.display = "block";
        requestAnimationFrame(animate);
        collisionCounter.classList.add("fade-in");
      } else {
        updateYearsWarning(newN);
      }
      return;
    }

    const warning = document.getElementById("pi-warning");
    warning.classList.add("hidden");
    warning.classList.remove("show");
    warningActive = false;
    warnedN = null;
    resetRunState();

    normalSpan.classList.add("fade-out");
    setTimeout(() => {
      p.classList.add("move-to-top");
    }, 20);

    setTimeout(() => {
      console.log("starting with n = ", n);
      setVariables();
      lastTime = null;
      axisProgress = 0;
      axisAnimating = true;
      blocksVisible = false;
      blockAlpha = 0;

      cameraFrozen = false;
      running = true;
      simStartTime = performance.now();

      canvasDiv.style.display = "block";
      requestAnimationFrame(animate);
      collisionCounter.classList.add("fade-in");
    }, 200);
  }
});
