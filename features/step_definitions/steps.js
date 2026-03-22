const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const { getPriorityMode, updateVideoQuality } = require('../../content.js');

let settings = {
    autoEnable: false,
    channelList: [],
    disableChannelList: []
};
let currentChannel = '';
let actualMode = '';

Before(function () {
    settings = {
        autoEnable: false,
        channelList: [],
        disableChannelList: []
    };
    currentChannel = '';
    actualMode = '';
});

Given('global auto-enable is {string}', function (state) {
    settings.autoEnable = (state === 'ON');
});

Given('{string} is in the {string} list', function (channel, listType) {
    if (listType === 'Always Disable') {
        settings.disableChannelList.push(channel);
    } else {
        settings.channelList.push(channel);
    }
});

Given('{string} is not in any list', function (channel) {
    settings.channelList = settings.channelList.filter(c => c !== channel);
    settings.disableChannelList = settings.disableChannelList.filter(c => c !== channel);
});

When('I check the mode for {string}', function (channel) {
    currentChannel = channel;
    actualMode = getPriorityMode(currentChannel, settings);
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
        }
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
    setPlaybackQualityRange: (q) => { lastQualitySet = q; },
    setPlaybackQuality: (q) => { lastQualitySet = q; }
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
        }
    };
    updateVideoQuality(true);
});

When('Listen Mode is being disabled', function () {
    // Mock document
    global.document = {
        querySelector: (sel) => {
            if (sel === '.html5-video-player') return mockPlayer;
            return null;
        }
    };
    updateVideoQuality(false);
});

Then('the video quality should be set to {string}', function (expectedQuality) {
    assert.strictEqual(lastQualitySet, expectedQuality);
});

Then('the video quality should be restored to {string}', function (expectedQuality) {
    assert.strictEqual(lastQualitySet, expectedQuality);
});
