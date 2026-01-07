const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (cfg) => ipcRenderer.invoke("config:save", cfg),
  startHelper: () => ipcRenderer.invoke("helper:start"),
  stopHelper: () => ipcRenderer.invoke("helper:stop"),
  onStatus: (cb) => ipcRenderer.on("helper-status", (_e, status) => cb(status)),
  onLog: (cb) => ipcRenderer.on("helper-log", (_e, msg) => cb(msg)),
});
