const DEFAULTS = {
  endpoint: "http://127.0.0.1:37425/presence",
  debug: false,
  buttons: true,
};

let config = { ...DEFAULTS };
let lastHash = null;
let warnedHelperDown = false;
let lastPayload = null;

const hashPayload = (payload) => [payload.id, payload.pageType, payload.title].join("|");

const loadConfig = () =>
  new Promise((resolve) => {
    chrome.storage?.local?.get(DEFAULTS, (cfg) => {
      config = { ...DEFAULTS, ...(cfg || {}) };
      resolve(config);
    });
  });

const postToHelper = async (payload) => {
  const nextHash = hashPayload(payload);
  if (nextHash === lastHash) return;
  lastHash = nextHash;
  lastPayload = payload;
  chrome.storage?.local?.set({ lastPayload: payload });

  try {
    if (config.debug) console.log("[arxiv-presence] POST", payload);
    await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    warnedHelperDown = false;
  } catch (err) {
    console.warn("ArXiv Presence helper not reachable", err);
    if (!warnedHelperDown) {
      // Avoid spamming; warn only once per failure streak.
      warnedHelperDown = true;
    }
  }
};

const postWithRetry = async (payload) => {
  const maxRetries = 3;
  const baseDelay = 500;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      await postToHelper(payload);
      return;
    } catch (err) {
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "presence-update" && message.payload) {
    if (config.debug) console.log("[arxiv-presence] recv", message.payload);
    const enriched = { ...message.payload, buttons: config.buttons };
    postWithRetry(enriched);
    sendResponse({ ok: true });
    return true; // Keep the message channel alive for async work.
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("ArXiv Discord Presence extension installed.");
});

// Reload config when service worker starts, and resend last payload if available.
chrome.runtime.onStartup?.addListener(async () => {
  await loadConfig();
  chrome.storage?.local?.get({ lastPayload: null }, (cfg) => {
    if (cfg.lastPayload) {
      lastPayload = cfg.lastPayload;
      lastHash = null;
      postWithRetry(lastPayload);
    }
  });
});

// Also load config on import.
loadConfig();
