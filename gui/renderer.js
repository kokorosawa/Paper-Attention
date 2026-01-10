const $ = (id) => document.getElementById(id);

$("startBtn").addEventListener("click", async () => {
  const status = await window.api.startHelper();
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

const initAutostart = async () => {
  const enabled = await window.api.getAutostart();
  $("autostart").checked = !!enabled;
};

$("autostart").addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  await window.api.setAutostart(enabled);
});

const initDebug = async () => {
  const enabled = await window.api.getDebug();
  $("debugOpt").checked = !!enabled;
};

$("debugOpt").addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  await window.api.setDebug(enabled);
});

const renderStatus = (status) => {
  $("status").textContent = status.lastMessage || (status.running ? "running" : "stopped");
  const pill = $("statusPill");
  pill.textContent = status.running ? "ON" : "OFF";
  pill.classList.toggle("on", !!status.running);
  pill.classList.toggle("off", !status.running);
};
renderStatus({ running: false, lastMessage: "Idle" });
initAutostart();
initDebug();
