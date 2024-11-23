chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getPageContent") {
    const documentCopy = document.cloneNode(true) as Document;

    console.log(documentCopy);

    // const page = new Readability(documentCopy, {}).parse();

    // if (!page) return;

    //const textContent = page.textContent.trim();
    // const tabId = sender.tab?.id;

    // if (!tabId) return;

    // chrome.tabs.sendMessage(tabId, {
    //   message: "renderContent",
    //   content: "hello world!",
    // });

    sendResponse({ success: true });
  }
});
