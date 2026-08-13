# DineLink 約飯 Web App MVP：產品需求規格

**版本：** 0.1 MVP  
**產品型態：** 手機優先的男女約飯／聚餐社交 Web App  
**目標架構：** Next.js App Router、PostgreSQL、Drizzle ORM、Google Maps

## 1. 產品定位

DineLink 將「約飯」從模糊的私訊邀約，轉化為具備時間、地點、預算、買單方式與出席承諾的公開小型飯局。MVP 的成功不以大量滑動或無止盡配對為目標，而以**可被理解的飯局規則、可控的主辦人審核與可追溯的信用流程**，降低陌生社交的決策成本與爽約風險。

> 「下一餐，不只是吃飯。」DineLink 的最小可行承諾，是協助使用者在清楚條件與相互同意下，完成一場安心、準時、有互動品質的聚餐。

| 項目 | MVP 定義 |
| --- | --- |
| 主要使用者 | 想認識新朋友、但重視安全與約定感的都會成人。 |
| 核心行為 | 發起飯局、探索飯局、申請加入、主辦人審核、確認後聊天、完成出席。 |
| 主要價值 | 用結構化飯局資訊取代猜測；用保證金、互評與通知提高履約率。 |
| 非目標 | 無限配對、公開交友牆、影音直播、匿名私訊，以及未驗證的金流代收。 |

## 2. MVP 功能需求

| 模組 | 使用者需求 | MVP 行為與驗收標準 |
| --- | --- | --- |
| 註冊與個人檔案 | 我想知道互動對象具備基本可辨識資料。 | 使用第三方登入或手機驗證建立帳號；個人檔案包含顯示名稱、頭像、性別、自介與驗證狀態。 |
| 飯局探索 | 我想快速找到時間、地點與預算合適的飯局。 | 以列表卡片顯示主題、時間、餐廳、人數、買單方式與預算；可切換地圖並點選標記開啟飯局詳情。 |
| 發起飯局 | 我想明確設定這頓飯的期待。 | 必填主題、時間、地點／餐廳、買單方式、預算與人數上限；地點欄位採 Places autocomplete，並保存 `placeId`、地址與座標。 |
| 報名與審核 | 我想在加入前表達動機，也讓主辦人掌握成員品質。 | 申請者填寫簡短介紹；主辦人可接受或拒絕；狀態必須由 `pending` 即時轉為 `approved` 或 `rejected`。 |
| 已確認聊天室 | 我只想與已確認赴約者溝通。 | 僅主辦人及 `confirmed` 出席者可讀寫群組文字訊息；未核准者請求聊天資料時回傳禁止存取。 |
| 評價與信用 | 我想在不公開羞辱人的前提下，累積可信任訊號。 | 飯局完成後，已出席成員只能對同場成員各留一次匿名互評；維度為準時、禮貌、趣味。產品不得以假資料或假評價填充介面。 |
| 防放鴿子 | 我希望參加者對承諾負責。 | 報名時凍結點數保證金；拒絕與合規取消時退還；登記爽約時沒收並依規則降低信用。每個動作都需留下不可變動帳本紀錄。 |
| 通知 | 我不想錯過審核結果或飯局時間。 | 申請、核准、拒絕、取消、爽約與新訊息建立站內通知；飯局開始前兩小時向已確認成員建立提醒通知。 |

## 3. 主要使用流程

使用者在探索頁以飯局卡片或地圖標記開啟詳情；閱讀主辦人、時間、地點、買單方式、名額與保證金說明後送出申請。申請送出後，系統凍結保證點數且通知主辦人。主辦人接受時，申請者會成為已確認成員並獲得聊天室權限；拒絕時，系統以帳本方式釋放點數。飯局結束後，出席者可互相評估準時、禮貌與趣味，並由受控服務更新信用摘要。

詳細交易順序、授權規則與冪等性要求見 [`MVP_DATA_FLOWS.md`](./MVP_DATA_FLOWS.md)。

## 4. 商業模式設計

MVP 應先驗證「有保證金的高履約飯局」是否提升完成率，再逐步擴大付費機制。商業化不得干擾安全規則：購買點數不應繞過身份驗證、審核與防爽約流程。

| 模式 | MVP／後續階段 | 使用者價值 | 收益或成本控制 |
| --- | --- | --- | --- |
| 點數錢包 | MVP 資料模型預備 | 用於保證金、取消與履約獎勵。 | 點數加值形成交易入口；所有變動記錄於帳本。 |
| 保證金 | MVP | 降低臨時失約的外部性。 | 爽約沒收可投入客服、信任與獎勵機制；規則須透明可申訴。 |
| Plus 訂閱 | Beta | 優先曝光、進階篩選、可視化飯局偏好。 | 月／季訂閱，但不得販售信用分數或審核豁免。 |
| 特約餐廳 | Beta | 提供可預期的餐廳與套餐選擇。 | 導流／預訂分潤；推薦需明確標示合作關係。 |
| 主題飯局置頂 | Launch | 協助主辦人提升合適受眾的觸及。 | 需保留廣告標示、頻次限制與風險審查。 |

## 5. 技術架構建議

