import { Config, Step, TourState } from "./tour.types";

import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  platform,
  shift,
} from "@floating-ui/dom";
import "./tour.scss";

let state: TourState = {
  config: null,
  currentStep: 0,
  cleanup: null,
};

async function init(configUrl: string): Promise<void> {
  state.config = await fetchConfig(configUrl);
  checkForTourElement();
  addRouteChangeListener();
}

// Check if elementRef exists in DOM
function checkForTourElement() {
  if (state.config) {
    const currentStep = state.config.steps[state.currentStep];
    if (currentStep && document.querySelector(`#${currentStep.selector}`)) {
      renderOverlay();
    } else {
      setTimeout(checkForTourElement, 100);
    }
  }
}

async function fetchConfig(url: string): Promise<Config> {
  const response = await fetch(url);
  return response.json();
}

function renderOverlay(): void {
  if (!state.config) return;

  const step = state.config.steps[state.currentStep];
  const referenceElement = document.querySelector(`#${step.selector}`);

  if (!referenceElement) {
    console.error(`Reference element not found: ${step.selector}`);
    return;
  }

  const overlay = createOverlayElement(step);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    positionOverlay(referenceElement as Element, overlay);
  });

  overlay
    .querySelector(".tour-overlay--button-primary")
    ?.addEventListener("click", nextStep);
}

function createOverlayElement(step: Step): HTMLElement {
  const overlay = document.createElement("div");
  overlay.id = "tour-overlay";
  overlay.innerHTML = `
    <h3 class="tour-overlay--title">${step.title}</h3>
    <p class="tour-overlay--text">${step.text}</p>
    <button class="tour-overlay--button-primary">Next</button>
  `;

  return overlay;
}

function positionOverlay(reference: Element, overlay: HTMLElement): void {
  if (!reference || !overlay) return;

  state.cleanup = autoUpdate(reference, overlay, () => {
    computePosition(reference, overlay, {
      platform,
      middleware: [offset(10), flip(), shift()],
    })
      .then(({ x, y }) => {
        Object.assign(overlay.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      })
      .catch((error) => {
        console.error("Error in computePosition:", error);
      });
  });
}

function nextStep(): void {
  if (!state.config) return;

  if (state.cleanup) {
    state.cleanup();
    state.cleanup = null;
  }

  state.currentStep++;
  if (state.currentStep < state.config.steps.length) {
    document.querySelector("#tour-overlay")?.remove();
    renderOverlay();
  } else {
    end();
  }
}

function end(): void {
  if (state.cleanup) {
    state.cleanup();
    state.cleanup = null;
  }

  document.querySelector("#tour-overlay")?.remove();
}

// Reinitiate tour overlay on route change
function handleRouteChange() {
  if (state.config) {
    if (state.cleanup) {
      state.cleanup();
      state.cleanup = null;
    }

    document.querySelector("#tour-overlay")?.remove();
    state.currentStep = 0;
    checkForTourElement();
  }
}

// Route change listener
function addRouteChangeListener() {
  if (typeof window !== "undefined") {
    // Single-page applications
    window.addEventListener("popstate", handleRouteChange);

    // Hash-based routing
    window.addEventListener("hashchange", handleRouteChange);

    // Custom routing events
    if (window.addEventListener) {
      window.addEventListener("routeChange", handleRouteChange);
    }
  }
}

declare global {
  interface TourMeli {
    scriptUrl: string;
    configUrl: string;
  }

  interface Window {
    initProductTour: typeof init;
    tourMeli: TourMeli;
  }
}

if (typeof window !== "undefined") {
  window.initProductTour = init;
}
