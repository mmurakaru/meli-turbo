chrome.runtime.sendMessage({ message: "getPageContent" }, (response) => {
  if (response && response.success) {
    console.log("Page content retrieved successfully");
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "renderContent") {
    const paragraph = document.getElementById("textContent");

    if (!paragraph) return;

    paragraph.textContent = request.content;
    paragraph.style.cssText = "";

    document.body.appendChild(paragraph);
  }
});
