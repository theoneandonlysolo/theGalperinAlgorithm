// ui.js
import { DOM, INTRO_TEXT, AUDIO_VOLUME } from "./config.js";
import {
  collisionCount,
  estimateSecondsFromCalibration,
  humanDuration,
  isPhysicsLimit,
  getMassExponent,
} from "./physics.js";

export function createUIController({ audio }) {
  // --- typewriter setup
  const p = DOM.typewriterP();
  const lines = INTRO_TEXT.split("\n");
  const lastLine = lines.pop();
  const beforeText = lines.join("\n") + "\n";

  const normalSpan = document.createElement("span");
  const boldSpan = document.createElement("strong");
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.textContent = "";

  p.appendChild(normalSpan);
  p.appendChild(boldSpan);
  p.appendChild(cursor);

  let i = 0;
  let j = 0;
  let phase = "normal";
  let typingDone = false;
  let introSkipMode = false;
  let introTimer = null;

  let userInput = "";
  let warningActive = false;
  let warnedN = null;
  let physicsLimitActive = false;

  // per-run UI state
  let piShown = false;
  let tryAgainShown = false;
  let reachedPiTime = null;
  let simStartTime = null;

  // blink collisions while pi types (kept, but optional to call)
  let collisionBlinkTimer = null;
  let collisionBlinkOn = false;

  function getCollisionNumberEl() {
    const counter = DOM.collisionCounter();
    let numberEl = counter.querySelector(".collision-number");
    if (!numberEl) {
      counter.innerHTML = '# of collisions: <span class="collision-number"></span>';
      numberEl = counter.querySelector(".collision-number");
    }
    return numberEl;
  }

  function startCollisionBlink() {
    if (collisionBlinkTimer) return;
    const numberEl = getCollisionNumberEl();
    collisionBlinkOn = false;
    collisionBlinkTimer = setInterval(() => {
      collisionBlinkOn = !collisionBlinkOn;
      numberEl.style.textDecoration = collisionBlinkOn ? "underline" : "none";
    }, 350);
  }

  function stopCollisionBlink() {
    if (collisionBlinkTimer) {
      clearInterval(collisionBlinkTimer);
      collisionBlinkTimer = null;
    }
    const numberEl = getCollisionNumberEl();
    numberEl.style.textDecoration = "none";
  }

  function showPhysicsLimitWarning(value) {
    const warning = DOM.warningCard();
    const text = DOM.warningText();
    text.textContent = "your browser cannot handle the physics at this rate";
    warning.classList.remove("hidden");
    warning.classList.add("show");
    warningActive = true;
    physicsLimitActive = true;
    warnedN = value;

    audio.remindSound.volume = AUDIO_VOLUME;
    audio.remindSound.currentTime = 0;
    audio.remindSound.play().catch(() => {});
  }

  function triggerWarningShake() {
    const warning = DOM.warningCard();
    warning.classList.remove("shake");
    void warning.offsetWidth;
    warning.classList.add("shake");
  }

  function updateYearsWarning(value) {
    const warning = DOM.warningCard();
    const text = DOM.warningText();

    if (value > 4) {
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
        audio.warningSound.volume = AUDIO_VOLUME;
        audio.warningSound.currentTime = 0;
        audio.warningSound.play().catch(() => {});
      }
    } else {
      warning.classList.add("hidden");
      warning.classList.remove("show");
      warningActive = false;
      physicsLimitActive = false;
      warnedN = null;
    }
  }

  function hideWarning() {
    const warning = DOM.warningCard();
    warning.classList.add("hidden");
    warning.classList.remove("show");
    warningActive = false;
    physicsLimitActive = false;
    warnedN = null;
  }

  function resetRunUI() {
    tryAgainShown = false;
    reachedPiTime = null;
    piShown = false;
    simStartTime = null;
    warnedN = null;
    stopCollisionBlink();

    const piOutput = document.getElementById("pi-output");
    if (piOutput) piOutput.textContent = "";
  }

  function showPiResult(n) {
    if (piShown) return;
    piShown = true;

    let pPi = document.getElementById("pi-output");
    if (!pPi) {
      pPi = document.createElement("p");
      pPi.id = "pi-output";
      DOM.crtContent().insertBefore(pPi, DOM.canvasDiv());
    } else {
      pPi.innerHTML = "";
    }

    const digits = "3.1415926535897932384626433832795...";
    const before = "π = ";

    const exponent = getMassExponent(n);
    const highlighted =
      `<span class="highlight">${digits.slice(0, exponent + 2)}</span>` +
      digits.slice(exponent + 2);

    let k = 0;
    const temp = document.createElement("span");
    pPi.appendChild(temp);

    const target = before + highlighted;
    pPi.style.opacity = 1;

    // (optional) blink while typing highlight
    startCollisionBlink();

    function typePi() {
      if (k <= target.length) {
        temp.innerHTML = target.slice(0, k);
        k++;
        setTimeout(typePi, 30);
      } else {
        stopCollisionBlink();
      }
    }

    typePi();
  }

  function queueIntroTick(delay) {
    introTimer = setTimeout(() => {
      introTimer = null;
      typeIntro();
    }, delay);
  }

  // typewriter animation
  function typeIntro() {
    if (phase === "normal") {
      if (i < beforeText.length) {
        normalSpan.textContent += beforeText[i];
        i++;
        queueIntroTick(introSkipMode ? 1 : 25);
      } else {
        phase = "bold";
        queueIntroTick(introSkipMode ? 1 : 500);
      }
    } else if (phase === "bold") {
      if (j < lastLine.length) {
        boldSpan.textContent += lastLine[j];
        j++;
        queueIntroTick(introSkipMode ? 1 : 25);
        if (j >= lastLine.length) typingDone = true;
      } else {
        typingDone = true;
      }
    }
  }
  typeIntro();

  // hide canvas initially
  DOM.canvasDiv().style.display = "none";

  // --- public-ish methods used by main
  function setCollisionText(value) {
    const counter = DOM.collisionCounter();

    // support both formats: plain text or inner span version
    const numberEl = counter.querySelector(".collision-number");
    if (numberEl) {
      numberEl.textContent = String(value);
    } else {
      counter.textContent = `# of collisions: ${value}`;
    }
  }

  function onSimStartNow() {
    simStartTime = performance.now();
  }

  /**
   * check termination / UI prompts
   * returns { shouldStop: boolean, cameraShouldFreeze: boolean }
   */
  function checkTermination({ n, collisions, cameraFrozen, refBlock, bigBlock, cameraX, canvas }) {
    const expected = collisionCount(n);

    // after some time, show "try again"
    if (n > 2 && simStartTime !== null && !tryAgainShown) {
      const sinceStart = performance.now() - simStartTime;
      if (sinceStart >= 7000) {
        tryAgainShown = true;
        const warning = DOM.warningCard();
        const text = DOM.warningText();
        text.innerHTML = "press enter to try again";
        warning.classList.remove("hidden");
        warning.classList.add("show");

        audio.remindSound.volume = AUDIO_VOLUME;
        audio.remindSound.currentTime = 0;
        audio.remindSound.play().catch(() => {});
      }
    }

    // freeze camera when reached expected
    let cameraShouldFreeze = false;
    if (!cameraFrozen && collisions >= expected) {
      cameraShouldFreeze = true;
      reachedPiTime = performance.now();
    }

    // after freeze, show pi + try again
    if ((cameraFrozen || cameraShouldFreeze) && reachedPiTime !== null) {
      const elapsed = performance.now() - reachedPiTime;

      if (elapsed >= 3000 && !piShown) showPiResult(n);

      if (n <= 2 && elapsed >= 10000 && !tryAgainShown) {
        tryAgainShown = true;

        const warning = DOM.warningCard();
        const text = DOM.warningText();
        text.innerHTML = "press enter to try again";
        warning.classList.remove("hidden");
        warning.classList.add("show");

        audio.remindSound.volume = AUDIO_VOLUME;
        audio.remindSound.currentTime = 0;
        audio.remindSound.play().catch(() => {});
      }
    }

    // once frozen, stop when both drift off screen
    if (cameraFrozen || cameraShouldFreeze) {
      const smallGone = (refBlock.x - cameraX) - 10 > canvas.width;
      const bigGone = (bigBlock.x - cameraX) > canvas.width;
      if (smallGone && bigGone) {
        return { shouldStop: true, cameraShouldFreeze };
      }
    }

    return { shouldStop: false, cameraShouldFreeze };
  }

  // --- keyboard input / start logic
  function attachInputHandlers({ onStartRequested, onTryAgain }) {
    document.addEventListener("keydown", (e) => {
      if (!typingDone) {
        if (e.key === "s" || e.key === "S") {
          introSkipMode = true;
          if (introTimer) {
            clearTimeout(introTimer);
            introTimer = null;
            typeIntro();
          }
          e.preventDefault();
        }
        return;
      }

      // try again mode: if shown and Enter => callback
      if (tryAgainShown && e.key === "Enter") {
        onTryAgain?.();
        return;
      }

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

      if (e.key === "Enter" && userInput.length > 0) {
        const newN = Number(userInput);

        if (newN > 4) {
          if (warningActive && warnedN === newN) {
            if (isPhysicsLimit(newN)) {
              showPhysicsLimitWarning(newN);
              triggerWarningShake();
              return;
            }
            hideWarning();
            resetRunUI();
            onStartRequested(newN);
          } else {
            updateYearsWarning(newN);
          }
          return;
        }

        hideWarning();
        resetRunUI();
        onStartRequested(newN);
      }
    });
  }

  function fadeIntroUp() {
    normalSpan.classList.add("fade-out");
    setTimeout(() => {
      p.classList.add("move-to-top");
    }, 20);
  }

  function showCanvasAndCounter() {
    DOM.canvasDiv().style.display = "block";
    DOM.collisionCounter().classList.add("fade-in");
  }

  return {
    attachInputHandlers,
    setCollisionText,
    fadeIntroUp,
    showCanvasAndCounter,
    onSimStartNow,
    checkTermination,
  };
}
