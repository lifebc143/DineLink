# DineLink MVP 資料流程與後端契約

本文件定義 DineLink 第一版中最重要的資料一致性規則。它將「我要報名」、「主辦人審核」、「已確認聊天室」、「出席紀錄」與「信用 rating」連結到 PostgreSQL 的寫入順序，供 Next.js Route Handlers 實作時遵循。

> **核心原則：** 申請、名額、出席與信用狀態的變更必須在同一筆 transaction 中完成；通知可重試但不得重複建立；信用只由服務端依出席與互評更新。

## 1. 飯局與申請狀態模型

| Entity | 狀態 | 允許轉換 | 說明 |
| --- | --- | --- | --- |
| `dining_events` | `draft` | `published`、`cancelled` | 主辦人完成必要欄位後才可公開。 |
| `dining_events` | `published` | `full`、`locked`、`cancelled` | 允許接受申請的主要狀態。 |
| `dining_events` | `full` | `published`、`locked`、`cancelled` | 已確認人數達上限；若成員取消可回到公開狀態。 |
| `dining_events` | `locked` | `in_progress`、`cancelled` | 報名截止後不接受新申請。 |
| `dining_events` | `in_progress` | `completed` | 飯局開始後進入進行中。 |
| `event_applications` | `pending` | `approved`、`rejected`、`withdrawn` | 等待主辦人審核。 |
| `event_applications` | `approved` | `cancelled` | 取消時保留原因與時間；對應 attendance 用於聊天室與出席權限。 |

## 2. 報名、審核與取消流程

### 2.1 送出報名

使用者送出申請時，服務端確認飯局為 `published`、尚未超過申請截止時間、非主辦人本人，且不存在同一飯局的有效申請。接著鎖定飯局名額，新增 `pending` 申請與主辦人通知；不影響使用者點數餘額。

| 寫入順序 | 資料表 | 動作 |
| --- | --- | --- |
| 1 | `event_applications` | 新增 `pending` 申請與自我介紹。 |
| 2 | `notifications` | 建立給主辦人的待處理申請通知。 |

### 2.2 核准、拒絕與取消

主辦人是唯一可審核的人。核准時，服務端再次鎖定飯局、重新計算已核准人數，避免同時核准造成超額；成功後將申請改為 `approved`、建立 `event_attendances(status=confirmed)` 並通知申請者。拒絕、撤回或取消時，應將申請標為終態、保存原因與時間，並通知相關成員。

## 3. 群組聊天室授權

聊天室讀寫權限以 `event_attendances` 為準，而不是僅檢查申請是否存在。後端需驗證呼叫者為飯局主辦人，或擁有此飯局且狀態為 `confirmed`、`attended` 或 `late` 的出席紀錄；未核准申請者不可進入聊天室。

| API 契約 | 授權條件 | 寫入／回傳 |
| --- | --- | --- |
| `POST /api/events/:id/applications` | 已登入且飯局可報名 | 新增申請與主辦人通知。 |
| `POST /api/events/:id/applications/:applicationId/review` | 飯局主辦人 | 核准／拒絕、出席紀錄與通知。 |
| `GET/POST /api/events/:id/messages` | 已確認成員或主辦人 | 分頁文字訊息與新訊息通知。 |
| `POST /api/events/:id/reviews` | 飯局已完成且雙方出席 | 一筆不可重複的三維互評。 |

## 4. 出席、信用 rating 與爽約規則

飯局完成後，主辦人或營運人員可記錄 `attended`、`late`、`no_show`、`excused`。系統向已出席成員建立 `review_request` 通知；互評限制為同一完成飯局、不同使用者、每個方向一次，並限制準時、禮貌、趣味各 1 至 5 分。信用 rating 由服務端彙總，禁止用戶端直接修改。

| 情境 | 申請／出席紀錄 | 信用影響 | 通知 |
| --- | --- | --- | --- |
| 主辦人核准 | 申請 `approved`，建立 `confirmed` attendance。 | 無。 | 申請者收到核准。 |
| 主辦人拒絕 | 申請 `rejected`，保存審核時間。 | 無。 | 申請者收到拒絕。 |
| 準時完成 | attendance `attended`。 | 互評後更新 rating。 | 互評邀請。 |
| 合規取消 | application 或 attendance `cancelled`／`excused`。 | 依取消規則不扣分或註記。 | 主辦人與成員收到取消通知。 |
| 登記爽約 | attendance `no_show`，保存原因與操作者。 | 遞增爽約次數並依政策降低 rating。 | 相關成員收到爽約通知。 |

## 5. 飯局前兩小時提醒

建立或改期飯局時，服務端以 `event_start_at - 2 hours` 建立或更新受管排程，並寫入 `dining_events.reminder_task_uid`。排程端點確認飯局仍處於 `published`、`full` 或 `locked`，再向 `event_attendances.status = confirmed` 的成員建立 `event_reminder` 通知。重試時須依飯局、收件者與提醒類型去重。

## 6. MVP 驗收案例

| 案例 | 預期結果 |
| --- | --- |
| 主辦人同時核准最後兩位候選人 | 最多一位成功；另一筆安全地回傳名額已滿。 |
| 被拒絕申請者開啟聊天網址 | 回傳 403，不洩漏已確認成員與訊息內容。 |
| 已完成成員提交同一份評價兩次 | 第二次因唯一索引或預檢失敗。 |
| 爽約紀錄重送 | 出席、信用與通知不應重複處理。 |
| 排程提醒端點重試 | 每位確認成員最多保留一筆該飯局的提醒通知。 |
