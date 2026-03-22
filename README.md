# 🎧 YouTube Listen Mode Chrome Extension

A lightweight Chrome extension that turns watching Youtube video into **audio‑only mode**.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-141e24.svg?&style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/youtube-listen-mode/pbhfgfcljjildhfdglggpjnahaclpdcj)

---

## ✨ Features

<!-- markdownlint-disable MD033 -->
| Feature | Description |
| :--- | :--- |
| **One‑click toggle** | A headphones / video icon appears in the player bar to switch between normal video and audio‑only mode. |
| **Overlay when audio‑only** | A dark overlay with the extension icon and the text “Audio Only Mode” appears over the video area. |
| **Bandwidth Saver** | **[NEW]** Automatically switches video quality to the lowest setting (144p/tiny) when enabled, and restores your previous quality when disabled. |
| **Smart Channel Matching** | **[NEW]** Powerful filtering with substring and Regex support: <br /> • **Exact**: `Lofi Girl` <br /> • **Prefix**: `/^The/i` <br /> • **Suffix**: ` Topic` <br /> • **Advanced**: `/(Music|Records|VEVO)$/i` |
| **Auto-enable logic** | Intelligent priority-based handling: <br /> 1. **Global Always Enable** (Highest) <br /> 2. **Disable for Channels** (Overrides enable list) <br /> 3. **Enable for Channels** (Lowest) |
<!-- markdownlint-enable MD033 -->

## 📖 Documentation

Check out the following guides to learn more about developing and maintaining this project:

- **[Release Guide](docs/RELEASE.md)**: How to publish new versions to the Chrome Web Store.
- **[Store Description](docs/STORE_DESCRIPTION.txt)**: The current listing text.

## 📜 License

This project is open source and available under the **MIT License**.

---

*Built with ❤️ and 🤖.*
