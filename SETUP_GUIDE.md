  # Google Drive & Sheets Integration Setup Guide

Follow these steps to configure your project to use Google Sheets as a database and Google Drive for image storage.

## Prerequisites

-   A Google Cloud Project
-   Node.js installed
-   A Google account

---

## Step 1: Enable APIs in Google Cloud Console

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (or create a new one).
3.  In the search bar, type **"Google Sheets API"** and select it.
4.  Click **Enable**.
5.  In the search bar, type **"Google Drive API"** and select it.
6.  Click **Enable**.

## Step 2: Create Service Account & Credentials

1.  Go to **IAM & Admin** > **Service Accounts**.
2.  Click **Create Service Account**.
3.  Name it (e.g., `registration-admin`).
4.  Click **Create and Continue**.
5.  (Optional) Grant "Editor" role, but it's not strictly necessary if we share files directly. Click **Done**.
6.  Click on the newly created service account email (e.g., `registration-admin@your-project.iam.gserviceaccount.com`).
7.  Go to the **Keys** tab.
8.  Click **Add Key** > **Create new key**.
9.  Select **JSON** and click **Create**.
10. A JSON file will download. **Keep this safe!**

## Step 3: Configure Environment Variables

Open your `.env.local` file in the project root and add the following. Open the downloaded JSON file to find the values.

```env
GOOGLE_CLIENT_EMAIL="client_email_from_json"
GOOGLE_PRIVATE_KEY="private_key_from_json"
GOOGLE_SHEET_ID="your_google_sheet_id"
GOOGLE_DRIVE_FOLDER_ID="your_drive_folder_id"
ADMIN_PASSWORD="secure_password_here"
```

*Note: For `GOOGLE_PRIVATE_KEY`, copy the entire string including `-----BEGIN PRIVATE KEY-----` and `\n` characters.*

## Step 4: Setup Google Drive Folder

1.  Go to [Google Drive](https://drive.google.com/).
2.  Create a new folder (e.g., "Registration Images").
3.  Open the folder.
4.  **Copy the Folder ID** from the URL bar.
    -   URL format: `drive.google.com/drive/folders/12345abcde...`
    -   The ID is the `12345abcde...` part.
    -   Paste this as `GOOGLE_DRIVE_FOLDER_ID` in your `.env.local`.
5.  **Share the Folder**:
    -   Click the folder name > **Share**.
    -   Paste your **Service Account Email** (`GOOGLE_CLIENT_EMAIL`).
    -   Set permission to **Editor**.
    -   Click **Send** (uncheck "Notify people" if you want).

## Step 5: Setup Google Sheet

1.  Create a new Google Sheet (or use existing).
2.  **Copy the Sheet ID** from the URL bar.
    -   URL format: `docs.google.com/spreadsheets/d/12345xyz.../edit`
    -   The ID is the `12345xyz...` part.
    -   Paste this as `GOOGLE_SHEET_ID` in your `.env.local`.
3.  **Share the Sheet**:
    -   Click **Share** button.
    -   Paste your **Service Account Email**.
    -   Set permission to **Editor**.
    -   Click **Send**.
4.  **Create Tabs**:
    -   **Tab 1**: Rename to `Sheet1` (if not already). This stores users.
    -   **Tab 2**: Create a new tab and rename it to `Accommodations`.
    -   Add headers to `Accommodations` (Row 1):
        -   A: Id
        -   B: Title
        -   C: Description
        -   D: Price
        -   E: ImageUrl
        -   F: Slots
        -   G: CreatedAt
        -   H: FileId

## Step 6: Verify

1.  Restart your server: `npm run dev`.
2.  Go to `http://localhost:3000/admin`.
3.  Login with your `ADMIN_PASSWORD`.
4.  Try creating a new accommodation. It should appear in the list, the image should be in your Drive folder, and the data in your Sheet.

## Gmail App Password Setup

To send emails using your Gmail account, you need to generate an App Password.

1.  **Go to your Google Account**: [https://myaccount.google.com/](https://myaccount.google.com/)
2.  **Select Security**: On the left navigation panel.
3.  **Enable 2-Step Verification**: Under "Signing in to Google," make sure 2-Step Verification is turned on.
4.  **App Passwords**:
    - Under "Signing in to Google," select **App passwords**. (You may need to sign in again).
    - If you don't see this option search for "App passwords" in the search bar at the top.
5.  **Generate Password**:
    - Select **Mail** as the app and **Other (Custom name)** as the device.
    - Name it "GAC Registration".
    - Click **Generate**.
6.  **Copy the Password**: A 16-character password will appear. Copy it.
7.  **Update .env.local**:
    - Add/Update the following lines in your `.env.local` file:
    ```bash
    GMAIL_USER="your-email@gmail.com"
    GMAIL_APP_PASSWORD="your-16-char-password"
    NEXT_PUBLIC_BASE_URL="http://localhost:3000" # or your production URL
    ```
