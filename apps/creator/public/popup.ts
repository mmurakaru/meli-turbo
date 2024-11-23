document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { message: "getDOMText" },
      (response) => {
        if (response && response.text) {
          document.getElementById("domText").textContent = response.text; // Display in popup
        } else {
          document.getElementById("domText").textContent = "No text found.";
        }
      }
    );
  });
});
