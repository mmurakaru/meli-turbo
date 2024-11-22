"use client";

import { useEffect, useState } from "react";

interface TextContent {
  text: string;
}

export const useContent = () => {
  const [content, setContent] = useState<TextContent | null>(null);

  useEffect(() => {
    loadContent()
      .then((data) => setContent({ text: data }))
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return { content };
};

const loadContent = async (): Promise<string> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0].id;

  if (!tabId) {
    throw new Error("No active tab found");
  }

  return new Promise<string>((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { message: "getPageContent" },
      (response: { content: string } | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response) {
          resolve(response.content);
        } else {
          reject(new Error("No response from content script"));
        }
      }
    );
  });
};
