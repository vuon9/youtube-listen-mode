# Title Keyword Matching & Keyboard Shortcuts Design

**Date:** 2025-04-10  
**Project:** YouTube Listen Mode Chrome Extension  
**Status:** Approved for implementation

---

## Overview

Add two complementary features to enhance the auto-enable experience:
1. **Title Keyword Matching** — Auto-enable listen mode based on video title patterns
2. **Keyboard Shortcuts** — Quick keyboard access to toggle mode and manage channels

---

## Feature 1: Title Keyword Matching

### Purpose
Extend the auto-enable logic to match not just channel names, but also video titles. Users can add keywords/regex patterns that, when found in a video title, trigger listen mode automatically.

### User Value
- Listen to "(Audio)" versions of songs automatically
- Auto-enable for podcast episodes regardless of channel
- Catch music/ambient content that isn't from known music channels

### UI Design

**Location:** Popup → "ENABLE FOR CHANNELS" section

**Layout:**
```
┌─────────────────────────────────┐
│ ENABLE FOR CHANNELS      #3 Low │
│ [Add channel...] [+]            │
│ • Lofi Girl [×]                 │
│                                 │
│ OR IF TITLE CONTAINS     NEW    │
│ [Add keyword...] [+]            │
│ • /(Audio|Lyrics)$/i [×]        │
│ • podcast [×]                   │
└─────────────────────────────────┘
```

**Visual Details:**
- "OR IF TITLE CONTAINS" subsection appears below channel tags
- Green "NEW" badge next to subsection title
- Same input/tag pattern as existing channel list
- Regex patterns render with blue background (`tag.regex` class)

### Data Model

**Storage Keys:**
```javascript
// Existing
channelList: ["Lofi Girl", "/^The/i"]
disableChannelList: ["Marques Brownlee"]

// New
titleKeywordList: ["podcast", "/(Audio|Lyrics)$/i"]
```

### Logic Flow

**Updated Priority Order:**
1. `#1 High` — Global Always Enable (unchanged)
2. `#2 Normal` — Disable for Channels (unchanged)
3. `#3 Low` — Enable for Channels **OR** Title Keywords (combined)

**Matching Algorithm:**
```javascript
function getModeAction(settings, channelName, videoTitle) {
  const { autoEnable, channelList, disableChannelList, titleKeywordList } = settings;
  
  // Priority 1: Global always enable
  if (autoEnable) return { action: ACTION.ENABLE, reason: REASON.GLOBAL };
  
  // Priority 2: Channel in disable list (override)
  const inDisableList = disableChannelList.some(p => matchesPattern(p, channelName));
  if (inDisableList) return { action: ACTION.DISABLE, reason: REASON.DISABLE_LIST };
  
  // Priority 3: Channel OR Title matches (combined)
  const inEnableList = channelList.some(p => matchesPattern(p, channelName));
  const titleMatches = titleKeywordList.some(p => matchesPattern(p, videoTitle));
  
  if (inEnableList || titleMatches) {
    const reason = inEnableList ? REASON.ENABLE_LIST : REASON.TITLE_MATCH;
    return { action: ACTION.ENABLE, reason };
  }
  
  // Default: disabled
  return { action: ACTION.DISABLE, reason: REASON.DEFAULT };
}
```

**New Reason Constant:**
```javascript
REASON.TITLE_MATCH = 'titleMatch';
```

### Content Script Changes

**New Helper Function:**
```javascript
function getVideoTitle() {
  // Try multiple selectors for resilience
  const selectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1.title yt-formatted-string',
    '#title h1 yt-formatted-string',
    'ytd-watch-metadata h1',
  ];
  
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el?.textContent) return el.textContent.trim();
  }
  return null;
}
```

**Updated `applyChannelBasedMode`:**
- Poll for both channel name AND video title
- Pass both to `getModeAction`

---

## Feature 2: Keyboard Shortcuts

### Purpose
Provide keyboard access to common actions for power users. Shortcuts work globally on YouTube tabs without needing to open the popup.

### User Value
- Toggle listen mode without mouse movement
- Quickly add channels to lists while watching
- Works even when popup is closed

### Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt+L` / `Cmd+Shift+L` | Toggle Listen Mode | Toggle current video's listen mode state |
| `Alt+E` / `Cmd+Shift+E` | Quick Add to Enable | Add current channel to enable list |
| `Alt+D` / `Cmd+Shift+D` | Quick Add to Disable | Add current channel to disable list |

**Mac Note:** Chrome extensions can't reliably use `Cmd` alone (system conflicts), so we use `Cmd+Shift+Letter` on Mac and `Alt+Letter` on Windows/Linux. The extension detects platform and shows appropriate shortcut in UI.

### UI Design

**Location:** Popup — new section below "Always Enable" footer

