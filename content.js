// YouTube Listen Mode Content Script

if (typeof document !== 'undefined') {
    console.log("YouTube Listen Mode loaded");
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
  DEFAULT: 'default'
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

// Function to toggle mode
function toggleMode(btn) {
    if (typeof document === 'undefined') return;
    const player = document.querySelector('.html5-video-player');
    if (!player) return;

    const isActive = player.classList.contains('ytb-listen-mode-active');
    if (isActive) {
        player.classList.remove('ytb-listen-mode-active');
        btn.innerHTML = SVG_HEADPHONES;
        btn.title = "Enable Listen Mode";
        player.querySelector('.ytb-listen-mode-overlay')?.remove();
        return;
    }

    player.classList.add('ytb-listen-mode-active');
    btn.innerHTML = SVG_VIDEO;
    btn.title = "Disable Listen Mode";
    if (!player.querySelector('.ytb-listen-mode-overlay')) {
        player.appendChild(createOverlay());
    }
}

// Helper to get channel name
function getChannelName() {
    if (typeof document === 'undefined') return null;
    // Try multiple selectors as YT layout can vary
    const selectors = [
        '#upload-info #channel-name a',
        'ytd-video-owner-renderer #channel-name a',
        '.ytd-channel-name a'
    ];

    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el.textContent.trim();
    }
    return null;
}

// Determine mode action based on settings and channel name
function getModeAction(settings, channelName) {
    const { autoEnable, channelList, disableChannelList } = settings;
    if (autoEnable) return { action: ACTION.ENABLE, reason: REASON.GLOBAL };
    if (!channelName) return { action: ACTION.DISABLE, reason: REASON.NO_CHANNEL };
    
    const lowerName = channelName.toLowerCase();
    const inDisableList = disableChannelList.some(c => c.toLowerCase() === lowerName);
    const inEnableList = channelList.some(c => c.toLowerCase() === lowerName);
    
    if (inDisableList) return { action: ACTION.DISABLE, reason: REASON.DISABLE_LIST };
    if (inEnableList) return { action: ACTION.ENABLE, reason: REASON.ENABLE_LIST };
    return { action: ACTION.DISABLE, reason: REASON.DEFAULT };
}

// Apply mode based on channel detection
function applyChannelBasedMode(btn, settings) {
    return pollChannelName((channelName) => {
        checkInterval = null;
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
                disableChannelList: result.disableChannelList || []
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
    if (!player || !player.classList.contains('ytb-listen-mode-active')) return;

    toggleMode(btn);
}

function applyMode(btn, action, reason, channelName) {
    if (action === ACTION.ENABLE) {
        const msg = reason === REASON.GLOBAL 
            ? 'Global auto-enable is on (Highest priority)' 
            : `Auto-enabling listen mode for channel: ${channelName} (Lowest priority)`;
        console.log(msg);
        enableAudioMode(btn);
        return;
    }
    
    if (reason === REASON.DISABLE_LIST) {
        console.log(`Auto-disabling listen mode for channel: ${channelName} (Normal priority)`);
    } else if (reason === REASON.NO_CHANNEL) {
        console.log('Auto-disabling listen mode (channel name not found)');
    } else {
        console.log(`No rules match for channel: ${channelName}. Defaulting to disabled.`); 
    }
    
    disableAudioMode(btn);
}

// Observe for player controls
function init() {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver((mutations) => {
        // Only react to significant changes (like adding nodes)
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (!hasNewNodes) return;

        // Look for the control bar
        const rightControls = document.querySelector('.ytp-right-controls');
        if (rightControls && !document.querySelector('.ytb-listen-mode-btn')) {
            const btn = createButton();
            btn.onclick = () => toggleMode(btn);

            // Insert before the settings button or at the start
            rightControls.insertBefore(btn, rightControls.firstChild);
            console.log("Listen Mode button injected");

            // Check settings when button is injected (implies player loaded)
            checkSettingsAndApply(btn);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Handle SPA navigation
    window.addEventListener('yt-navigate-finish', () => {
        const btn = document.querySelector('.ytb-listen-mode-btn');
        if (btn) {
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
        getPriorityMode: function(channelName, settings) {
            const { action } = getModeAction(settings, channelName);
            return action === ACTION.ENABLE ? 'ENABLED' : 'DISABLED';
        }
    };
}
