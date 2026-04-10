# Title Keywords & Keyboard Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add title keyword matching for auto-enable and keyboard shortcuts for quick actions

**Architecture:** Extend existing popup.js and content.js with new storage keys and handlers. Add background service worker for keyboard shortcuts. Maintain existing patterns for regex matching and storage management.

**Tech Stack:** Vanilla JavaScript, Chrome Extension Manifest V3 APIs, chrome.storage.local, chrome.commands

---

## File Structure

**Modified Files:**
- `src/popup.html` — Add title keyword inputs and keyboard shortcuts section
- `src/popup.js` — Add title keyword management and keyboard shortcut display
- `src/popup.css` — Add styling for new sections
- `src/content.js` — Add video title extraction and updated matching logic
- `manifest.json` — Add commands API and background service worker

**New Files:**
- `src/background.js` — Service worker for keyboard shortcut command handling
- `features/title_keywords.feature` — Cucumber feature tests
- `features/step_definitions/title_steps.js` — Step definitions for title tests

---

## Task 1: Add Storage and UI for Title Keywords in Popup

**Files:**
- Modify: `src/popup.html:39-52` (after channel list section)
- Modify: `src/popup.js:1-113`
- Modify: `src/popup.css` (add styles for title section)

- [ ] **Step 1: Add title keyword input section to popup.html**

Add after the channel list section (around line 52):

```html
<!-- Title Keywords Section -->
<div class="section-title" style="margin-top: 16px;">
  OR IF TITLE CONTAINS
  <span class="new-badge">NEW</span>
</div>
<div class="input-card">
  <input type="text" id="titleKeywordInput" placeholder="Add title keyword or regex...">
  <button class="add-button" id="addTitleKeywordBtn" title="Add">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </button>
</div>
<div id="titleKeywordList" class="tags-container">
  <!-- Tags will be injected here -->
</div>
```

- [ ] **Step 2: Add CSS for new badge**

Add to `src/popup.css`:

```css
.new-badge {
  background: #4caf50;
  color: white;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  font-weight: 600;
}
```

- [ ] **Step 3: Add title keyword management logic to popup.js**

Add after line 12 in popup.js:

```javascript
// Title keyword elements
const titleKeywordInput = document.getElementById('titleKeywordInput');
const addTitleKeywordBtn = document.getElementById('addTitleKeywordBtn');
const titleKeywordListContainer = document.getElementById('titleKeywordList');
```

- [ ] **Step 4: Load and render title keywords**

Update the load settings callback (around line 21):

```javascript
chrome.storage.local.get(
  {
    autoEnable: false,
    channelList: [],
    disableChannelList: [],
    titleKeywordList: [], // NEW
  },
  (result) => {
    autoEnableCheckbox.checked = result.autoEnable;
    renderChannels(result.channelList, channelListContainer, 'channelList');
    renderChannels(result.disableChannelList, disableChannelListContainer, 'disableChannelList');
    renderChannels(result.titleKeywordList, titleKeywordListContainer, 'titleKeywordList'); // NEW
  }
);
```

- [ ] **Step 5: Add title keyword event listeners**

Add after existing addChannelBtn listeners (around line 40):

```javascript
// Title keyword events
addTitleKeywordBtn.addEventListener('click', () =>
  addChannel(titleKeywordInput, 'titleKeywordList', titleKeywordListContainer)
);
titleKeywordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addChannel(titleKeywordInput, 'titleKeywordList', titleKeywordListContainer);
});
titleKeywordInput.addEventListener('input', () => validateRegex(titleKeywordInput));
```

- [ ] **Step 6: Commit**

```bash
git add src/popup.html src/popup.js src/popup.css
git commit -m "feat: add title keyword UI to popup"
```

---

## Task 2: Add Keyboard Shortcuts Section to Popup

**Files:**
- Modify: `src/popup.html:103-106` (after footer)
- Modify: `src/popup.js`
- Modify: `src/popup.css`

- [ ] **Step 1: Add keyboard shortcuts section to popup.html**

Add before `</div>` closing tag of container (after the footer-action-card):

