// YouTube Listen Mode Content Script

if (typeof document !== 'undefined') {
  console.log('[YLM] YouTube Listen Mode loaded');
}

let checkInterval = null;
let shouldSwitchQuality = false;

const SVG_HEADPHONES = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 50%; height: 50%;">
  <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"></path>
</svg>
`;

const SVG_VIDEO = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 50%; height: 50%;">
  <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z"></path>
</svg>
`;

const ACTION = { ENABLE: 'enable', DISABLE: 'disable' };
const REASON = {
  GLOBAL: 'global',
  NO_CHANNEL: 'noChannel',
  DISABLE_LIST: 'disableList',
  ENABLE_LIST: 'enableList',
  TITLE_MATCH: 'titleMatch',
  DEFAULT: 'default',
};

// Helper to create the button
function createButton() {
  if (typeof document === 'undefined') return;
  const btn = document.createElement('button');
  btn.className = 'ytp-button ytb-listen-mode-btn';
  btn.title = 'Listen Mode';
  btn.innerHTML = SVG_HEADPHONES; // Default to headphones (switch to audio)
  return btn;
}

// Helper to create the overlay
function createOverlay() {
  if (typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.className = 'ytb-listen-mode-overlay';

  // Icon
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('images/icon128.png');
  overlay.appendChild(icon);

  // Text
  const text = document.createElement('span');
  text.innerText = 'Audio Only Mode';
  overlay.appendChild(text);

  return overlay;
}

// Function to update video quality
function updateVideoQuality(enable) {
  if (typeof document === 'undefined') return;
  const quality = enable ? 'tiny' : 'default';

  console.log(`[YLM] Setting video quality to: ${quality}`);

  // Instead of injecting a script directly (which is blocked by CSP),
  // we use a custom event that is listened to by the MAIN world script (inject.js).
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const event = new CustomEvent('ytb-listen-mode-quality', {
      detail: { quality: quality },
    });
    window.dispatchEvent(event);
  }
}

// Function to toggle mode
function toggleMode(btn) {
  if (typeof document === 'undefined') return;
  const player = document.querySelector('.html5-video-player');
  if (!player) return;

  const isActive = player.classList.contains('ytb-listen-mode-active');
  if (isActive) {
    player.classList.remove('ytb-listen-mode-active');
    btn.innerHTML = SVG_HEADPHONES;
    btn.title = 'Enable Listen Mode';
    player.querySelector('.ytb-listen-mode-overlay')?.remove();
    updateVideoQuality(false);
    return;
  }

  player.classList.add('ytb-listen-mode-active');
  btn.innerHTML = SVG_VIDEO;
  btn.title = 'Disable Listen Mode';
  if (!player.querySelector('.ytb-listen-mode-overlay')) {
    player.appendChild(createOverlay());
  }
  if (shouldSwitchQuality) {
    updateVideoQuality(true);
  }
}

// Helper to get channel name
function getChannelName() {
  if (typeof document === 'undefined') return null;

  // Modern YouTube selectors
  const selectors = ['.ytd-channel-name .yt-formatted-string'];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const name = el.textContent.trim().replace(/\s+/g, ' ');
      if (name) return name;
    }
  }
  return null;
}

// Helper to get video title
function getVideoTitle() {
  if (typeof document === 'undefined') return null;

  const selectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1.title yt-formatted-string',
    '#title h1 yt-formatted-string',
    'ytd-watch-metadata h1',
    'h1.style-scope.ytd-watch-metadata',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el?.textContent) {
      const title = el.textContent.trim().replace(/\s+/g, ' ');
      if (title) return title;
    }
  }
  return null;
}

// Helper to match channel name against a pattern (substring or regex)
function matchesPattern(pattern, channelName) {
  if (!pattern || !channelName) return false;

  // Check if pattern is a Regex (starts and ends with /)
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const lastSlash = pattern.lastIndexOf('/');
    const regexStr = pattern.slice(1, lastSlash);
    const flags = pattern.slice(lastSlash + 1);
    try {
      // Default to case-insensitive if no flags provided
      const regex = new RegExp(regexStr, flags || 'i');
      return regex.test(channelName);
    } catch (e) {
      console.warn(`[YLM] Invalid regex pattern: ${pattern}. Falling back to substring match.`);
      // Fallback to substring matching if regex is invalid
    }
  }

  // Default: case-insensitive substring match
  return channelName.toLowerCase().includes(pattern.toLowerCase());
}

