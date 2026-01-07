# Paper Attention

English | [繁體中文](README_zh.md)

Shows what you are reading on arXiv in Discord Rich Presence via a lightweight helper and browser extension.

Not affiliated with arXiv or Cornell; uses public arXiv pages only. Disclaimer: personal/educational use only; no endorsement by arXiv/Cornell; provide your own assets/icons and avoid third-party trademarks.

## What you need
- Chrome or Edge
- Discord desktop running
- Node.js 18+ (to run the helper)
- A Discord application client ID (Rich Presence)

## Install & run (GUI)
1) Install and launch the GUI helper
```bash
cd gui
npm install
npm start
```
- 在 the GUI, enter your Discord application client ID, then click **Start Helper**. Default endpoint stays `http://127.0.0.1:37425/presence` unless you change the port.
- Optional: upload your own large image asset in the Discord app (avoid arXiv marks) and set `Large Image Key` in the GUI.

2) Load the extension
- Chrome/Edge → Extensions → enable Developer Mode → Load unpacked → pick the `extension/` folder.
- Open any arXiv paper page; the GUI log should show incoming updates.

## Usage
- Keep Discord and the helper running.
- Visit an arXiv abstract/PDF page; presence updates automatically.
- Buttons: enabled by default; toggle in extension options if you prefer none.

## Configuration
- Change helper port: set `PORT` env and update `HELPER_ENDPOINT` in `extension/background.js`.
- Presence text/buttons: edit `helper/index.js` (`details`, `state`, `buttons`, `largeImageText`).
- Debug logs: toggle in extension options; set `DEBUG=1` for helper verbose logs.

## Troubleshooting
- No update? Check helper console for POST logs and ensure Discord is open.
- Asset missing? Either upload your own and set `LARGE_IMAGE_KEY`, or run without an image.
- Buttons not showing? Discord app must allow buttons and the URL must be valid.