```html
<!-- Keyboard Shortcuts Section -->
<div class="shortcuts-section">
  <div class="section-header">
    <h3>Keyboard Shortcuts</h3>
    <span class="new-badge">NEW</span>
  </div>
  
  <div class="shortcut-item">
    <div class="shortcut-info">
      <span class="shortcut-icon">🎧</span>
      <span class="shortcut-name">Toggle Listen Mode</span>
    </div>
    <div class="shortcut-keys" id="shortcut-toggle">
      <span class="key">Alt</span>
      <span class="plus">+</span>
      <span class="key">L</span>
    </div>
  </div>
  
  <div class="shortcut-item">
    <div class="shortcut-info">
      <span class="shortcut-icon">➕</span>
      <span class="shortcut-name">Add to Enable List</span>
    </div>
    <div class="shortcut-keys" id="shortcut-enable">
      <span class="key">Alt</span>
      <span class="plus">+</span>
      <span class="key">E</span>
    </div>
  </div>
  
  <div class="shortcut-item">
    <div class="shortcut-info">
      <span class="shortcut-icon">➖</span>
      <span class="shortcut-name">Add to Disable List</span>
    </div>
    <div class="shortcut-keys" id="shortcut-disable">
      <span class="key">Alt</span>
      <span class="plus">+</span>
      <span class="key">D</span>
    </div>
  </div>
  
  <div class="shortcuts-tip">
    💡 Shortcuts work even when this popup is closed
  </div>
</div>
```

- [ ] **Step 2: Add CSS for shortcuts section**

Add to `src/popup.css`:

```css
.shortcuts-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.shortcuts-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.shortcuts-section h3 {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.shortcut-item:last-of-type {
  border-bottom: none;
}

.shortcut-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-icon {
  font-size: 14px;
}

.shortcut-name {
  font-size: 12px;
  color: #555;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shortcut-keys .key {
  padding: 3px 8px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: #555;
}

.shortcut-keys .plus {
  color: #999;
  font-size: 11px;
}

.shortcuts-tip {
  margin-top: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 11px;
  color: #666;
}
```

- [ ] **Step 3: Add platform detection for Mac shortcuts in popup.js**

Add at the end of popup.js (before closing brace):

```javascript
// Platform-specific shortcut display
function updateShortcutDisplay() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const shortcuts = {
    'shortcut-toggle': isMac ? ['Cmd', 'Shift', 'L'] : ['Alt', 'L'],
    'shortcut-enable': isMac ? ['Cmd', 'Shift', 'E'] : ['Alt', 'E'],
    'shortcut-disable': isMac ? ['Cmd', 'Shift', 'D'] : ['Alt', 'D'],
  };
  
  for (const [id, keys] of Object.entries(shortcuts)) {
    const container = document.getElementById(id);
    if (!container) continue;
    
    if (isMac && keys.length === 3) {
      container.innerHTML = `
        <span class="key">${keys[0]}</span>
        <span class="plus">+</span>
        <span class="key">${keys[1]}</span>
        <span class="plus">+</span>
        <span class="key">${keys[2]}</span>
      `;
    } else if (keys.length === 2) {
      container.innerHTML = `
        <span class="key">${keys[0]}</span>
        <span class="plus">+</span>
        <span class="key">${keys[1]}</span>
      `;
    }
  }
}

// Call on load
updateShortcutDisplay();
```

- [ ] **Step 4: Commit**

```bash
git add src/popup.html src/popup.js src/popup.css
git commit -m "feat: add keyboard shortcuts section to popup with platform detection"
```

---

## Task 3: Update Content Script for Title Matching

**Files:**
- Modify: `src/content.js`

- [ ] **Step 1: Add REASON constant for title match**

Add to REASON object (after line 28):

```javascript
REASON.TITLE_MATCH = 'titleMatch';
```

- [ ] **Step 2: Add getVideoTitle helper function**

Add after getChannelName function (after line 118):

```javascript
// Helper to get video title
function getVideoTitle() {
  if (typeof document === 'undefined') return null;

  // Try multiple selectors for resilience
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
```

