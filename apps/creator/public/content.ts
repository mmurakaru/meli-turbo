chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getDOMText") {
    const bodyText = document.body.innerText;
    sendResponse({ text: bodyText });
  }
});