// Determine mode action based on settings, channel name, and video title
function getModeAction(settings, channelName, videoTitle) {
  const { autoEnable, channelList, disableChannelList } = settings;
  if (autoEnable) return { action: ACTION.ENABLE, reason: REASON.GLOBAL };
  if (!channelName) return { action: ACTION.DISABLE, reason: REASON.NO_CHANNEL };

  // Check disable list first (higher priority)
  const inDisableList = disableChannelList.some((pattern) => matchesPattern(pattern, channelName));
  if (inDisableList) return { action: ACTION.DISABLE, reason: REASON.DISABLE_LIST };

  // Check enable conditions (channel match, or title match if matchTitle is on)
  for (const item of channelList) {
    if (matchesPattern(item.pattern, channelName)) {
      return { action: ACTION.ENABLE, reason: REASON.ENABLE_LIST };
    }
    if (item.matchTitle && matchesPattern(item.pattern, videoTitle || '')) {
      return { action: ACTION.ENABLE, reason: REASON.TITLE_MATCH };
    }
  }

  return { action: ACTION.DISABLE, reason: REASON.DEFAULT };
}

// Apply mode based on channel and title detection
function applyChannelBasedMode(btn, settings) {
  return pollVideoInfo((channelName, videoTitle) => {
    checkInterval = null;
    if (channelName) console.log(`[YLM] Detected channel: "${channelName}"`);
    if (videoTitle) console.log(`[YLM] Detected title: "${videoTitle}"`);
    const { action, reason } = getModeAction(settings, channelName, videoTitle);
    applyMode(btn, action, reason, channelName);
  });
}

// Poll for channel name and video title with timeout
function pollVideoInfo(callback, interval = 500, maxAttempts = 20) {
  let attempts = 0;
  const id = setInterval(() => {
    attempts++;
    const channelName = getChannelName();
    const videoTitle = getVideoTitle();

    if (channelName) {
      clearInterval(id);
      callback(channelName, videoTitle);
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(id);
      callback(null, videoTitle);
    }
  }, interval);
  return id;
}

let debounceTimer = null;

// Check settings and apply mode
function checkSettingsAndApply(btn) {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }

    chrome.storage.local.get(['autoEnable', 'channelList', 'disableChannelList', 'autoSwitch144p'], (result) => {
      const settings = {
        autoEnable: result.autoEnable || false,
        channelList: result.channelList || [],
        disableChannelList: result.disableChannelList || [],
      };
      shouldSwitchQuality = result.autoSwitch144p || false;

      if (settings.autoEnable) {
        applyMode(btn, ACTION.ENABLE, REASON.GLOBAL, null);
        return;
      }

      checkInterval = applyChannelBasedMode(btn, settings);
    });
  }, 250);
}
function enableAudioMode(btn) {
  const player = document.querySelector('.html5-video-player');
  if (!player || player.classList.contains('ytb-listen-mode-active')) return;

  toggleMode(btn);
}

function disableAudioMode(btn) {
  const player = document.querySelector('.html5-video-player');
  if (!player) return;

  const wasActive = player.classList.contains('ytb-listen-mode-active');

  // Remove UI state if active
  if (wasActive) {
    player.classList.remove('ytb-listen-mode-active');
    btn.innerHTML = SVG_HEADPHONES;
    btn.title = 'Enable Listen Mode';
    player.querySelector('.ytb-listen-mode-overlay')?.remove();
  }

  // Always restore quality when mode should be disabled
  // This fixes the cross-tab quality persistence bug
  if (wasActive) {
    console.log('[YLM] Restoring video quality after disabling listen mode');
  } else {
    console.log('[YLM] Ensuring video quality is restored (listen mode not active)');
  }
  updateVideoQuality(false);
}

function applyMode(btn, action, reason, channelName) {
  if (action === ACTION.ENABLE) {
    let msg;
    if (reason === REASON.GLOBAL) {
      msg = '[YLM] Global auto-enable is on (Highest priority)';
    } else if (reason === REASON.ENABLE_LIST) {
      msg = `[YLM] Auto-enabling listen mode for channel: ${channelName} (Lowest priority)`;
    } else if (reason === REASON.TITLE_MATCH) {
      msg = '[YLM] Auto-enabling listen mode (title keyword matched)';
    }
    console.log(msg);
    enableAudioMode(btn);
    return;
  }

  if (reason === REASON.DISABLE_LIST) {
    console.log(`[YLM] Auto-disabling listen mode for channel: ${channelName} (Normal priority)`);
  } else if (reason === REASON.NO_CHANNEL) {
    console.log('[YLM] Auto-disabling listen mode (channel name not found)');
  } else {
    console.log(`[YLM] No rules match for channel: ${channelName}. Defaulting to disabled.`);
  }

  disableAudioMode(btn);
}

