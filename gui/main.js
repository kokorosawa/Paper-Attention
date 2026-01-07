const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");
const Store = require("electron-store");

const store = new Store({
  name: "config",
  defaults: {
    clientId: "",
    port: 37425,
    largeImageKey: "brand-supergraphic",
    debug: false,
  },
});

let mainWindow;
let helperProc = null;
let helperStatus = { running: false, lastMessage: "" };

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 540,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
};

const getHelperPath = () => {
  const devPath = path.join(__dirname, "..", "helper", "index.js");
  if (fs.existsSync(devPath)) return devPath;
  // In production, helper is copied to resources/helper
  return path.join(process.resourcesPath || process.cwd(), "helper", "index.js");
};

const startHelper = (config) => {
  if (helperProc) return helperStatus;
  const helperPath = getHelperPath();
  const env = {
    ...process.env,
    DISCORD_CLIENT_ID: config.clientId,
    PORT: String(config.port),
    LARGE_IMAGE_KEY: config.largeImageKey,
    DEBUG: config.debug ? "1" : "0",
    ELECTRON_RUN_AS_NODE: "1",
  };

  helperProc = fork(helperPath, [], { env, stdio: "pipe" });
  helperStatus = { running: true, lastMessage: "Helper started" };

  helperProc.on("exit", (code) => {
    helperProc = null;
    helperStatus = { running: false, lastMessage: `Helper exited (${code})` };
    mainWindow?.webContents.send("helper-status", helperStatus);
  });

  helperProc.stdout?.on("data", (buf) => {
    helperStatus.lastMessage = buf.toString().trim();
    mainWindow?.webContents.send("helper-log", helperStatus.lastMessage);
  });
  helperProc.stderr?.on("data", (buf) => {
    helperStatus.lastMessage = buf.toString().trim();
    mainWindow?.webContents.send("helper-log", helperStatus.lastMessage);
  });

  return helperStatus;
};

const stopHelper = () => {
  if (helperProc) {
    helperProc.kill("SIGINT");
    helperProc = null;
    helperStatus = { running: false, lastMessage: "Helper stopped" };
  }
  return helperStatus;
};

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("config:get", () => store.store);
  ipcMain.handle("config:save", (_evt, cfg) => {
    store.set(cfg);
    return store.store;
  });

  ipcMain.handle("helper:start", () => {
    const cfg = store.store;
    if (!cfg.clientId) {
      dialog.showErrorBox("Missing Client ID", "Please set Discord Application ID first.");
      return helperStatus;
    }
    return startHelper(cfg);
  });

  ipcMain.handle("helper:stop", () => stopHelper());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopHelper();
  if (process.platform !== "darwin") app.quit();
});
