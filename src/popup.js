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

  // Title keyword elements
  const titleKeywordInput = document.getElementById('titleKeywordInput');
  const addTitleKeywordBtn = document.getElementById('addTitleKeywordBtn');
  const titleKeywordListContainer = document.getElementById('titleKeywordList');

  // Load settings
  chrome.storage.local.get(
    {
      autoEnable: false,
      channelList: [],
      disableChannelList: [],
      titleKeywordList: [],
    },
    (result) => {
      autoEnableCheckbox.checked = result.autoEnable;
      renderChannels(result.channelList, channelListContainer, 'channelList');
      renderChannels(result.disableChannelList, disableChannelListContainer, 'disableChannelList');
      renderChannels(result.titleKeywordList, titleKeywordListContainer, 'titleKeywordList');
    }
  );

  // Save autoEnable setting
  autoEnableCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ autoEnable: autoEnableCheckbox.checked });
  });

  // Add channel events
  addChannelBtn.addEventListener('click', () =>
    addChannel(channelInput, 'channelList', channelListContainer)
  );
  channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addChannel(channelInput, 'channelList', channelListContainer);
  });
  channelInput.addEventListener('input', () => validateRegex(channelInput));

  addDisableChannelBtn.addEventListener('click', () =>
    addChannel(disableChannelInput, 'disableChannelList', disableChannelListContainer)
  );
  disableChannelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter')
      addChannel(disableChannelInput, 'disableChannelList', disableChannelListContainer);
  });
  disableChannelInput.addEventListener('input', () => validateRegex(disableChannelInput));

  // Title keyword events
  addTitleKeywordBtn.addEventListener('click', () =>
    addChannel(titleKeywordInput, 'titleKeywordList', titleKeywordListContainer)
  );
  titleKeywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter')
      addChannel(titleKeywordInput, 'titleKeywordList', titleKeywordListContainer);
  });
  titleKeywordInput.addEventListener('input', () => validateRegex(titleKeywordInput));

  function validateRegex(input) {
    const val = input.value.trim();
    input.classList.remove('regex-valid', 'regex-invalid');

    if (val.startsWith('/') && val.lastIndexOf('/') > 0) {
      const lastSlash = val.lastIndexOf('/');
      const regexStr = val.slice(1, lastSlash);
      const flags = val.slice(lastSlash + 1);
      try {
        new RegExp(regexStr, flags || 'i');
        input.classList.add('regex-valid');
      } catch (e) {
        input.classList.add('regex-invalid');
      }
    }
  }

  function addChannel(input, storageKey, container) {
    const name = input.value.trim();
    if (!name) return;

    chrome.storage.local.get([storageKey], (result) => {
      const channels = result[storageKey] || [];
      if (!channels.some((c) => c.toLowerCase() === name.toLowerCase())) {
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
      channels = channels.filter((c) => c !== name);
      chrome.storage.local.set({ [storageKey]: channels }, () => {
        renderChannels(channels, container, storageKey);
      });
    });
  }

  function renderChannels(channels, container, storageKey) {
    container.innerHTML = '';
    channels.forEach((name) => {
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
