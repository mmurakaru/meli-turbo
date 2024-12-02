let state = {
  config: null,
  currentStep: 0,
  cleanup: null,
};
const CONFIG_MOCK = {
  steps: [
    {
      selector: '.pricing-link',
      title: 'Pricing',
      text: 'Get started. Click here to find out more about our pricing.',
    },
    {
      selector: '.signup-link',
      title: 'Signup',
      text: 'Leverage AI to analyze your webapp structure and content, automatically generating tour steps and content suggestions. The finalized tour is implemented with voice AI assistance.',
    },
  ],
};
async function init(configUrl) {
  state.config = await fetchConfig();
  renderOverlay();
}
async function fetchConfig(url) {
  //const response = await fetch(url);
  //return response.json();
  const config = Object.assign({}, CONFIG_MOCK);
  return config;
}
function renderOverlay() {
  var _a;
  if (!state.config) return;
  const step = state.config.steps[state.currentStep];
  const referenceElement = document.querySelector(step.selector);
  if (!referenceElement) {
    console.error(`Reference element not found: ${step.selector}`);
    return;
  }
  const overlay = createOverlayElement(step);
  document.body.appendChild(overlay);
  positionOverlay(referenceElement, overlay);
  (_a = overlay.querySelector('.next-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', nextStep);
}
function createOverlayElement(step) {
  const overlay = document.createElement('div');
  overlay.className = 'product-tour-overlay';
  overlay.innerHTML = `
  <h3>${step.title}</h3>
  <p>${step.text}</p>
  <button class="next-btn">Next</button>
`;
  return overlay;
}
function positionOverlay(reference, overlay) {
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
    position: 'absolute',
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.bottom + window.scrollY + 10}px`,
  });
}
function nextStep() {
  var _a;
  if (!state.config) return;
  state.currentStep++;
  if (state.currentStep < state.config.steps.length) {
    (_a = document.querySelector('.product-tour-overlay')) === null || _a === void 0 ? void 0 : _a.remove();
    renderOverlay();
  } else {
    end();
  }
}
function end() {
  var _a;
  (_a = document.querySelector('.product-tour-overlay')) === null || _a === void 0 ? void 0 : _a.remove();
  console.log('Product tour completed');
}
if (typeof window !== 'undefined') {
  window.initProductTour = init;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdG91ci50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGxdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxJQUFJLEtBQUssR0FBYztBQUNyQixJQUFBLE1BQU0sRUFBRSxJQUFJO0FBQ1osSUFBQSxXQUFXLEVBQUUsQ0FBQztBQUNkLElBQUEsT0FBTyxFQUFFLElBQUk7Q0FDZDtBQUVELE1BQU0sV0FBVyxHQUFHO0FBQ2xCLElBQUEsS0FBSyxFQUFFO0FBQ0wsUUFBQTtBQUNFLFlBQUEsUUFBUSxFQUFFLGVBQWU7QUFDekIsWUFBQSxLQUFLLEVBQUUsU0FBUztBQUNoQixZQUFBLElBQUksRUFBRSw2REFBNkQ7QUFDcEUsU0FBQTtBQUNELFFBQUE7QUFDRSxZQUFBLFFBQVEsRUFBRSxjQUFjO0FBQ3hCLFlBQUEsS0FBSyxFQUFFLFFBQVE7QUFDZixZQUFBLElBQUksRUFBRSxvTEFBb0w7QUFDM0wsU0FBQTtBQUNGLEtBQUE7Q0FDUTtBQUVYLGVBQWUsSUFBSSxDQUFDLFNBQWlCLEVBQUE7SUFDbkMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBVSxDQUFDO0FBQzNDLElBQUEsYUFBYSxFQUFFO0FBQ2pCO0FBRUEsZUFBZSxXQUFXLENBQUMsR0FBVyxFQUFBOzs7QUFHcEMsSUFBQSxNQUFNLE1BQU0sR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsRUFBUSxXQUFXLENBQUU7QUFFakMsSUFBQSxPQUFPLE1BQU07QUFDZjtBQUVBLFNBQVMsYUFBYSxHQUFBOztJQUNwQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07UUFBRTtBQUVuQixJQUFBLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7SUFFOUQsSUFBSSxD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
