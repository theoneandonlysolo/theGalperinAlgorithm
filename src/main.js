import { DOM, AUDIO, CANVAS_STYLE, SIM } from "./config.js";
import { setupCanvas, renderFrame } from "./renderer.js";
import {
  createBlocks,
  stepPhysics,
  collisionCount,
  getRightmost,
  getLeftmost,
} from "./physics.js";
import { createUIController } from "./ui.js";

const canvas = DOM.canvas();
const ctx = canvas.getContext("2d");
setupCanvas(ctx, CANVAS_STYLE);

// audio instances (
const audio = {
  collisionSound: AUDIO.collisionSound(),
  warningSound: AUDIO.warningSound(),
  remindSound: AUDIO.remindSound(),
};

const ui = createUIController({ audio });

// imulation state (physics)
let simState = {
  refBlock: null,
  bigBlock: null,
  collisions: 0,
};

//view/runtime state
let viewState = {
  n: 1,
  running: false,
  cameraX: 0,
  cameraFrozen: false,

  blocksVisible: false,
  blockAlpha: 0,

  axisProgress: 0,
  axisAnimating: false,

  lastTime: null,
};

function resetForRun(n) {
  viewState.n = n;
  viewState.running = true;
  viewState.cameraX = 0;
  viewState.cameraFrozen = false;

  viewState.blocksVisible = false;
  viewState.blockAlpha = 0;

  viewState.axisProgress = 0;
  viewState.axisAnimating = true;

  viewState.lastTime = null;

  simState.collisions = 0;
  const blocks = createBlocks(n);
  simState.refBlock = blocks.refBlock;
  simState.bigBlock = blocks.bigBlock;
}

function updateAxis(dt) {
  if (!viewState.axisAnimating) return;

  viewState.axisProgress += dt / SIM.axisDuration;
  if (viewState.axisProgress >= 1) {
    viewState.axisProgress = 1;
    viewState.axisAnimating = false;
  }


  const axisWidth = (canvas.width + viewState.cameraX) * viewState.axisProgress;
  const axisCoversBig =
    axisWidth >= (simState.bigBlock.x + simState.bigBlock.width - viewState.cameraX);

  if (!viewState.blocksVisible && axisCoversBig) viewState.blocksVisible = true;

  if (viewState.blocksVisible && viewState.blockAlpha < 1) {
    viewState.blockAlpha += dt / SIM.fadeDuration;
    if (viewState.blockAlpha > 1) viewState.blockAlpha = 1;
  }
}

function updateCamera() {
  if (viewState.cameraFrozen) return;

  const rightmost = getRightmost(simState);
  const leftmost = getLeftmost(simState);
  const expected = collisionCount(viewState.n);

  // cam
  const margin = SIM.cameraMargin;
  if (rightmost > canvas.width - margin && simState.collisions - 1 === expected) {
    viewState.cameraX = rightmost - (canvas.width - margin);
  } else {
    viewState.cameraX = leftmost - (canvas.width - margin);
  }

  if (viewState.cameraX < 0) viewState.cameraX = 0;
}

function animate(time) {
  if (!viewState.running) return;
  requestAnimationFrame(animate);

  if (!viewState.lastTime) viewState.lastTime = time;
  const dt = (time - viewState.lastTime) / 1000;
  viewState.lastTime = time;

  updateAxis(dt);

  // physics with substeps
  const steps = SIM.stepsPerFrame;
  for (let i = 0; i < steps; i++) {
    stepPhysics(simState, dt / steps);
  }

  // collision UI
  ui.setCollisionText(simState.collisions);

  // termination checks 
  const term = ui.checkTermination({
    n: viewState.n,
    collisions: simState.collisions,
    cameraFrozen: viewState.cameraFrozen,
    refBlock: simState.refBlock,
    bigBlock: simState.bigBlock,
    cameraX: viewState.cameraX,
    canvas,
  });

  if (term.cameraShouldFreeze) viewState.cameraFrozen = true;
  if (term.shouldStop) {
    viewState.running = false;
  }

  updateCamera();

  // render
  renderFrame(ctx, canvas, viewState, simState);
}

//  UI start wiring
ui.attachInputHandlers({
  onStartRequested: (n) => {
    ui.fadeIntroUp();
    resetForRun(n);
    ui.showCanvasAndCounter();
    ui.onSimStartNow();
    requestAnimationFrame(animate);
  },
  onTryAgain: () => {
    window.location.reload();
  },
});