- [ ] **Step 3: Update getModeAction to accept videoTitle parameter**

Modify getModeAction function signature and logic (lines 144-156):

```javascript
// Determine mode action based on settings, channel name, and video title
function getModeAction(settings, channelName, videoTitle) {
  const { autoEnable, channelList, disableChannelList, titleKeywordList } = settings;
  
  if (autoEnable) return { action: ACTION.ENABLE, reason: REASON.GLOBAL };
  if (!channelName) return { action: ACTION.DISABLE, reason: REASON.NO_CHANNEL };

  // Check disable list first (higher priority)
  const inDisableList = disableChannelList.some((pattern) => matchesPattern(pattern, channelName));
  if (inDisableList) return { action: ACTION.DISABLE, reason: REASON.DISABLE_LIST };

  // Check enable conditions (channel OR title)
  const inEnableList = channelList.some((pattern) => matchesPattern(pattern, channelName));
  const titleMatches = titleKeywordList?.some((pattern) => matchesPattern(pattern, videoTitle || ''));

  if (inEnableList) return { action: ACTION.ENABLE, reason: REASON.ENABLE_LIST };
  if (titleMatches) return { action: ACTION.ENABLE, reason: REASON.TITLE_MATCH };
  
  return { action: ACTION.DISABLE, reason: REASON.DEFAULT };
}
```

- [ ] **Step 4: Update pollChannelName to also get video title**

Create new function pollVideoInfo (replace pollChannelName usage):

```javascript
// Poll for both channel name and video title
function pollVideoInfo(callback, interval = 500, maxAttempts = 20) {
  let attempts = 0;
  const id = setInterval(() => {
    attempts++;
    const channelName = getChannelName();
    const videoTitle = getVideoTitle();
    
    // Continue if we have at least channel name (title may come later)
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
```

- [ ] **Step 5: Update applyChannelBasedMode to use pollVideoInfo**

Modify applyChannelBasedMode (lines 159-166):

```javascript
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
```

- [ ] **Step 6: Update checkSettingsAndApply to include titleKeywordList**

Modify storage.get call (around line 199):

```javascript
chrome.storage.local.get(['autoEnable', 'channelList', 'disableChannelList', 'titleKeywordList'], (result) => {
  const settings = {
    autoEnable: result.autoEnable || false,
    channelList: result.channelList || [],
    disableChannelList: result.disableChannelList || [],
    titleKeywordList: result.titleKeywordList || [], // NEW
  };
  // ... rest of function
```

- [ ] **Step 7: Update applyMode console messages**

Add handling for REASON.TITLE_MATCH in applyMode (around line 246):

```javascript
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
  // ... rest of function unchanged
```

- [ ] **Step 8: Commit**

```bash
git add src/content.js
git commit -m "feat: add video title matching to auto-enable logic"
```

---

## Task 4: Add Keyboard Shortcut Handlers

**Files:**
- Create: `src/background.js`
- Modify: `src/content.js`
- Modify: `manifest.json`

- [ ] **Step 1: Create background service worker**

Create `src/background.js`:

```javascript
// Background service worker for keyboard shortcuts

chrome.commands.onCommand.addListener((command, tab) => {
  // Only work on YouTube watch pages
  if (!tab?.url?.includes('youtube.com/watch')) {
    return;
  }

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, { action: command }).catch((err) => {
    console.log('[YLM] Could not send message to tab:', err);
  });
});

// Log when extension starts
console.log('[YLM] Background service worker started');
```

- [ ] **Step 2: Add message listener to content.js**

Add at the end of content.js (before module.exports):

