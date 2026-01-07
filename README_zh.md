# Paper Attention（中文指南）

[English](README.md) | 繁體中文

讓 Discord Rich Presence 顯示你正在看的 arXiv 論文，透過瀏覽器擴充與本機 helper 完成。

本專案與 arXiv / Cornell 無關，僅透過公開的 arXiv 網頁資訊運作。免責聲明：僅供個人／教育用途，與 arXiv / Cornell 無從屬或背書關係；請自備圖示與素材，避免使用第三方商標。

## 需要準備
- Chrome 或 Edge
- 已開啟的 Discord 桌面版
- Node.js 18+（啟動 helper 用）
- 一組 Discord 應用程式 Client ID（Rich Presence）

## 安裝與啟動（使用 GUI）
1) 安裝並啟動 GUI helper
```bash
cd gui
npm install
npm start
```
- 在介面輸入 Discord 應用程式 Client ID，按 **Start Helper**。預設端點為 `http://127.0.0.1:37425/presence`，如改埠請同步調整。
- （選用）在 Discord 應用程式上傳自有 large image asset（避免 arXiv 商標），並在 GUI 填入 `Large Image Key`。

2) 載入瀏覽器擴充
- Chrome/Edge → Extensions → 開啟「開發人員模式」。
- 點「Load unpacked」→ 指向 `extension/` 資料夾。
- 打開任一 arXiv 論文頁面，GUI log 應可看到收到的更新。

## 使用方式
- 保持 Discord 與 helper 執行中。
- 造訪 arXiv 摘要或 PDF 頁面，Rich Presence 會自動更新。
- 按鈕預設開啟，如不需要可在擴充選項中關閉。

## 設定項目
- 更改 helper 埠：設定 `PORT`，並同步修改 `extension/background.js` 內的 `HELPER_ENDPOINT`。
- 調整顯示文字／按鈕：編輯 `helper/index.js` 的 `details`、`state`、`buttons`、`largeImageText`。
- 除錯訊息：在擴充選項開啟 debug；helper 可設 `DEBUG=1` 顯示詳細日誌。

## 常見問題
- 沒有更新？確認 helper 終端有 POST 紀錄，且 Discord 已開啟。
- 圖示顯示不到？需自行上傳圖片並設定 `LARGE_IMAGE_KEY`，或直接不帶大圖運行。
- 按鈕沒出現？確認 Discord 應用程式允許按鈕，且 URL 合法。
