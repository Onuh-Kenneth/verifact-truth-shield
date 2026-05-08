# Verifact Desktop

Fact-check anything, anywhere on your computer — like Grammarly, but for truth.

## Install

### Option A — One-click run (requires Node.js 18+)
1. Unzip this folder.
2. Open a terminal in the folder.
3. Run:
   ```
   npm install
   npm start
   ```
4. Look for the green ✓ in your menu bar / system tray.

### Option B — Build a native installer
After `npm install`, you can package a `.dmg` (macOS), `.exe` (Windows) or
`.AppImage` (Linux) with [electron-packager](https://github.com/electron/packager) or
[electron-builder](https://www.electron.build/).

## How to use

1. Highlight any text in **any app** — Word, Preview, Chrome, your PDF reader,
   Apple Notes, Slack, anywhere.
2. Copy it: **⌘C** (macOS) or **Ctrl+C** (Windows/Linux).
3. Press the global hotkey: **⌘⇧V** (macOS) or **Ctrl+Shift+V** (Windows/Linux).
4. A Verifact panel pops up in the corner with the credibility score, claim
   verdicts and evidence.

You can also:
- Click the **green ✓ tray icon** to verify whatever's on your clipboard.
- Right-click the tray icon for the menu (open dashboard, quit).

Verifact runs silently in the background — no Dock icon on macOS, no taskbar
clutter on Windows. Quit any time from the tray menu.

## Privacy

Text you verify is sent to the Verifact AI service for analysis. Your
verification history is saved to your Verifact account if you're signed in
on the web app.
