# ArXiv → Discord Rich Presence

This project has two parts:
- `extension/`: Chrome/Edge MV3 extension that reads arXiv pages and POSTs metadata to a local helper.
- `helper/`: Node.js HTTP server that relays the metadata to Discord via `discord-rpc`.

## Quick start
1) Prepare the helper
```bash
cd helper
npm install
DISCORD_CLIENT_ID=your_app_id npm start
```
- Ensure your Discord app has a large image asset named `arxiv`.
- Default helper endpoint: `http://127.0.0.1:37425/presence`.

2) Load the extension
- Chrome/Edge → Extensions → Developer Mode → Load unpacked → choose `extension/`.
- Open an arXiv page; the helper console should log incoming updates.

## Customizing
- Change helper port: set `PORT` env var **and** update `HELPER_ENDPOINT` in `extension/background.js`.
- Presence contents are formatted in `helper/index.js` (`details`, `state`, `buttons`).

## Folder layout
- `extension/content.js`: scrapes page metadata (title, authors, arXiv ID) and notifies background.
- `extension/background.js`: posts deduped updates to the helper.
- `helper/index.js`: receives POSTs, sets Discord Rich Presence.
