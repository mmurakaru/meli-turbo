import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { Config, Step, TourState } from "./tour.types";

// TODO: Write unit tests

let state: TourState = {
  config: null,
  currentStep: 0,
};

async function init(configUrl: string): Promise<void> {
  state.config = await fetchConfig(configUrl);
  renderOverlay();
}

async function fetchConfig(url: string): Promise<Config> {
  const response = await fetch(url);
  return response.json();
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
    <p>${step.description}</p>
    <button class="next-btn">Next</button>
  `;
  return overlay;
}

function positionOverlay(reference: HTMLElement, overlay: HTMLElement): void {
  computePosition(reference, overlay, {
    placement: "bottom",
    // TODO: Add arrow() if needed
    middleware: [offset(10), flip(), shift()],
  }).then(({ x, y }) => {
    Object.assign(overlay.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
}

function nextStep(): void {
  if (!state.config) return;

  state.currentStep++;
  if (state.currentStep < state.config.steps.length) {
    document.querySelector(".product-tour-overlay")?.remove();
    renderOverlay();
  } else {
    end();
  }
}

function end(): void {
  document.querySelector(".product-tour-overlay")?.remove();
  console.log("Product tour completed");
}

declare global {
  interface Window {
    initProductTour: typeof init;
  }
}

window.initProductTour = init;