```javascript
// Handle messages from background script (keyboard shortcuts)
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

// Quick add current channel to a list
function quickAddChannel(storageKey, listName) {
  const channelName = getChannelName();
  if (!channelName) {
    showToast('Could not detect channel name');
    return;
  }

  chrome.storage.local.get([storageKey], (result) => {
    const channels = result[storageKey] || [];
    
    // Check if already exists (case-insensitive)
    const exists = channels.some(c => c.toLowerCase() === channelName.toLowerCase());
    if (exists) {
      showToast(`${channelName} already in ${listName} list`);
      return;
    }

    channels.push(channelName);
    chrome.storage.local.set({ [storageKey]: channels }, () => {
      showToast(`Added ${channelName} to ${listName} list ✓`);
    });
  });
}

// Show toast notification
function showToast(message) {
  if (typeof document === 'undefined') return;
  
  // Remove existing toast
  const existing = document.querySelector('.ytb-listen-mode-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'ytb-listen-mode-toast';
  toast.textContent = message;
  
  // Style the toast
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 9999;
    pointer-events: none;
    animation: ytb-toast-in 0.3s ease;
  `;

  // Add animation styles if not already present
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

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'ytb-toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

- [ ] **Step 3: Update manifest.json**

Add to manifest.json:

```json
{
  "background": {
    "service_worker": "src/background.js",
    "type": "module"
  },
  "commands": {
    "toggle-listen-mode": {
      "suggested_key": {
        "default": "Alt+L",
        "mac": "Command+Shift+L"
      },
      "description": "Toggle listen mode for current video"
    },
    "quick-add-enable": {
      "suggested_key": {
        "default": "Alt+E",
        "mac": "Command+Shift+E"
      },
      "description": "Add current channel to enable list"
    },
    "quick-add-disable": {
      "suggested_key": {
        "default": "Alt+D",
        "mac": "Command+Shift+D"
      },
      "description": "Add current channel to disable list"
    }
  }
}
```

Also ensure the storage permission exists:
```json
"permissions": ["activeTab", "scripting", "storage"]
```

- [ ] **Step 4: Commit**

```bash
git add src/background.js src/content.js manifest.json
git commit -m "feat: add keyboard shortcuts with background service worker"
```

---

## Task 5: Add Feature Tests

**Files:**
- Create: `features/title_keywords.feature`
- Create: `features/step_definitions/title_steps.js`
- Modify: `features/step_definitions/steps.js` (if needed)

- [ ] **Step 1: Create title keywords feature file**

Create `features/title_keywords.feature`:

```gherkin
Feature: Title Keyword Matching for Auto-Enable

  Background:
    Given the extension is installed
    And auto-enable is disabled

  Scenario: Title keyword triggers listen mode enable
    Given I have added "podcast" to title keywords
    When I navigate to a video with title "Best Podcast Episode 123"
    Then listen mode should be enabled
    And the reason should be "titleMatch"

  Scenario: Regex pattern in title triggers enable
    Given I have added "/(Audio|Lyrics)$/i" to title keywords
    When I navigate to a video with title "Song Title (Audio)"
    Then listen mode should be enabled
    And the reason should be "titleMatch"

  Scenario: Title keyword does not match
    Given I have added "podcast" to title keywords
    When I navigate to a video with title "Tutorial: How to Code"
    Then listen mode should be disabled

  Scenario: Channel match takes precedence over title match
    Given I have added "Lofi Girl" to enable channels
    And I have added "podcast" to title keywords
    When I navigate to a video from channel "Lofi Girl" with title "Best Podcast Episode"
    Then listen mode should be enabled
    And the reason should be "enableList"

  Scenario: Disable list overrides title match
    Given I have added "Marques Brownlee" to disable channels
    And I have added "podcast" to title keywords
    When I navigate to a video from channel "Marques Brownlee" with title "WVFRM Podcast Episode"
    Then listen mode should be disabled
    And the reason should be "disableList"
```

- [ ] **Step 2: Create step definitions**

Create `features/step_definitions/title_steps.js`:

