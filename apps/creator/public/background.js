// Example code
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "collectElements") {
    (async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      console.log(message.query);
      await chrome.tabs.sendMessage(tab.id, {
        action: "collectElements",
        query: message.query,
      });
    })();
  } else if (message.action === "saveElements") {
    fetch("https://www.meli-ai.com/api/source", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: "Hello from Chrome Extension" }),
    })
      .then((response) => response.json())
      .then((data) => console.log("Response from API:", data))
      .catch((error) => console.error("Error:", error));

    (async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      await chrome.tabs.sendMessage(tab.id, {
        action: "saveElements",
      });
    })();
  } else if (message.action === "downloadBlob") {
    // Use the chrome.downloads API to download the Blob URL
    chrome.downloads
      .download({
        url: message.blobURL,
        saveAs: true,
      })
      .then(() => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "revokeBlob",
          blobURL: message.blobURL,
        });
      });
  }
});
