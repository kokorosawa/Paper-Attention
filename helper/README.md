# Paper Attention helper

Bridges the browser extension and Discord Rich Presence. Runs a tiny HTTP server that accepts POSTs from the extension and updates Discord via `discord-rpc` (IPC transport).
Disclaimer: personal/educational use only; no endorsement by arXiv/Cornell; provide your own assets/icons and avoid third-party trademarks.

## Prerequisites
- Discord desktop client running.
- (Optional) A Discord application with a large image asset you own (avoid arXiv trademarks or official logos) and its client ID.
- Node.js 18+.

## Setup
```bash
cd helper
npm install
DISCORD_CLIENT_ID=your_app_id npm start
```
- The server listens on `http://127.0.0.1:37425/presence` by default (override with `PORT`).
- If you use a different client ID, update the env var or edit `CLIENT_ID` in `index.js`.

## Payload shape (from the extension)
```json
{
  "id": "2401.01234",
  "url": "https://arxiv.org/abs/2401.01234",
  "title": "Paper title",
  "authors": ["Alice", "Bob"],
  "summary": "(optional)",
  "pageType": "abs" | "pdf",
  "timestamp": 1700000000000
}
```

## Notes
- Buttons require the Discord application to allow attached URLs.
- The helper does not persist state; restarting the helper resets `last activity` until the next POST.
- If you change the port, update `HELPER_ENDPOINT` in `extension/background.js` too.