**Layout:**
```
┌─────────────────────────────────┐
│ ⚡ Always Enable          [ON]  │
├─────────────────────────────────┤
│ KEYBOARD SHORTCUTS       NEW    │
│                                 │
│ 🎧 Toggle Listen Mode           │
│    Alt + L   (Mac: Cmd+Shift+L) │
│                                 │
│ ➕ Add Channel to Enable          │
│    Alt + E   (Mac: Cmd+Shift+E) │
│                                 │
│ ➖ Add Channel to Disable         │
│    Alt + D   (Mac: Cmd+Shift+D) │
├─────────────────────────────────┤
│ 💡 Tip: Shortcuts work even when│
│    this popup is closed.        │
└─────────────────────────────────┘
```

**Visual Details:**
- Section header with "NEW" badge
- Icon + action name on left
- Key combination on right (monospace keys)
- Mac/Windows dual notation where platform differs
- Tip box at bottom with light gray background

### Manifest Changes

```json
{
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

### Architecture

**Service Worker (New File: `src/background.js`):**
```javascript
chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab.url?.includes('youtube.com/watch')) return;
  
  chrome.tabs.sendMessage(tab.id, { action: command });
});
```

**Content Script Message Handler:**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'toggle-listen-mode':
      toggleModeFromShortcut();
      break;
    case 'quick-add-enable':
      quickAddChannel('channelList');
      break;
    case 'quick-add-disable':
      quickAddChannel('disableChannelList');
      break;
  }
});

function toggleModeFromShortcut() {
  const btn = document.querySelector('.ytb-listen-mode-btn');
  if (btn) toggleMode(btn);
}

function quickAddChannel(storageKey) {
  const channelName = getChannelName();
  if (!channelName) {
    showToast('Could not detect channel name');
    return;
  }
  
  chrome.storage.local.get([storageKey], (result) => {
    const channels = result[storageKey] || [];
    if (channels.includes(channelName)) {
      showToast(`${channelName} already in list`);
      return;
    }
    
    channels.push(channelName);
    chrome.storage.local.set({ [storageKey]: channels }, () => {
      showToast(`Added ${channelName} to ${storageKey}`);
    });
  });
}

function showToast(message) {
  // Create and show a toast notification
  // Auto-remove after 3 seconds
}
```

### Platform Detection (Popup UI)

```javascript
function getShortcutDisplay(command) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcuts = {
    'toggle-listen-mode': isMac ? 'Cmd+Shift+L' : 'Alt+L',
    'quick-add-enable': isMac ? 'Cmd+Shift+E' : 'Alt+E',
    'quick-add-disable': isMac ? 'Cmd+Shift+D' : 'Alt+D',
  };
  return shortcuts[command];
}
```

---

## Toast Notifications

For quick-add actions, show non-intrusive toast notifications:

**Design:**
- Position: Bottom-center of video player
- Style: Dark background, white text, rounded corners
- Duration: 3 seconds auto-dismiss
- Content: Icon + message

**Messages:**
- "Added Lofi Girl to enable list ✓"
- "Channel already in list ℹ"
- "Could not detect channel ✗"

---

## Testing Considerations

1. **Title matching** — Test with various YouTube title formats (different languages, special characters)
2. **Regex in titles** — Ensure patterns like `/(Audio|Lyrics)$/i` work correctly
3. **Keyboard shortcuts** — Test on both Mac and Windows
4. **Cross-tab behavior** — Shortcuts should only affect active YouTube tab
5. **Conflict detection** — Chrome will warn users if shortcuts conflict with other extensions

---

## Implementation Phases

**Phase 1: Title Keyword Matching**
- Add storage key and UI
- Update content script logic
- Add `getVideoTitle()` helper
- Test auto-enable with titles

**Phase 2: Keyboard Shortcuts**
- Add background service worker
- Update manifest with commands
- Add popup UI section
- Implement toast notifications
- Test cross-platform

---

## Success Criteria

- [ ] Title keywords trigger listen mode as reliably as channel matching
- [ ] Regex patterns work in title matching (e.g., `/(Audio|Lyrics)$/i`)
- [ ] Keyboard shortcuts work on YouTube watch pages
- [ ] Mac shortcuts display and work correctly (Cmd+Shift)
- [ ] Quick-add shows confirmation toast
- [ ] No console errors on SPA navigation
- [ ] All existing tests continue to pass

---

## Open Questions (None)

All design decisions finalized:
- ✓ Inline UI for title keywords (not tabbed)
- ✓ Inline UI for shortcuts (not Chrome shortcuts page)
- ✓ Mac uses Cmd+Shift (not Cmd alone)
- ✓ No disable list for titles (enable-only for now)
- ✓ Toast notifications included

---

**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan
