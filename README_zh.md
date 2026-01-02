# ArXiv → Discord Rich Presence（中文指南）

本專案包含兩個部分：
- `extension/`：Chrome/Edge MV3 擴充功能，從 arXiv 頁面讀取論文資訊，並將資料透過 HTTP POST 發送給本機 helper。
- `helper/`：Node.js 本機服務，接收擴充功能傳來的資料，並透過 `discord-rpc` 更新 Discord Rich Presence。

## 快速開始
1) 啟動 helper
```bash
cd helper
npm install
DISCORD_CLIENT_ID=你的應用程式 ID npm start
```
- 請在你的 Discord 應用程式中新增一個名為 `arxiv` 的 large image asset。
- 預設 helper 端點：`http://127.0.0.1:37425/presence`。

2) 載入瀏覽器擴充
- 打開 Chrome/Edge → Extensions → 啟用「開發人員模式」。
- 選擇「Load unpacked」→ 指向 `extension/` 資料夾。
- 打開任一 arXiv 論文頁面，觀察 helper 終端輸出以確認有收到更新。

## 自訂設定
- 更改 helper 監聽埠：設定環境變數 `PORT`，並同步更新 `extension/background.js` 內的 `HELPER_ENDPOINT`。
- 自訂 Rich Presence 文字與按鈕：修改 `helper/index.js` 中的 `activity` 內容（`details`、`state`、`buttons`）。

## 資料夾重點
- `extension/content.js`：擷取頁面 metadata（標題、作者、arXiv ID），並發送訊息給背景程式。
- `extension/background.js`：接收訊息後去重，並 POST 到本機 helper。
- `helper/index.js`：接收 POST，呼叫 Discord RPC 更新 Rich Presence。

## 注意事項
- 確保 Discord 桌面版已開啟，且你使用的應用程式 ID 正確。
- 如果修改了 helper 埠或 URL，務必同步修改擴充的 `HELPER_ENDPOINT`。
- Discord Rich Presence 的按鈕功能需在應用程式設定中允許附帶 URL。
