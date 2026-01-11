const http = require("http");
const { Client, ActivityType } = require("@nyabsi/minimal-discord-rpc");

const PORT = parseInt(process.env.PORT || "37425", 10);
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1456497729436913810";
const LARGE_IMAGE_KEY = process.env.LARGE_IMAGE_KEY || "microscope";
const DEBUG = process.env.DEBUG === "1";

if (!CLIENT_ID || CLIENT_ID === "your_discord_client_id") {
  console.warn("Set DISCORD_CLIENT_ID to your Discord application's client ID.");
}

const rpc = new Client({ clientId: CLIENT_ID });
let rpcReady = false;

rpc.on("ready", () => {
  rpcReady = true;
  console.log("Discord RPC ready as", CLIENT_ID);
});

rpc.on("close", (reason) => {
  rpcReady = false;
  console.warn("Discord RPC closed", reason);
});

rpc.login().catch((err) => {
  console.error("Failed to login to Discord RPC", err);
  process.exit(1);
});

const setPresence = (payload) => {
  if (!rpcReady) return;
  const details = (payload.title || "Reading a paper").slice(0, 120);
  const authors = Array.isArray(payload.authors) ? payload.authors : [];
  const shownAuthors = authors.slice(0, 2);
  const extra = authors.length > 2 ? ` +${authors.length - 2}` : "";
  const state = shownAuthors.length ? `${shownAuthors.join(", ")}${extra}` : payload.id || "Paper";
  const startTimestamp = payload.timestamp && Number.isFinite(Number(payload.timestamp))
    ? Number(payload.timestamp)
    : Date.now();

  const activity = {
    type: ActivityType.Watching,
    details,
    state,
    timestamps: { start: startTimestamp },
    assets: {
      large_image: LARGE_IMAGE_KEY,
      large_text: "Paper Attention",
    },
    instance: true,
  };

  if (payload.url && payload.buttons !== false) {
    activity.buttons = [
      {
        label: "View paper",
        url: payload.url,
      },
    ];
  }

  if (DEBUG) console.log("[helper] setActivity", { details: activity.details, state: activity.state, url: payload.url, buttons: activity.buttons });

  const trySet = async () => {
    try {
      await rpc.setActivity(activity);
    } catch (err) {
      console.error("Failed to set activity", err);
      // Retry without large image if asset is missing.
      try {
        const fallback = { ...activity };
        delete fallback.assets;
        await rpc.setActivity(fallback);
      } catch (err2) {
        console.error("Failed to set activity without image", err2);
      }
    }
  };

  trySet();
};

const validatePayload = (raw) => {
  const payload = typeof raw === "object" && raw ? raw : {};
  const id = typeof payload.id === "string" ? payload.id.slice(0, 64) : null;
  const title = typeof payload.title === "string" ? payload.title.slice(0, 180) : null;
  const url = typeof payload.url === "string" ? payload.url : null;
  const authors = Array.isArray(payload.authors)
    ? payload.authors.filter((a) => typeof a === "string").slice(0, 10)
    : [];
  const timestamp = payload.timestamp && Number.isFinite(Number(payload.timestamp)) ? Number(payload.timestamp) : Date.now();
  const buttons = payload.buttons === false ? false : true;
  return { id, title, url, authors, timestamp, buttons };
};

const readBody = (req, limit = 1_000_000) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error("Body too large"));
        req.connection.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const server = http.createServer(async (req, res) => {
  // Basic CORS for the extension
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, rpcReady }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/presence") {
    res.statusCode = 404;
    res.end("not found");
    return;
  }

  try {
    const raw = await readBody(req);
    const payload = validatePayload(JSON.parse(raw || "{}"));
    if (DEBUG) console.log("[helper] POST /presence", payload);
    setPresence(payload);
    res.statusCode = rpcReady ? 200 : 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: rpcReady }));
  } catch (err) {
    console.error("Error handling request", err);
    res.statusCode = 400;
    res.end("bad request");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Presence helper listening on http://127.0.0.1:${PORT}`);
  console.log("Ensure Discord is running and the extension is loaded.");
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
