
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { getPriorityMode } = require('../../content.js');

let settings = {
    autoEnable: false,
    channelList: [],
    disableChannelList: []
};
let currentChannel = '';
let actualMode = '';

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