正式產品建議以 Next.js App Router 作為全端 Web 基礎。其檔案式 `app` 結構將頁面、根 layout 與路由邊界清楚區隔，適合將公開探索頁、登入後飯局流程與受保護的 API 路由分層管理。[1] PostgreSQL 搭配 Drizzle ORM 可使用 `node-postgres` 或 `postgres.js` 驅動，並以型別化 schema 與 migration 管理關聯資料。[2]

| 層級 | 建議技術 | 職責 |
| --- | --- | --- |
| 前端 | Next.js App Router + TypeScript + Tailwind CSS + Lucide React | 手機優先畫面、Server Components 讀取、Client Components 處理表單與地圖互動。 |
| 身份與授權 | Auth.js、Clerk 或同等 OAuth／手機驗證服務 | 建立 `authSubject`，在每個寫入端點驗證當前使用者與資源擁有權。 |
| API | Server Actions 或 Route Handlers | 對飯局、申請、聊天與評價執行輸入驗證、授權與 transaction。 |
| 資料層 | PostgreSQL + Drizzle ORM | 保存規範化關聯資料、唯一索引、帳本與通知。 |
| 地圖 | Google Maps JavaScript API + Places | 地圖標記、地點選擇及地址預測。Places Autocomplete 可在輸入期間提供地點預測；正式實作應限制回傳欄位以控制資料取用與成本。[3] |
| 儲存與通知 | 物件儲存服務 + 受管背景工作 | 儲存已授權的大頭照；執行兩小時提醒與可重試的通知任務。 |
| 可觀測性 | 錯誤追蹤、結構化日誌與稽核事件 | 追蹤審核、保證金、爽約與檢舉事件，便於客服處理。 |

### 5.1 Next.js 目標目錄

```text
app/
  (public)/explore/page.tsx
  (app)/events/new/page.tsx
  (app)/events/[eventId]/page.tsx
  (app)/events/[eventId]/chat/page.tsx
  (app)/profile/page.tsx
  api/events/[eventId]/applications/route.ts
  api/scheduled/event-reminder/route.ts
components/dining/
lib/auth.ts
lib/db.ts
lib/permissions.ts
lib/points-ledger.ts
drizzle/schema.ts
```

目標 PostgreSQL Schema 已提交於 [`architecture/next-postgres/drizzle/schema.ts`](../architecture/next-postgres/drizzle/schema.ts)，關係圖見 [`DineLink_ERD.mmd`](./DineLink_ERD.mmd)。

## 6. 信任、安全與隱私基線

| 風險 | MVP 控制措施 |
| --- | --- |
| 冒用與詐騙 | 驗證狀態、清楚的檢舉入口、聊天室敏感交易警語與管理員稽核紀錄。 |
| 未核准存取 | 聊天、成員名單、審核與出席狀態均在服務端依所有權或 attendance 驗證。 |
| 點數爭議 | 凍結、釋放、沒收均以不可變動帳本處理；不允許前端直接改餘額。 |
| 爽約申訴 | 爽約狀態需保存原因、操作者與時間，並設計人工覆核入口。 |
| 個資處理 | 最小化公開欄位；將精確地址與聯絡資訊依權限、時間與必要性揭露。 |

## 7. 0-to-1 Roadmap

| 階段 | 目標 | 主要產出 | 完成判準 |
| --- | --- | --- | --- |
| 0. 原型驗證 | 確認操作語言與飯局資訊密度。 | 手機優先互動原型、訪談腳本、可用性測試。 | 使用者能不協助完成探索、開詳情與送出申請。 |
| 1. MVP Core | 驗證是否能完成可信任飯局。 | 登入、個人檔案、飯局 CRUD、申請審核、文字聊天室、站內通知。 | 可形成一次端到端的發起、核准、聊天、完成閉環。 |
| 2. Trust Beta | 驗證履約與爭議處理。 | 點數保證金、出席紀錄、互評、信用摘要、提醒與檢舉後台。 | 可安全處理取消、爽約與重試，不產生重複扣點。 |
| 3. Monetization | 驗證單位經濟與餐廳合作。 | 加值、Plus、餐廳合作標示、置頂與營運儀表板。 | 商業化不降低安全與公平性，且留有清楚的合作揭露。 |
| 4. Scale | 擴大城市與活動密度。 | 搜尋、推薦、營運工具、A/B 實驗與效能優化。 | 服務品質、回應時間與客服處理流程可支撐成長。 |

## 8. MVP 成功指標

第一版應以「有品質的履約」優先於註冊量。建議追蹤：完整個人檔案率、已發布飯局的有效申請率、申請至核准時間、核准後聊天啟動率、飯局完成率、取消率、爽約率、客服爭議率與回訪率。所有指標均應以去識別化、最小必要資料為原則處理。

## References

[1]: [Next.js — App Router installation and project structure](https://nextjs.org/docs/app/getting-started/installation)
[2]: [Drizzle ORM — PostgreSQL support](https://orm.drizzle.team/docs/get-started-postgresql)
[3]: [Google Maps Platform — Place Autocomplete](https://developers.google.com/maps/documentation/javascript/legacy/place-autocomplete)
