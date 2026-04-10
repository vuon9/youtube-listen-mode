const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const {
  getPriorityMode,
  updateVideoQuality,
  disableAudioMode,
  _createMockButton,
} = require('../../src/content.js');

// Mock console methods to suppress [YLM] logs during testing
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[YLM]')) return;
  originalLog(...args);
};
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[YLM]')) return;
  originalWarn(...args);
};
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[YLM]')) return;
  originalError(...args);
};

let settings = {
  autoEnable: false,
  channelList: [],
  disableChannelList: [],
  titleKeywordList: [],
};
let currentChannel = '';
let currentTitle = '';
let actualMode = '';

Before(function () {
  settings = {
    autoEnable: false,
    channelList: [],
    disableChannelList: [],
    titleKeywordList: [],
  };
  currentChannel = '';
  currentTitle = '';
  actualMode = '';
});

Given('global auto-enable is {string}', function (state) {
  settings.autoEnable = state === 'ON';
});

Given('{string} is in the {string} list', function (channel, listType) {
  if (listType === 'Always Disable') {
    settings.disableChannelList.push(channel);
  } else {
    settings.channelList.push(channel);
  }
});

Given('{string} is not in any list', function (channel) {
  settings.channelList = settings.channelList.filter((c) => c !== channel);
  settings.disableChannelList = settings.disableChannelList.filter((c) => c !== channel);
});

When('I check the mode for {string}', function (channel) {
  currentChannel = channel;
  actualMode = getPriorityMode(currentChannel, currentTitle, settings);
});

Then('the mode should be {string}', function (expectedMode) {
  assert.strictEqual(actualMode, expectedMode);
});

// Quality Control Steps
let lastQualitySet = '';
let simulatedPreviousQuality = 'default';

// Mock Browser Environment
if (typeof global.window === 'undefined') {
  global.window = {
    dispatchEvent: (event) => {
      // Emulate inject.js behavior: intercept event and handle logic
      const { quality } = event.detail || {};
      if (quality === 'tiny') {
        // In actual inject.js, it remembers original quality here
        // We'll trust simulatedPreviousQuality set in tests
      } else if (quality === 'default') {
        // Emulate 'default' restoring previous quality
        lastQualitySet = simulatedPreviousQuality;
        return;
      }
      lastQualitySet = quality;
    },
  };
}

if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(name, data) {
      this.name = name;
      this.detail = data.detail;
    }
  };
}

const mockPlayer = {
  setPlaybackQualityRange: (q) => {
    lastQualitySet = q;
  },
  setPlaybackQuality: (q) => {
    lastQualitySet = q;
  },
};

Given('original video quality was {string}', function (quality) {
  simulatedPreviousQuality = quality;
});

Given('Listen Mode is being enabled', function () {
  // Mock document
  global.document = {
    querySelector: (sel) => {
      if (sel === '.html5-video-player') return mockPlayer;
      return null;
    },
  };
  updateVideoQuality(true);
});

When('Listen Mode is being disabled', function () {
  // Mock document
  global.document = {
    querySelector: (sel) => {
      if (sel === '.html5-video-player') return mockPlayer;
      return null;
    },
  };
  updateVideoQuality(false);
});

Then('the video quality should be set to {string}', function (expectedQuality) {
  assert.strictEqual(lastQualitySet, expectedQuality);
});

Then('the video quality should be restored to {string}', function (expectedQuality) {
  assert.strictEqual(lastQualitySet, expectedQuality);
});

// Cross-tab quality restoration test steps
Given('listen mode has never been active on this page', function () {
  // Reset quality tracking and simulated previous quality
  lastQualitySet = '';
  simulatedPreviousQuality = 'default';
  // Mock player without listen mode active class
  const mockPlayerNotActive = {
    classList: {
      contains: (cls) => cls !== 'ytb-listen-mode-active', // Never active
      remove: () => {},
      add: () => {},
    },
    querySelector: () => null,
  };
  global.document = {
    querySelector: (sel) => {
      if (sel === '.html5-video-player') return mockPlayerNotActive;
      return null;
    },
  };
});

When('listen mode should be disabled', function () {
  const mockBtn = _createMockButton();
  disableAudioMode(mockBtn);
});

Then('video quality should be restored to default', function () {
  assert.strictEqual(
    lastQualitySet,
    'default',
    'Quality should be restored to default even when listen mode was never active'
  );
});

// Title Keyword Steps
Given('I have added {string} to title keywords', function (keyword) {
  settings.titleKeywordList.push(keyword);
});

When('I check the mode for channel {string} with title {string}', function (channel, title) {
  currentChannel = channel;
  currentTitle = title;
  actualMode = getPriorityMode(currentChannel, currentTitle, settings);
});

When('I check the mode for a video with title {string}', function (title) {
  currentChannel = 'SomeChannel';
  currentTitle = title;
  actualMode = getPriorityMode(currentChannel, currentTitle, settings);
});