// Observe for player controls
function init() {
  if (typeof document === 'undefined') return;
  const observer = new MutationObserver((mutations) => {
    // Only react to significant changes (like adding nodes)
    const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (!hasNewNodes) return;

    // Look for the control bar
    const rightControls = document.querySelector('.ytp-right-controls');
    if (rightControls && !document.querySelector('.ytb-listen-mode-btn')) {
      const btn = createButton();
      btn.onclick = () => toggleMode(btn);

      // Insert before the settings button or at the start
      rightControls.insertBefore(btn, rightControls.firstChild);
      console.log('[YLM] Listen Mode button injected');

      // Check settings when button is injected (implies player loaded)
      checkSettingsAndApply(btn);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Handle SPA navigation
  window.addEventListener('yt-navigate-finish', () => {
    const btn = document.querySelector('.ytb-listen-mode-btn');
    if (btn) {
      // Clean up old state from previous video to prevent false toggle events
      const player = document.querySelector('.html5-video-player');
      if (player) {
        player.classList.remove('ytb-listen-mode-active');
        player.querySelector('.ytb-listen-mode-overlay')?.remove();
        btn.innerHTML = SVG_HEADPHONES;
        btn.title = 'Enable Listen Mode';
      }
      checkSettingsAndApply(btn);
    }
  });
}

// Run init
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Handle messages from background script (keyboard shortcuts)
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const btn = document.querySelector('.ytb-listen-mode-btn');
    if (!btn) return;

    switch (request.action) {
      case 'toggle-listen-mode':
        toggleMode(btn);
        showToast('Listen mode toggled');
        break;

      case 'quick-add-enable':
        quickAddChannel('channelList', 'enable');
        break;

      case 'quick-add-disable':
        quickAddChannel('disableChannelList', 'disable');
        break;
    }
  });
}

function quickAddChannel(storageKey, listName) {
  const channelName = getChannelName();
  if (!channelName) {
    showToast('Could not detect channel name');
    return;
  }

  chrome.storage.local.get([storageKey], (result) => {
    const channels = result[storageKey] || [];

    if (storageKey === 'channelList') {
      const exists = channels.some((c) => c.pattern?.toLowerCase() === channelName.toLowerCase());
      if (exists) {
        showToast(`${channelName} already in ${listName} list`);
        return;
      }
      channels.push({ pattern: channelName, matchTitle: true });
    } else {
      const exists = channels.some(
        (c) => (typeof c === 'string' ? c : c.pattern).toLowerCase() === channelName.toLowerCase()
      );
      if (exists) {
        showToast(`${channelName} already in ${listName} list`);
        return;
      }
      channels.push(channelName);
    }

    chrome.storage.local.set({ [storageKey]: channels }, () => {
      showToast(`Added ${channelName} to ${listName} list ✓`);
    });
  });
}

function showToast(message) {
  if (typeof document === 'undefined') return;

  const existing = document.querySelector('.ytb-listen-mode-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'ytb-listen-mode-toast';
  toast.textContent = message;

  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    z-index: 9999;
    pointer-events: none;
    animation: ytb-toast-in 0.3s ease;
  `;

  if (!document.getElementById('ytb-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'ytb-toast-styles';
    style.textContent = `
      @keyframes ytb-toast-in {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes ytb-toast-out {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'ytb-toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

if (typeof module !== 'undefined') {
  module.exports = {
    getPriorityMode: (channelName, videoTitle, settings) => {
      const { action } = getModeAction(settings, channelName, videoTitle);
      return action === ACTION.ENABLE ? 'ENABLED' : 'DISABLED';
    },
    updateVideoQuality: updateVideoQuality,
    disableAudioMode: disableAudioMode,
    matchesPattern: matchesPattern,
    _createMockButton: () => ({
      innerHTML: '',
      title: '',
    }),
  };
}
