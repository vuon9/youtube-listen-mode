if (typeof console !== 'undefined') {
  console.log('[YLM] Background service worker started');
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab?.url?.includes('youtube.com/watch')) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: command }).catch((err) => {
    if (typeof console !== 'undefined') {
      console.log('[YLM] Could not send message to tab:', err.message || err);
    }
  });
});
