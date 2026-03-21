# Release and Publishing Guide

This extension uses `release-please` for automated versioning and `chrome-webstore-upload-cli` for automated publishing to the Chrome Web Store via GitHub Actions.

## Prerequisites

To enable automated publishing, you must configure the following Secrets in your GitHub repository (**Settings > Secrets and variables > Actions**):

| Secret Name | Description |
| ----------- | ----------- |
| `EXTENSION_ID` | The unique ID of your extension in the Chrome Web Store. |
| `CLIENT_ID` | Google OAuth2 Client ID. |
| `CLIENT_SECRET` | Google OAuth2 Client Secret. |
| `REFRESH_TOKEN` | Google OAuth2 Refresh Token for the Chrome Web Store API. |

---

## Step-by-Step Setup

### 1. Get the `EXTENSION_ID`
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. If this is a new extension, perform an **Initial Upload** manually once to create the item.
3. Click on the extension and copy the **Item ID** from the dashboard or the URL.

### 2. Get `CLIENT_ID` and `CLIENT_SECRET`
1. Visit the [Google Cloud Console Credentials page](https://console.developers.google.com/apis/credentials).
2. **Create a Project:** Create a new project (e.g., "YouTube Listen Mode Uploader").
3. **OAuth Consent Screen:**
    - Go to the "OAuth consent screen" tab.
    - Select **External**.
    - Fill in the required fields (App name, User support email, Developer contact info).
    - **IMPORTANT (Test Users):** Since your app is not verified by Google, you **must** add your own email address to the **Test users** list. Otherwise, you will receive an "Access Blocked" error during the token generation step.
    - Reference: [StackOverflow: Access Blocked: Project has not completed the Google verification process](https://stackoverflow.com/questions/75454425/access-blocked-project-has-not-completed-the-google-verification-process)
4. **Create Credentials:**
    - Go to the **Credentials** tab.
    - Click **Create Credentials** > **OAuth client ID**.
    - Select **Desktop app**.
    - Name it (e.g., "GitHub Actions") and click **Create**.
5. Copy your **Client ID** and **Client Secret**.

### 3. Get the `REFRESH_TOKEN`
1. **Enable the API:** Go to the [Chrome Web Store API page](https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com) and click **Enable**.
2. **Generate Token:** Run the following command in your local terminal:
   ```bash
   npx chrome-webstore-upload-keys
   ```
3. Follow the prompts:
    - Enter your `CLIENT_ID` and `CLIENT_SECRET`.
    - Open the provided URL in your browser.
    - Log in with the Google account that owns the extension.
    - If you see a "Google hasn't verified this app" warning, click **Advanced** and then **Go to [App Name] (unsafe)** (this is why you added yourself to Test Users in Step 2.3).
    - Grant the requested permissions.
4. The CLI will output your **Refresh Token**.

---

## Automation Flow

1. **Commit Changes:** Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add new feature`, `fix: resolve bug`).
2. **Release PR:** `release-please` will automatically create/update a "Release PR" with a changelog and version bump.
3. **Merge PR:** When you merge the Release PR to `main`:
    - A new GitHub Release is created.
    - A new Git tag is pushed.
    - The `Release and Publish` workflow triggers, packages the extension, and uploads it to the Chrome Web Store.
