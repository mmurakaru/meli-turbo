import { Config, Step, TourState } from "./tour.types";

import "./tour.scss";

let state: TourState = {
  config: null,
  currentStep: 0,
  cleanup: null,
};

const CONFIG_MOCK = {
  steps: [
    {
      selector: ".pricing-link",
      title: "Pricing",
      text: "Get started. Click here to find out more about our pricing.",
    },
    {
      selector: ".signup-link",
      title: "Signup",
      text: "Leverage AI to analyze your webapp structure and content, automatically generating tour steps and content suggestions. The finalized tour is implemented with voice AI assistance.",
    },
  ],
} as Config;

async function init(configUrl: string): Promise<void> {
  state.config = await fetchConfig(configUrl);
  renderOverlay();
}

async function fetchConfig(url: string): Promise<Config> {
  //const response = await fetch(url);
  //return response.json();
  const config = { ...CONFIG_MOCK };

  return config;
}

function renderOverlay(): void {
  if (!state.config) return;

  const step = state.config.steps[state.currentStep];
  const referenceElement = document.querySelector(step.selector);

  if (!referenceElement) {
    console.error(`Reference element not found: ${step.selector}`);
    return;
  }

  const overlay = createOverlayElement(step);
  document.body.appendChild(overlay);

  positionOverlay(referenceElement as HTMLElement, overlay);

  overlay.querySelector(".next-btn")?.addEventListener("click", nextStep);
}

function createOverlayElement(step: Step): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.innerHTML = `
  <div class="overlay--body">
    <h3 class="overlay--title">${step.title}</h3>
    <p class="overlay--text">${step.text}</p>
    <button class="overlay--button-primary">Next</button>
  </div>
  `;
  return overlay;
}

function positionOverlay(reference: HTMLElement, overlay: HTMLElement): void {
  if (!reference || !overlay) return;

  /*   state.cleanup = autoUpdate(reference, overlay, () => {
    computePosition(reference, overlay, {
      platform,
      middleware: [offset(10), flip(), shift()],
    }).then(({ x, y }) => {
      Object.assign(overlay.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }); */

  const rect = reference.getBoundingClientRect();

  Object.assign(overlay.style, {
    position: "absolute",
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.bottom + window.scrollY + 10}px`,
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
    document.getElementById("overlay")?.remove();
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

  document.getElementById("overlay")?.remove();
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
