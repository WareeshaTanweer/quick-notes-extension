/**
 * Context: Background Service Worker Script
 * Description: Runs in the background of the browser, reacts to extension runtime events,
 * and manages global cross-session metrics using storage APIs.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['totalSaves'], (result) => {
    if (!result.totalSaves) {
      chrome.storage.local.set({ totalSaves: 0 });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "noteSaved") {
    chrome.storage.local.get(['totalSaves'], (result) => {
      const currentCount = result.totalSaves || 0;
      const newCount = currentCount + 1;
      
      chrome.storage.local.set({ totalSaves: newCount }, () => {
        sendResponse({ newCount: newCount });
      });
    });
    return true; 
  }
});