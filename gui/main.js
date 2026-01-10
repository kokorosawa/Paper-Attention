const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");

const FIXED_CONFIG = {
  clientId: "1456497729436913810",
  port: 37425,
  largeImageKey: "microscope",
  debug: true,
};

let mainWindow;
let helperProc = null;
let helperStatus = { running: false, lastMessage: "" };
let tray;
let quitting = false;
let debugEnabled = FIXED_CONFIG.debug;

const sendToRenderer = (channel, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.webContents?.isDestroyed()) return;
  try {
    mainWindow.webContents.send(channel, payload);
  } catch (err) {
    console.warn(`sendToRenderer failed for ${channel}`, err);
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 540,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
};

const getHelperPath = () => {
  const devPath = path.join(__dirname, "..", "helper", "index.js");
  if (fs.existsSync(devPath)) return devPath;
  // In production, helper is copied to resources/helper
  return path.join(process.resourcesPath || process.cwd(), "helper", "index.js");
};

const startHelper = () => {
  if (helperProc) return helperStatus;
  const helperPath = getHelperPath();
  const env = {
    ...process.env,
    DISCORD_CLIENT_ID: FIXED_CONFIG.clientId,
    PORT: String(FIXED_CONFIG.port),
    LARGE_IMAGE_KEY: FIXED_CONFIG.largeImageKey,
    DEBUG: debugEnabled ? "1" : "0",
    ELECTRON_RUN_AS_NODE: "1",
  };

  helperProc = fork(helperPath, [], { env, stdio: "pipe" });
  helperStatus = { running: true, lastMessage: "" };

  helperProc.on("exit", (code) => {
    helperProc = null;
    helperStatus = { running: false, lastMessage: "" };
    sendToRenderer("helper-status", helperStatus);
  });

  helperProc.stdout?.on("data", (buf) => {
    helperStatus.lastMessage = buf.toString().trim();
    sendToRenderer("helper-log", helperStatus.lastMessage);
  });
  helperProc.stderr?.on("data", (buf) => {
    helperStatus.lastMessage = buf.toString().trim();
    sendToRenderer("helper-log", helperStatus.lastMessage);
  });

  return helperStatus;
};

const getTrayIcon = () => {
  // 嘗試多個可能位置（開發模式 __dirname / 打包後 app 路徑 / resources）。
  const bases = [
    __dirname,
    app.getAppPath && app.getAppPath(),
    path.join(process.resourcesPath || "", "app"),
    process.resourcesPath || "",
  ];
  for (const base of bases) {
    if (!base) continue;
    const png = path.join(base, "build", "icon.png");
    const ico = path.join(base, "build", "icon.ico");
    if (fs.existsSync(png)) return nativeImage.createFromPath(png);
    if (fs.existsSync(ico)) return nativeImage.createFromPath(ico);
  }
  console.warn("Tray icon not found; tray may appear blank");
  return null;
};

const toggleWindow = () => {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
};

const createTray = () => {
  const icon = getTrayIcon();
  tray = new Tray(icon || nativeImage.createEmpty());
  const menu = Menu.buildFromTemplate([
    { label: "開啟視窗", click: () => toggleWindow() },
    { label: "啟動 Helper", click: () => startHelper() },
    { label: "停止 Helper", click: () => stopHelper() },
    { type: "separator" },
    {
      label: "結束",
      click: () => {
        quitting = true;
        stopHelper();
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Paper Attention Helper");
  tray.setContextMenu(menu);
  tray.on("click", () => toggleWindow());
};

const stopHelper = () => {
  if (!helperProc) return helperStatus;
  try {
    if (!helperProc.killed) helperProc.kill("SIGINT");
  } catch (err) {
    console.warn("stopHelper kill error", err);
  }
  helperProc = null;
  helperStatus = { running: false, lastMessage: "" };
  return helperStatus;
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  ipcMain.handle("helper:start", () => startHelper());

  ipcMain.handle("helper:stop", () => stopHelper());

  ipcMain.handle("autostart:get", () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle("autostart:set", (_evt, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled });
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle("debug:get", () => debugEnabled);

  ipcMain.handle("debug:set", (_evt, enabled) => {
    debugEnabled = !!enabled;
    return debugEnabled;
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    quitting = true;
    stopHelper();
    app.quit();
  }
});

app.on("before-quit", () => {
  quitting = true;
});
