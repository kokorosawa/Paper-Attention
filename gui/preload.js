const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  startHelper: () => ipcRenderer.invoke("helper:start"),
  stopHelper: () => ipcRenderer.invoke("helper:stop"),
  getAutostart: () => ipcRenderer.invoke("autostart:get"),
  setAutostart: (enabled) => ipcRenderer.invoke("autostart:set", enabled),
  getDebug: () => ipcRenderer.invoke("debug:get"),
  setDebug: (enabled) => ipcRenderer.invoke("debug:set", enabled),
  onStatus: (cb) => ipcRenderer.on("helper-status", (_e, status) => cb(status)),
  onLog: (cb) => ipcRenderer.on("helper-log", (_e, msg) => cb(msg)),
});
