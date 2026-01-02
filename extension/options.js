const DEFAULTS = {
  endpoint: "http://127.0.0.1:37425/presence",
  pollMs: 5000,
  buttons: true,
  debug: false,
};

const $ = (id) => document.getElementById(id);

const load = () => {
  chrome.storage.local.get(DEFAULTS, (cfg) => {
    $("endpoint").value = cfg.endpoint || DEFAULTS.endpoint;
    $("poll").value = cfg.pollMs || DEFAULTS.pollMs;
    $("buttons").checked = cfg.buttons ?? DEFAULTS.buttons;
    $("debug").checked = cfg.debug ?? DEFAULTS.debug;
  });
};

const save = () => {
  const cfg = {
    endpoint: $("endpoint").value.trim() || DEFAULTS.endpoint,
    pollMs: Math.max(1000, Number($("poll").value) || DEFAULTS.pollMs),
    buttons: $("buttons").checked,
    debug: $("debug").checked,
  };
  chrome.storage.local.set(cfg, () => {
    $("status").textContent = "Saved";
    setTimeout(() => ($("status").textContent = ""), 1200);
  });
};

$("save").addEventListener("click", save);
document.addEventListener("DOMContentLoaded", load);
