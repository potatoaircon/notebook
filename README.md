# Tokyo Travel Map｜東京出發旅行地圖

為 Cursor / GitHub Pages 準備的純靜態網站（HTML + CSS + JavaScript + inline SVG）。

## 快速開始

1. Cursor 使用 **Open Folder** 打開本資料夾。
2. 先開啟 `index.html`。建議 Cursor 裝 **Live Server** 並用本機伺服器預覽。也可使用 `python3 -m http.server 8000`，再開 `http://localhost:8000`。
3. 將本資料夾內所有檔案推送至 GitHub repository **根目錄**。
4. GitHub → **Settings → Pages → Build and deployment → Deploy from a branch**，選 `main`、`/(root)`，Save。
5. 網站將以 `https://USERNAME.github.io/REPO/` 開啟；本專案使用相對路徑，適用專案子路徑。

## 專案檔案

- `index.html`：網站的 HTML 與可操作的 **inline SVG** 地圖。
- `css/style.css`：色票、地圖、斜線填色、Hover、動畫、RWD、飯店卡片。
- `js/app.js`：滑鼠 Hover、點擊、行動裝置選取、詳細頁、返回邏輯。
- `data/places.js`：**手動資料檔**，目的地／交通／兩間斑尾飯店與房型價格；不需任何 API。
- `assets/svg/map.svg`：額外存放的**地圖 SVG 可編輯素材副本**。目前頁面使用 `index.html` 的 inline SVG 才能逐一綁定事件和做路線 CSS 動畫；修改地圖時請以 inline SVG 為準，或讓 Cursor 完成同步。
- `assets/reference/`：使用者提供的參考截圖、住宿卡片視覺參考圖；**不是網頁必要依賴**。

## 行為要求（交接 Cursor）

- 首頁直接顯示地圖，只有 **白馬／斑尾／越後中里** 三處有地名。東京為出發點；其餘斜線色塊僅裝飾。位置為**示意相對方位**，非精準 GIS 地圖。
- 未選取時，三條路線均顯示淡灰色靜態虛線。桌機 Hover 目的地，路線變流動紅色虛線，浮出交通提示；點擊進詳情。
- 手機點擊地點 → 顯示簡短交通卡 → 按箭頭進詳情。
- 詳情頁才顯示交通及飯店卡片，各房型獨立。返回地圖。
- 資料在 `data/places.js` 手動編輯；白馬及越後中里目前無飯店資料。**沒有登入後台、線上跨裝置同步、訂房即時價格、即時車次功能**。
- 若日後要真的從後台填資料、跨裝置同步，再串 Supabase 或其他後端；GitHub Pages 自身僅提供靜態託管。

## 色票

| 用途 | Hex |
|---|---|
| Paper 背景 | `#F5F1E9` |
| Ink 深字色 | `#272C28` |
| Muted Coral | `#D47768` |
| Dark Coral | `#BC574A` |
| Sage | `#94A28A` |
| Stroke | `#D6CEC1` |

## 已知限制

- 交通時間僅為估算，班次／季節巴士／轉車等待以出發日期查詢為準。
- 價格及剩餘房數為使用者手動提供的紀錄；不保證持續有效。日期目前未標示年份。
- 字體透過 Google Fonts 載入，離線使用將由系統字體替代。
- 此專案無 build step、無 npm dependency。
