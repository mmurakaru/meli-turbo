import { Config, Step, TourState } from "./tour.types";

import "./tour.scss";

// TODO: Write unit tests
// CORS tour script > dashboard app

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
  console.log(url);
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
  overlay.className = "product-tour-overlay";
  overlay.innerHTML = `
    <h3>${step.title}</h3>
    <p>${step.text}</p>
    <button class="next-btn">Next</button>
  `;
  return overlay;
}

function positionOverlay(reference: HTMLElement, overlay: HTMLElement): void {
  // TODO: check why computePosition is not working
  /*   state.cleanup = autoUpdate(reference, overlay, () => {
    computePosition(reference, overlay, {
      middleware: [offset(10), flip(), shift()],
    }).then(({ x, y }) => {
      Object.assign(overlay.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }); */

  if (!reference || !overlay) {
    console.error("Reference or overlay is null.");
    return;
  }

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
    document.querySelector(".product-tour-overlay")?.remove();
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

  document.querySelector(".product-tour-overlay")?.remove();
  console.log("Product tour completed");
}

declare global {
  interface Window {
    initProductTour: typeof init;
  }
}

if (typeof window !== "undefined") {
  window.initProductTour = init;
}
