const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("verifact", {
  on: (channel, cb) =>
    ipcRenderer.on(channel, (_e, data) => cb(data)),
  close: () => ipcRenderer.send("verifact:close"),
  openDashboard: () => ipcRenderer.send("verifact:open-dashboard"),
});
