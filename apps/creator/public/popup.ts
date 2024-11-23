chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];

  if (activeTab) {
    chrome.tabs.sendMessage(
      activeTab.id,
      { message: "renderContent" },
      (response) => {
        if (response && response.status === "success") {
          console.log("Content rendered successfully.");
        } else {
          console.error("Failed to render content.");
        }
      }
    );
  }
});
