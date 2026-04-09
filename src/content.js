// YouTube Listen Mode Content Script

if (typeof document !== 'undefined') {
  console.log('[YLM] YouTube Listen Mode loaded');
}

let checkInterval = null;

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
  updateVideoQuality(true);
}

// Helper to get channel name
function getChannelName() {
  if (typeof document === 'undefined') return null;

  // Try reliable metadata first
  const metaAuthor =
    document.querySelector('[itemprop="author"] [itemprop="name"]') ||
    document.querySelector('[itemprop="author"] link[itemprop="name"]');
  if (metaAuthor) {
    const name = metaAuthor.getAttribute('content') || metaAuthor.textContent;
    if (name) return name.trim().replace(/\s+/g, ' ');
  }

  // Modern YouTube selectors
  const selectors = [
    '#upload-info #channel-name a',
    'ytd-video-owner-renderer #channel-name a',
    'ytd-video-owner-renderer #owner-name a',
    '#owner #channel-name a',
    '.ytd-channel-name a',
    '#channel-name yt-formatted-string',
    '#owner-name yt-formatted-string',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const name = el.textContent.trim().replace(/\s+/g, ' ');
      if (name) return name;
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

// Determine mode action based on settings and channel name
function getModeAction(settings, channelName) {
  const { autoEnable, channelList, disableChannelList } = settings;
  if (autoEnable) return { action: ACTION.ENABLE, reason: REASON.GLOBAL };
  if (!channelName) return { action: ACTION.DISABLE, reason: REASON.NO_CHANNEL };

  // Check if any item in the list matches the channel name
  const inDisableList = disableChannelList.some((pattern) => matchesPattern(pattern, channelName));
  const inEnableList = channelList.some((pattern) => matchesPattern(pattern, channelName));

  if (inDisableList) return { action: ACTION.DISABLE, reason: REASON.DISABLE_LIST };
  if (inEnableList) return { action: ACTION.ENABLE, reason: REASON.ENABLE_LIST };
  return { action: ACTION.DISABLE, reason: REASON.DEFAULT };
}

// Apply mode based on channel detection
function applyChannelBasedMode(btn, settings) {
  return pollChannelName((channelName) => {
    checkInterval = null;
    if (channelName) console.log(`[YLM] Detected channel: "${channelName}"`);
    const { action, reason } = getModeAction(settings, channelName);
    applyMode(btn, action, reason, channelName);
  });
}

// Poll for channel name with timeout
function pollChannelName(callback, interval = 500, maxAttempts = 20) {
  let attempts = 0;
  const id = setInterval(() => {
    attempts++;
    const channelName = getChannelName();
    if (channelName) {
      clearInterval(id);
      callback(channelName);
      return;
    }
    if (attempts >= maxAttempts) {
      clearInterval(id);
      callback(null);
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

    chrome.storage.local.get(['autoEnable', 'channelList', 'disableChannelList'], (result) => {
      const settings = {
        autoEnable: result.autoEnable || false,
        channelList: result.channelList || [],
        disableChannelList: result.disableChannelList || [],
      };

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
    const msg =
      reason === REASON.GLOBAL
        ? '[YLM] Global auto-enable is on (Highest priority)'
        : `[YLM] Auto-enabling listen mode for channel: ${channelName} (Lowest priority)`;
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

if (typeof module !== 'undefined') {
  module.exports = {
    getPriorityMode: function (channelName, settings) {
      const { action } = getModeAction(settings, channelName);
      return action === ACTION.ENABLE ? 'ENABLED' : 'DISABLED';
    },
    updateVideoQuality: updateVideoQuality,
    disableAudioMode: disableAudioMode,
    // Exposed for testing: mock button for testing disableAudioMode
    _createMockButton: () => ({
      innerHTML: '',
      title: '',
    }),
  };
}
