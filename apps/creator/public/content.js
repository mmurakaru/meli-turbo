chrome.runtime.onMessage.addListener((request, sendResponse) => {
  if (request.message === "getPageContent") {
    const documentCopy = document.cloneNode(true);

    var article = new Readability(documentCopy).parse();
    const textContent = article.textContent.trim();

    sendResponse(textContent);
  }
});
