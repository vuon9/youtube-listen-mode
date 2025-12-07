document.addEventListener('DOMContentLoaded', () => {
    const autoEnableCheckbox = document.getElementById('autoEnable');
    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListContainer = document.getElementById('channelList');

    // Load settings
    chrome.storage.local.get(['autoEnable', 'channelList'], (result) => {
        autoEnableCheckbox.checked = result.autoEnable || false;
        const channels = result.channelList || [];
        renderChannels(channels);
    });

    // Save autoEnable setting
    autoEnableCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ autoEnable: autoEnableCheckbox.checked });
    });

    // Add channel
    addChannelBtn.addEventListener('click', addChannel);
    channelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChannel();
    });

    function addChannel() {
        const name = channelInput.value.trim();
        if (!name) return;

        chrome.storage.local.get(['channelList'], (result) => {
            const channels = result.channelList || [];
            if (!channels.includes(name)) {
                channels.push(name);
                chrome.storage.local.set({ channelList: channels }, () => {
                    renderChannels(channels);
                    channelInput.value = '';
                });
            }
        });
    }

    // Remove channel
    function removeChannel(name) {
        chrome.storage.local.get(['channelList'], (result) => {
            let channels = result.channelList || [];
            channels = channels.filter(c => c !== name);
            chrome.storage.local.set({ channelList: channels }, () => {
                renderChannels(channels);
            });
        });
    }

    function renderChannels(channels) {
        channelListContainer.innerHTML = '';
        channels.forEach(name => {
            const tag = document.createElement('div');
            tag.className = 'tag';

            const text = document.createElement('span');
            text.textContent = name;
            tag.appendChild(text);

            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => removeChannel(name);
            tag.appendChild(removeBtn);

            channelListContainer.appendChild(tag);
        });
    }
});
