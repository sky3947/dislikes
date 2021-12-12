// Default color theme is dark.
let theme = 'dark';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ theme });
});
