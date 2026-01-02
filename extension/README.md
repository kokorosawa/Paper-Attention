# ArXiv Discord Presence (Chrome/Edge extension)

This MV3 extension harvests the current arXiv page (title, authors, id) and forwards it to a small local helper that talks to Discord Rich Presence. The background service worker POSTs to `http://127.0.0.1:37425/presence`, so keep the helper running.

## Load the extension
1. Build/prepare the helper (see `../helper/README.md`) and keep it running.
2. Chrome/Edge → Extensions → Enable Developer Mode.
3. "Load unpacked" → select the `extension` folder.
4. Open an arXiv page; check the helper console to confirm updates.

## Permissions
- `host_permissions`: `https://arxiv.org/*` to read metadata.
- `activeTab`, `scripting` to run the content script.

## How it works
- `content.js` polls the DOM every 5s, extracts `citation_title`, `citation_author`, and the arXiv ID (handles `/abs/` and `/pdf/`).
- Sends `presence-update` messages to `background.js`.
- `background.js` POSTs the payload to the helper if the hash changed.

## TODO / enhancements
- Add icons and a basic popup UI to show connection state.
- Debounce with `chrome.storage` to survive service worker restarts.
- Detect PDF title/metadata when meta tags are absent.
