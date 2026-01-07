const $ = (id) => document.getElementById(id);

const load = async () => {
  const cfg = await window.api.getConfig();
  $("clientId").value = cfg.clientId || "";
  $("port").value = cfg.port || 37425;
  $("largeImageKey").value = cfg.largeImageKey || "brand-supergraphic";
  $("debug").checked = !!cfg.debug;
};

const save = async () => {
  const cfg = {
    clientId: $("clientId").value.trim(),
    port: Number($("port").value) || 37425,
    largeImageKey: $("largeImageKey").value.trim() || "brand-supergraphic",
    debug: $("debug").checked,
  };
  await window.api.saveConfig(cfg);
  return cfg;
};

$("startBtn").addEventListener("click", async () => {
  const cfg = await save();
  const status = await window.api.startHelper(cfg);
  renderStatus(status);
});

$("stopBtn").addEventListener("click", async () => {
  const status = await window.api.stopHelper();
  renderStatus(status);
});

window.api.onStatus((status) => {
  renderStatus(status);
});

window.api.onLog((msg) => {
  const log = $("log");
  log.textContent = `${msg}\n${log.textContent}`.slice(0, 4000);
});

$("clearLog").addEventListener("click", () => {
  $("log").textContent = "";
});

const renderStatus = (status) => {
  $("status").textContent = status.lastMessage || (status.running ? "running" : "stopped");
  const pill = $("statusPill");
  pill.textContent = status.running ? "ON" : "OFF";
  pill.classList.toggle("on", !!status.running);
  pill.classList.toggle("off", !status.running);
};

load();
