document.addEventListener('DOMContentLoaded', () => {
    const autoEnableCheckbox = document.getElementById('autoEnable');

    // Auto-enable list elements
    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListContainer = document.getElementById('channelList');

    // Auto-disable list elements
    const disableChannelInput = document.getElementById('disableChannelInput');
    const addDisableChannelBtn = document.getElementById('addDisableChannelBtn');
    const disableChannelListContainer = document.getElementById('disableChannelList');

    // Load settings
    chrome.storage.local.get(['autoEnable', 'channelList', 'disableChannelList'], (result) => {
        autoEnableCheckbox.checked = result.autoEnable || false;
        renderChannels(result.channelList || [], channelListContainer, 'channelList');
        renderChannels(result.disableChannelList || [], disableChannelListContainer, 'disableChannelList');
    });

    // Save autoEnable setting
    autoEnableCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ autoEnable: autoEnableCheckbox.checked });
    });

    // Add channel events
    addChannelBtn.addEventListener('click', () => addChannel(channelInput, 'channelList', channelListContainer));
    channelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChannel(channelInput, 'channelList', channelListContainer);
    });

    addDisableChannelBtn.addEventListener('click', () => addChannel(disableChannelInput, 'disableChannelList', disableChannelListContainer));
    disableChannelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChannel(disableChannelInput, 'disableChannelList', disableChannelListContainer);
    });

    function addChannel(input, storageKey, container) {
        const name = input.value.trim();
        if (!name) return;

        chrome.storage.local.get([storageKey], (result) => {
            const channels = result[storageKey] || [];
            if (!channels.includes(name)) {
                channels.push(name);
                chrome.storage.local.set({ [storageKey]: channels }, () => {
                    renderChannels(channels, container, storageKey);
                    input.value = '';
                });
            }
        });
    }

    function removeChannel(name, storageKey, container) {
        chrome.storage.local.get([storageKey], (result) => {
            let channels = result[storageKey] || [];
            channels = channels.filter(c => c !== name);
            chrome.storage.local.set({ [storageKey]: channels }, () => {
                renderChannels(channels, container, storageKey);
            });
        });
    }

    function renderChannels(channels, container, storageKey) {
        container.innerHTML = '';
        channels.forEach(name => {
            const tag = document.createElement('div');
            tag.className = 'tag';

            const text = document.createElement('span');
            text.textContent = name;
            tag.appendChild(text);

            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => removeChannel(name, storageKey, container);
            tag.appendChild(removeBtn);

            container.appendChild(tag);
        });
    }
});
