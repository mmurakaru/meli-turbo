const createTourButtonRef = document.getElementById("createTourButton");

createTourButtonRef.addEventListener("click", loadPageContent);

async function loadPageContent() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const response = await chrome.tabs.sendMessage(tab.id, {
    message: "getLinks",
  });

  if (!response || !response.links) return;

  // Clear existing links
  const linksContainer = document.getElementById("links");
  linksContainer.innerHTML = ""; // Clear previous content

  // Iterate over each link and create a list item
  response.links.forEach((link) => {
    const listItem = document.createElement("li"); // Create a new list item
    const linkElement = document.createElement("a"); // Create a new anchor element

    linkElement.href = link; // Set the href attribute
    linkElement.textContent = link; // Set the text content to the link URL
    linkElement.target = "_blank"; // Open link in a new tab

    // Add click event to highlight element on the page and save its position
    linkElement.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevent default anchor behavior

      const savedInfo = await highlightElementOnPage(link); // Call function to highlight element

      if (savedInfo) {
        renderOverlay(savedInfo); // Render overlay at saved position in content.js
      }
    });

    listItem.appendChild(linkElement); // Append the anchor to the list item
    linksContainer.appendChild(listItem); // Append the list item to the unordered list
  });
}

function highlightElementOnPage(url) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          message: "highlightElement",
          url: url,
        },
        (response) => {
          resolve(response.savedInfo); // Resolve with saved info from content script
        }
      );
    });
  });
}
