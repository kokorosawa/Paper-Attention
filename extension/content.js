// Extract arXiv metadata from the current page and push updates to the background worker.
(function () {
  let pollMs = 5000;
  let lastSent = null;
  let debug = false;

  const getMetaContents = (name) => {
    const nodes = document.querySelectorAll(`meta[name="${name}"]`);
    if (!nodes.length) return [];
    return Array.from(nodes)
      .map((node) => (node.getAttribute("content") || "").trim())
      .filter(Boolean);
  };

  const parseArxivId = (href) => {
    const absMatch = href.match(/\/abs\/([^?#]+)/);
    if (absMatch) return absMatch[1];
    const pdfMatch = href.match(/\/pdf\/([^?#]+)\.pdf/);
    if (pdfMatch) return pdfMatch[1];
    return null;
  };

  const buildPayload = () => {
    const url = window.location.href;
    const id = parseArxivId(url);
    if (!id) return null;

    const title = getMetaContents("citation_title")[0] || document.title || "arXiv";
    const authors = getMetaContents("citation_author");
    const summaryMeta = getMetaContents("description")[0] || "";

    return {
      id,
      url,
      title,
      authors,
      summary: summaryMeta,
      pageType: url.includes("/pdf/") ? "pdf" : "abs",
      timestamp: Date.now(),
    };
  };

  const sendUpdate = () => {
    const payload = buildPayload();
    if (!payload) return;
    const key = JSON.stringify(payload);
    if (key === lastSent) return;
    lastSent = key;

    if (debug) console.log("[arxiv-presence] send", payload);
    try {
      chrome.runtime.sendMessage({ type: "presence-update", payload }, (resp) => {
        if (debug) console.log("[arxiv-presence] ack", resp);
        // Ignore errors; background handles connectivity.
      });
    } catch (err) {
      // Happens if extension context was invalidated (e.g., extension reloaded).
      if (debug) console.warn("[arxiv-presence] send failed", err);
      lastSent = null; // allow retry on next tick after user reloads extension/tab
    }
  };

  // Initial push and periodic polling; arXiv is static so polling is sufficient.
  const init = () => {
    if (debug) console.log("[arxiv-presence] content script loaded");
    sendUpdate();
    setInterval(sendUpdate, pollMs);
  };

  chrome.storage?.local?.get({ pollMs: 5000, debug: false }, (cfg) => {
    pollMs = Math.max(1000, Number(cfg.pollMs) || 5000);
    debug = !!cfg.debug;
    init();
  });
})();
