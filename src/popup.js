document.addEventListener('DOMContentLoaded', () => {
  const autoEnableCheckbox = document.getElementById('autoEnable');
  const autoSwitch144pCheckbox = document.getElementById('autoSwitch144p');

  const channelInput = document.getElementById('channelInput');
  const addChannelBtn = document.getElementById('addChannelBtn');
  const channelListContainer = document.getElementById('channelList');

  const disableChannelInput = document.getElementById('disableChannelInput');
  const addDisableChannelBtn = document.getElementById('addDisableChannelBtn');
  const disableChannelListContainer = document.getElementById('disableChannelList');

  // Migrate old string-format channelList to { pattern, matchTitle } objects
  // Also merge any titleKeywordList entries into channelList
  function migrateOldData(result) {
    let needsSave = false;

    // Migrate channelList: strings → objects
    if (result.channelList?.length > 0 && typeof result.channelList[0] === 'string') {
      result.channelList = result.channelList.map((pattern) => ({
        pattern,
        matchTitle: true,
      }));
      needsSave = true;
    }

    // Merge titleKeywordList into channelList
    if (result.titleKeywordList?.length > 0) {
      const titleItems = result.titleKeywordList.map((pattern) => ({
        pattern,
        matchTitle: true,
      }));
      result.channelList = [...(result.channelList || []), ...titleItems];
      result.titleKeywordList = [];
      needsSave = true;
    }

    if (needsSave) {
      chrome.storage.local.set({
        channelList: result.channelList,
        titleKeywordList: [],
      });
    }
  }

  // Load settings
  chrome.storage.local.get(
    {
      autoEnable: false,
      channelList: [],
      disableChannelList: [],
      titleKeywordList: [],
      autoSwitch144p: false,
    },
    (result) => {
      migrateOldData(result);
      autoEnableCheckbox.checked = result.autoEnable;
      autoSwitch144pCheckbox.checked = result.autoSwitch144p;
      renderEnableList(result.channelList, channelListContainer);
      renderDisableList(result.disableChannelList, disableChannelListContainer);
    }
  );

  // Save autoEnable setting
  autoEnableCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ autoEnable: autoEnableCheckbox.checked });
  });

  // Save autoSwitch144p setting
  autoSwitch144pCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ autoSwitch144p: autoSwitch144pCheckbox.checked });
  });

  // Add channel events
  addChannelBtn.addEventListener('click', () => addEnableKeyword());
  channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addEnableKeyword();
  });
  channelInput.addEventListener('input', () => validateRegex(channelInput));

  addDisableChannelBtn.addEventListener('click', () =>
    addDisableChannel(disableChannelInput, 'disableChannelList', disableChannelListContainer)
  );
  disableChannelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter')
      addDisableChannel(disableChannelInput, 'disableChannelList', disableChannelListContainer);
  });
  disableChannelInput.addEventListener('input', () => validateRegex(disableChannelInput));

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

  // Add keyword to enable list (with matchTitle: true by default)
  function addEnableKeyword() {
    const pattern = channelInput.value.trim();
    if (!pattern) return;

    chrome.storage.local.get(['channelList'], (result) => {
      const channels = result.channelList || [];
      const exists = channels.some((c) => c.pattern.toLowerCase() === pattern.toLowerCase());
      if (exists) return;

      channels.push({ pattern, matchTitle: true });
      chrome.storage.local.set({ channelList: channels }, () => {
        renderEnableList(channels, channelListContainer);
        channelInput.value = '';
      });
    });
  }

  // Remove keyword from enable list
  function removeEnableKeyword(pattern) {
    chrome.storage.local.get(['channelList'], (result) => {
      const channels = (result.channelList || []).filter((c) => c.pattern !== pattern);
      chrome.storage.local.set({ channelList: channels }, () => {
        renderEnableList(channels, channelListContainer);
      });
    });
  }

  // Toggle matchTitle for a keyword
  function toggleMatchTitle(pattern) {
    chrome.storage.local.get(['channelList'], (result) => {
      const channels = result.channelList || [];
      const item = channels.find((c) => c.pattern === pattern);
      if (item) {
        item.matchTitle = !item.matchTitle;
        chrome.storage.local.set({ channelList: channels }, () => {
          renderEnableList(channels, channelListContainer);
        });
      }
    });
  }

  // Render enable list with per-tag matchTitle toggle
  function renderEnableList(channels, container) {
    container.innerHTML = '';
    for (const item of channels) {
      const tag = document.createElement('div');
      tag.className = `tag${item.matchTitle ? ' title-match' : ''}`;

      // matchTitle toggle button
      const toggleBtn = document.createElement('span');
      toggleBtn.className = `title-toggle${item.matchTitle ? ' active' : ''}`;
      toggleBtn.title = item.matchTitle
        ? 'Also matching video titles'
        : 'Only matching channel names';
      toggleBtn.textContent = 'T';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        toggleMatchTitle(item.pattern);
      };
      tag.appendChild(toggleBtn);

      const text = document.createElement('span');
      text.className = 'tag-text';
      text.textContent = item.pattern;
      tag.appendChild(text);

      // Remove button
      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeEnableKeyword(item.pattern);
      };
      tag.appendChild(removeBtn);

      container.appendChild(tag);
    }
  }

  // Add channel to disable list (stays as plain strings)
  function addDisableChannel(input, storageKey, container) {
    const name = input.value.trim();
    if (!name) return;

    chrome.storage.local.get([storageKey], (result) => {
      const channels = result[storageKey] || [];
      if (!channels.some((c) => c.toLowerCase() === name.toLowerCase())) {
        channels.push(name);
        chrome.storage.local.set({ [storageKey]: channels }, () => {
          renderDisableList(channels, container);
          input.value = '';
        });
      }
    });
  }

  function removeDisableChannel(name, storageKey, container) {
    chrome.storage.local.get([storageKey], (result) => {
      let channels = result[storageKey] || [];
      channels = channels.filter((c) => c !== name);
      chrome.storage.local.set({ [storageKey]: channels }, () => {
        renderDisableList(channels, container);
      });
    });
  }

  // Render disable list (plain string tags, no toggle)
  function renderDisableList(channels, container) {
    container.innerHTML = '';
    for (const name of channels) {
      const tag = document.createElement('div');
      tag.className = 'tag';

      const text = document.createElement('span');
      text.className = 'tag-text';
      text.textContent = name;
      tag.appendChild(text);

      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.onclick = () => removeDisableChannel(name, 'disableChannelList', container);
      tag.appendChild(removeBtn);

      container.appendChild(tag);
    }
  }
});
