
const assert = require('assert');

// Mock chrome storage
const storage = {
    local: {
        data: {},
        get: function(keys, callback) {
            const result = {};
            keys.forEach(key => result[key] = this.data[key]);
            callback(result);
        },
        set: function(data, callback) {
            Object.assign(this.data, data);
            if (callback) callback();
        }
    }
};

// Logic to test (extracted from content.js)
function getPriorityResult(channelName, settings) {
    const { autoEnable, channelList, disableChannelList } = settings;
    const lowerChannelName = channelName.toLowerCase();

    const isInDisableList = (disableChannelList || []).some(c => c.toLowerCase() === lowerChannelName);
    const isInEnableList = (channelList || []).some(c => c.toLowerCase() === lowerChannelName);

    if (autoEnable) {
        return 'ENABLED (Global)';
    } else if (isInDisableList) {
        return 'DISABLED (List)';
    } else if (isInEnableList) {
        return 'ENABLED (List)';
    } else {
        return 'DISABLED (Default)';
    }
}

// Test cases
const testCases = [
    {
        name: 'Global Enable takes precedence over Disable List',
        channel: 'ChannelA',
        settings: { autoEnable: true, disableChannelList: ['ChannelA'], channelList: [] },
        expected: 'ENABLED (Global)'
    },
    {
        name: 'Disable List takes precedence over Enable List',
        channel: 'ChannelB',
        settings: { autoEnable: false, disableChannelList: ['ChannelB'], channelList: ['ChannelB'] },
        expected: 'DISABLED (List)'
    },
    {
        name: 'Enable List works when not disabled',
        channel: 'ChannelC',
        settings: { autoEnable: false, disableChannelList: [], channelList: ['ChannelC'] },
        expected: 'ENABLED (List)'
    },
    {
        name: 'Case insensitivity for Disable List',
        channel: 'channeld',
        settings: { autoEnable: false, disableChannelList: ['ChannelD'], channelList: [] },
        expected: 'DISABLED (List)'
    },
    {
        name: 'Case insensitivity for Enable List',
        channel: 'CHANNELE',
        settings: { autoEnable: false, disableChannelList: [], channelList: ['channele'] },
        expected: 'ENABLED (List)'
    },
    {
        name: 'Default to disabled if no rules match',
        channel: 'ChannelF',
        settings: { autoEnable: false, disableChannelList: [], channelList: [] },
        expected: 'DISABLED (Default)'
    }
];

console.log('Starting Priority Logic Tests...');
testCases.forEach(tc => {
    const actual = getPriorityResult(tc.channel, tc.settings);
    try {
        assert.strictEqual(actual, tc.expected);
        console.log(`✅ PASS: ${tc.name}`);
    } catch (e) {
        console.error(`❌ FAIL: ${tc.name}`);
        console.error(`   Expected: ${tc.expected}`);
        console.error(`   Actual:   ${actual}`);
        process.exit(1);
    }
});

console.log('\nStarting Popup Duplicate Check Tests...');
function checkDuplicate(name, list) {
    return list.some(c => c.toLowerCase() === name.toLowerCase());
}

const dupTests = [
    { name: 'channel', list: ['Channel'], expected: true },
    { name: 'NEW', list: ['old', 'new'], expected: true },
    { name: 'Unique', list: ['Other'], expected: false }
];

dupTests.forEach(tc => {
    const actual = checkDuplicate(tc.name, tc.list);
    try {
        assert.strictEqual(actual, tc.expected);
        console.log(`✅ PASS: Duplicate check for "${tc.name}" in [${tc.list}]`);
    } catch (e) {
        console.error(`❌ FAIL: Duplicate check for "${tc.name}"`);
        process.exit(1);
    }
});

console.log('\nAll tests passed!');
