// Handle any background tasks or long-lived connections
chrome.runtime.onInstalled.addListener(() => {
  console.log('Solana Wallet Extension installed');
});

// Keep service worker active
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return true;  // Will respond asynchronously
});

// Handle errors
chrome.runtime.onInstalled.addListener((details) => {
  if (chrome.runtime.lastError) {
    console.error(`Installation error: ${chrome.runtime.lastError.message}`);
  }
}); 