export const DOM = {
  canvas: () => document.getElementById("screen"),
  typewriterP: () => document.getElementById("typewriter"),
  canvasDiv: () => document.getElementById("appear"),
  collisionCounter: () => document.getElementById("collisions"),
  simulationTermination: () => document.getElementById("simulationTermination"),
  crtContent: () => document.querySelector(".crt-content"),
  warningCard: () => document.getElementById("pi-warning"),
  warningText: () => document.getElementById("warn-text"),
};

export const AUDIO_VOLUME = 0.6;

function makeAudio(src) {
  const audio = new Audio(src);
  audio.volume = AUDIO_VOLUME;
  return audio;
}

export const AUDIO = {
  collisionSound: () => makeAudio("assets/collision.wav"),
  warningSound: () => makeAudio("assets/warning.wav"),
  remindSound: () => makeAudio("assets/remind.mp3"),
};

export const CANVAS_STYLE = {
  fillStyle: "white",
  font: "15px Computer Modern Serif",
  textAlign: "center",
  textBaseline: "middle",
};

export const SIM = {
  stepsPerFrame: 200,
  fadeDuration: 1,
  axisDuration: 1.5,
  cameraMargin: 200,
};

export const TIME_CALIBRATION = {
  2: 5,
  3: 60,
};

export const INTRO_TEXT = `In 2003, physicist Gregory Galperin published a research paper showing how an idealized elastic collision simulation between two blocks can be used to compute digits of π. The setup is famously absurd in its inefficiency, requiring exponentially more collisions, and thus time, to reveal each additional digit, and it has since become known in the mathematics community as one of the most comically impractical ways to approximate π. But we couldn’t possibly pass up the chance to try it out for ourselves, could we? So let’s go ahead;

How many digits of π would you like to compute today? `;
