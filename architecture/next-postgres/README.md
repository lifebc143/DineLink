# DineLink 目標資料層：Next.js + PostgreSQL + Drizzle

此目錄保存 **Next.js App Router 與 PostgreSQL** 上線架構所使用的完整 Drizzle Schema。`drizzle/schema.ts` 以飯局資料為核心，將申請與審核、已確認出席、群組聊天室、飯後互評、點數保證金、點數帳本、外部金流與通知拆為可獨立稽核的資料表。

目前可操作的預覽使用受管全端範本提供的既有執行環境；這個目錄則是依產品指定技術棧整理的**目標實作來源**。正式遷移時，請建立 Next.js App Router 專案，將本檔複製為專案內的 `drizzle/schema.ts`，設定 PostgreSQL `DATABASE_URL`，再使用 Drizzle 產生並檢閱 migration SQL 後才套用至空白資料庫。

> 遷移前請先針對真實使用者資料補上資料保護、存取控制、刪除與留存政策；請勿在未經審核的情況下對既有生產資料執行 migration。

| 模組 | 主要資料表 | 設計目的 |
| --- | --- | --- |
| 身分與信用 | `users` | 維護身份、性別、自介、點數餘額、信用分數與驗證狀態。 |
| 飯局生命週期 | `dining_events`、`event_applications`、`event_attendances` | 切分發起、申請審核與確認出席，防止未核准者進入成員區域。 |
| 互動與信任 | `chat_messages`、`event_reviews` | 聊天訊息依飯局分區；互評以準時、禮貌、趣味三項建模。 |
| 保證金與付款 | `event_deposits`、`point_transactions`、`payment_transactions` | 以不可變動帳本記錄點數變化，並分離第三方金流交易。 |
| 通知 | `notifications` | 存放申請結果、提醒、爽約與聊天室的可追蹤通知紀錄。 |
