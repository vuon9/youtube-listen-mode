// YouTube Listen Mode Content Script

console.log("YouTube Listen Mode loaded");

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

// Helper to create the button
function createButton() {
    const btn = document.createElement('button');
    btn.className = 'ytp-button ytb-listen-mode-btn';
    btn.title = 'Listen Mode';
    btn.innerHTML = SVG_HEADPHONES; // Default to headphones (switch to audio)
    return btn;
}

// Helper to create the overlay
function createOverlay() {
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
    const player = document.querySelector('.html5-video-player');
    const video = player.querySelector('video'); // Target video element for safety if needed
    if (!player) return;

    const isActive = player.classList.contains('ytb-listen-mode-active');

    if (isActive) {
        // Disable Listen Mode
        player.classList.remove('ytb-listen-mode-active');
        btn.innerHTML = SVG_HEADPHONES;
        btn.title = "Enable Listen Mode";

        // Remove overlay
        const overlay = player.querySelector('.ytb-listen-mode-overlay');
        if (overlay) {
            overlay.remove();
        }
    } else {
        // Enable Listen Mode
        player.classList.add('ytb-listen-mode-active');
        btn.innerHTML = SVG_VIDEO;
        btn.title = "Disable Listen Mode";

        // Inject overlay
        // We append to the player so it sits on top of video but (hopefully) under controls
        // Controls are usually at the bottom of the player container or strictly positioned z-indexed children.
        // Appending usually puts it on top if z-index is handled.
        if (!player.querySelector('.ytb-listen-mode-overlay')) {
            const overlay = createOverlay();
            // Insert before the control bar to avoid messing with it?
            // Usually appending to player is fine if z-index is managed.
            // Let's try appending.
            player.appendChild(overlay);
        }
    }
}

// Helper to get channel name
function getChannelName() {
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

// Check settings and apply mode
function checkSettingsAndApply(btn) {
    chrome.storage.local.get(['autoEnable', 'channelList'], (result) => {
        const autoEnable = result.autoEnable || false;
        const channelList = result.channelList || [];

        if (autoEnable) {
            enableAudioMode(btn);
            return;
        }

        if (channelList.length > 0) {
            // Need to wait for channel name to load
            const checkForChannel = setInterval(() => {
                const channelName = getChannelName();
                if (channelName) {
                    clearInterval(checkForChannel);
                    if (channelList.includes(channelName)) {
                        console.log(`Auto-enabling listen mode for channel: ${channelName}`);
                        enableAudioMode(btn);
                    }
                }
            }, 500);

            // Stop checking after 10 seconds to avoid infinite loop
            setTimeout(() => clearInterval(checkForChannel), 10000);
        }
    });
}

function enableAudioMode(btn) {
    const player = document.querySelector('.html5-video-player');
    if (!player || player.classList.contains('ytb-listen-mode-active')) return;

    toggleMode(btn);
}


// Observe for player controls
function init() {
    const observer = new MutationObserver((mutations) => {
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
}

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
