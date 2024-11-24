console.log("Content script works!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getLinks") {
    const links = Array.from(document.querySelectorAll("a")).map(
      (anchor) => anchor.href
    );
    sendResponse({ links: links });
  }

  if (request.message === "highlightElement") {
    const savedInfo = highlightElement(request.url);
    sendResponse({ status: "highlighted", savedInfo: savedInfo });
  }

  return true; // Indicate that the response will be sent asynchronously
});

function highlightElement(url) {
  // Use querySelector to find the link by its href attribute
  const linkElement = document.querySelector(
    `a[href="${url}"]`
  ) as HTMLElement | null;

  if (linkElement) {
    // Get the position and dimensions of the element
    const rect = linkElement.getBoundingClientRect();
    const savedInfo = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };

    // Highlight the element
    linkElement.style.border = "2px solid red"; // Highlight with red border
    linkElement.style.backgroundColor = "yellow"; // Optional background color

    // Optionally reset styles after a delay
    setTimeout(() => {
      linkElement.style.border = ""; // Reset border
      linkElement.style.backgroundColor = ""; // Reset background color
    }, 2000); // Highlight for 2 seconds

    renderOverlay(savedInfo); // Render overlay at saved position

    return savedInfo; // Return saved position info
  } else {
    console.error("Element not found for URL:", url);
    return null; // Return null if not found
  }
}

function renderOverlay(savedInfo) {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.top = `${savedInfo.top}px`;
  overlay.style.left = `${savedInfo.left}px`;
  overlay.style.width = `${savedInfo.width}px`;
  overlay.style.height = `${savedInfo.height}px`;
  overlay.style.border = "2px solid red"; // Example styling for overlay
  overlay.style.backgroundColor = "rgba(255, 255, 0, 0.5)"; // Semi-transparent yellow
  overlay.style.zIndex = "9999"; // Ensure it appears above other elements

  document.body.appendChild(overlay); // Append overlay to body of the web app

  // Optional: Remove overlay after a few seconds
  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 2000); // Remove after 2 seconds
}
