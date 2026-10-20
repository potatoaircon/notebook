# new — TOKYO 收藏頁新增檔案

本資料夾**只有新增檔案**，不包含、不覆蓋專案原本的 index.html、js/tsugaike-map.js 或其他頁面。

- `tokyo-section.html`：要插入原有 index.html（`</body>` 前、其他頁面容器之後）的 HTML 片段，**不是完整頁面**。
- `tokyo-food.css`：獨立樣式；Cursor 可放到 `css/tokyo-food.css`。
- `tokyo-food.js`：店家標記、分類、hover/點擊卡片、收藏狀態互動；Cursor 可放到 `js/tokyo-food.js`。
- `tokyo-food-data.js`：餐廳資料；Cursor 可放到 `data/tokyo-food.js`。

整合還需要 Cursor 在現有 `index.html` 增加 CSS/JS 載入、右上角 TOKYO 入口，並在**現有**月份切換控制中追加 `#tokyo-food` 路由。不能直接覆蓋現有檔案。

頁面不顯示「美食地圖」或 FOOD MAP，主標只有 TOKYO / 東京。地圖只保留不規則斜線色塊、區域名稱和店家標記；無道路、河流、旅行線、樹木或指南針。

初始只有 crisscross 和 BUTTER 兩筆鬆餅店，其他分類暫空。餐點圖片沒有可使用來源時維持 `image:null`，**請勿使用假照片**。

這是視覺性抽象區域圖，座標不是精確地理座標。
