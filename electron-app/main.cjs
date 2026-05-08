// Verifact Desktop — Electron main process
// Runs in background with system tray + global hotkey to fact-check
// any text on your clipboard. Mimics Grammarly's "works everywhere" UX.
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  clipboard,
  Notification,
  shell,
  nativeImage,
  ipcMain,
} = require("electron");
const path = require("path");
const https = require("https");

const SUPABASE_URL = "https://xxaghjkwzgpdofsweegq.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YWdoamt3emdwZG9mc3dlZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDkzOTQsImV4cCI6MjA5MzY4NTM5NH0.wmyDXFtJ4kSbjoOnqKiEW90XtecivBA6AZecxknOC5w";
const APP_URL = "https://id-preview--6839d929-ffbc-47e0-ab4f-71a3bb4d117c.lovable.app";

let tray = null;
let popupWin = null;
let mainWin = null;

// Hide from dock on macOS — runs as menu-bar utility
if (process.platform === "darwin" && app.dock) app.dock.hide();

function createPopup() {
  if (popupWin && !popupWin.isDestroyed()) return popupWin;
  popupWin = new BrowserWindow({
    width: 420,
    height: 560,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  popupWin.loadFile(path.join(__dirname, "popup.html"));
  popupWin.on("blur", () => popupWin.hide());
  return popupWin;
}

function showPopupNear() {
  const win = createPopup();
  // Position near cursor / screen top-right
  const { screen } = require("electron");
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const x = display.workArea.x + display.workArea.width - 440;
  const y = display.workArea.y + 40;
  win.setPosition(x, y);
  win.show();
  win.focus();
}

function verifyText(text) {
  if (!text || text.trim().length < 10) {
    new Notification({
      title: "Verifact",
      body: "Select at least 10 characters of text first, then copy (Cmd/Ctrl+C) and run the shortcut.",
    }).show();
    return;
  }
  showPopupNear();
  const win = popupWin;
  const send = (channel, data) => {
    if (win && !win.isDestroyed()) win.webContents.send(channel, data);
  };
  // Wait for renderer ready
  const dispatch = () => {
    send("verifact:loading", { text });
    callApi(text)
      .then((data) => send("verifact:result", data))
      .catch((err) => send("verifact:error", String(err.message || err)));
  };
  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", dispatch);
  } else {
    dispatch();
  }
}

function callApi(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ text });
    const req = https.request(
      `${SUPABASE_URL}/functions/v1/verify-claims`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(buf);
            if (json.error) reject(new Error(json.error));
            else resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function verifyClipboard() {
  verifyText(clipboard.readText());
}

function verifySelection() {
  // Best-effort: simulate copy then read clipboard. This works when the
  // user has text highlighted in any app.
  const prev = clipboard.readText();
  // Send Cmd/Ctrl+C via a tiny shell trick is OS-dependent and unreliable
  // without native deps. So we fall back to: ask the user to copy first.
  // The hotkey behavior here = "verify whatever is on the clipboard".
  verifyText(clipboard.readText() || prev);
}

function buildTray() {
  // Tiny inline 16x16 green "V" icon as fallback
  const icon = nativeImage.createFromPath(path.join(__dirname, "icon.png"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Verifact — fact-check anywhere");
  const menu = Menu.buildFromTemplate([
    {
      label: "Verify clipboard text",
      accelerator: "CommandOrControl+Shift+V",
      click: verifyClipboard,
    },
    { type: "separator" },
    {
      label: "Open Verifact app",
      click: () => shell.openExternal(APP_URL),
    },
    {
      label: "Open dashboard",
      click: () => shell.openExternal(`${APP_URL}/dashboard`),
    },
    { type: "separator" },
    { label: "About Verifact", click: () => shell.openExternal(APP_URL) },
    { role: "quit", label: "Quit Verifact" },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", verifyClipboard);
}

app.whenReady().then(() => {
  buildTray();
  const ok = globalShortcut.register("CommandOrControl+Shift+V", verifySelection);
  if (!ok) {
    new Notification({
      title: "Verifact",
      body: "Could not register Cmd/Ctrl+Shift+V — another app may be using it.",
    }).show();
  }
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", (e) => e.preventDefault()); // stay alive in tray

ipcMain.on("verifact:close", () => popupWin && popupWin.hide());
ipcMain.on("verifact:open-dashboard", () =>
  shell.openExternal(`${APP_URL}/dashboard`),
);