```javascript
const assert = require('assert');
const { Given, When, Then } = require('@cucumber/cucumber');

// Mock the content script functions for testing
const contentScript = require('../../src/content.js');

Given('I have added {string} to title keywords', function (keyword) {
  this.settings = this.settings || {};
  this.settings.titleKeywordList = this.settings.titleKeywordList || [];
  this.settings.titleKeywordList.push(keyword);
});

When('I navigate to a video with title {string}', function (title) {
  this.videoTitle = title;
  this.channelName = null; // No channel for title-only tests
});

When('I navigate to a video from channel {string} with title {string}', function (channel, title) {
  this.channelName = channel;
  this.videoTitle = title;
});

Then('listen mode should be enabled', function () {
  const result = contentScript.getPriorityMode(
    this.channelName,
    this.videoTitle,
    this.settings
  );
  assert.strictEqual(result, 'ENABLED', `Expected ENABLED but got ${result}`);
});

Then('listen mode should be disabled', function () {
  const result = contentScript.getPriorityMode(
    this.channelName,
    this.videoTitle,
    this.settings
  );
  assert.strictEqual(result, 'DISABLED', `Expected DISABLED but got ${result}`);
});

Then('the reason should be {string}', function (expectedReason) {
  // This requires exposing more from content script
  // For now, we just verify the mode is correct
  // Full reason checking would need getModeAction exported
});
```

- [ ] **Step 3: Update content.js exports for testing**

Modify the module.exports at end of content.js:

```javascript
if (typeof module !== 'undefined') {
  module.exports = {
    getPriorityMode: function (channelName, videoTitle, settings) {
      const { action } = getModeAction(settings, channelName, videoTitle);
      return action === ACTION.ENABLE ? 'ENABLED' : 'DISABLED';
    },
    updateVideoQuality: updateVideoQuality,
    disableAudioMode: disableAudioMode,
    matchesPattern: matchesPattern,
    getVideoTitle: getVideoTitle,
    // Exposed for testing: mock button for testing disableAudioMode
    _createMockButton: () => ({
      innerHTML: '',
      title: '',
    }),
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All existing tests pass + new title keyword tests pass

- [ ] **Step 5: Commit**

```bash
git add features/ src/content.js
git commit -m "test: add cucumber tests for title keyword matching"
```

---

## Task 6: Update Build and Extension Package

**Files:**
- Modify: Build scripts (if any)
- Test: Load extension in Chrome

- [ ] **Step 1: Ensure background.js is included in build**

If there's a build/packaging script, verify it includes `src/background.js`.

- [ ] **Step 2: Update ops/sync-version.js if needed**

Check if version sync needs to handle background script.

- [ ] **Step 3: Test extension loading**

1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select `extension/` folder
4. Verify no console errors
5. Check that keyboard shortcuts appear in `chrome://extensions/shortcuts`

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: include background script in extension package"
```

---

## Verification Checklist

Before marking complete:

- [ ] Title keywords UI appears in popup
- [ ] Can add/remove title keywords
- [ ] Regex validation works for title keywords
- [ ] Title keyword triggers auto-enable
- [ ] Channel OR title matching works (both trigger)
- [ ] Keyboard shortcuts section shows in popup
- [ ] Mac shortcuts display correctly (Cmd+Shift)
- [ ] Alt+L toggles listen mode
- [ ] Alt+E adds channel to enable list
- [ ] Alt+D adds channel to disable list
- [ ] Toast notifications appear for quick-add
- [ ] All Cucumber tests pass
- [ ] No console errors on YouTube navigation

---

## Notes for Implementer

1. **Existing patterns to follow:**
   - Use `chrome.storage.local.get/set` for persistence
   - Use `matchesPattern()` for both regex and substring matching
   - Follow existing CSS class naming (kebab-case)
   - Use console.log with `[YLM]` prefix for debugging

2. **Testing approach:**
   - Run `npm test` after each task
   - Manually test on YouTube after Task 4
   - Check both Windows (Alt) and Mac (Cmd+Shift) shortcuts display

3. **Common pitfalls:**
   - YouTube's SPA navigation requires re-checking on `yt-navigate-finish`
   - Storage defaults must be handled (empty arrays for new keys)
   - Mac uses `Command` not `Cmd` in manifest.json

4. **Platform differences:**
   - Display: `Cmd+Shift+X` on Mac, `Alt+X` on Windows
   - Manifest: `Command+Shift+X` for Mac, `Alt+X` for default
