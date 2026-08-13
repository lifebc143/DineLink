# DineLink MVP 資料流程與後端契約

本文件定義 DineLink 第一版中最重要的資料一致性規則。它將產品介面上的「我要報名」、「核准成員」、「已確認聊天室」與「保證金提示」連結到 PostgreSQL Schema 的寫入順序，供 Next.js App Router 的 Server Actions 或 Route Handlers 實作時遵循。

> **核心原則：** 所有會改變點數、名額、申請狀態或出席狀態的操作，必須在同一筆資料庫 transaction 中完成；帳本只新增，不覆寫既有交易。

## 1. 飯局與申請狀態模型

| Entity | 狀態 | 允許轉換 | 說明 |
| --- | --- | --- | --- |
| `dining_events` | `draft` | `published`、`cancelled` | 主辦人完成欄位後才可公開。 |
| `dining_events` | `published` | `full`、`locked`、`cancelled` | 允許接受申請的主要狀態。 |
| `dining_events` | `full` | `published`、`locked`、`cancelled` | 已確認人數達上限，若成員退出可回到公開狀態。 |
| `dining_events` | `locked` | `in_progress`、`cancelled` | 報名截止後，不接受新申請。 |
| `dining_events` | `in_progress` | `completed` | 飯局開始時進入進行中。 |
| `event_applications` | `pending` | `approved`、`rejected`、`withdrawn` | 已扣押保證金，等待主辦人決定。 |
| `event_applications` | `approved` | `cancelled` | 需建立一筆 `event_attendances` 作為聊天室與出席權限來源。 |
| `event_deposits` | `held` | `released`、`forfeited`、`refunded` | 保證金先凍結，完成飯局後釋放；爽約時沒收。 |

## 2. 報名與主辦人審核流程

### 2.1 送出報名

使用者按下「送出報名申請」時，服務端必須先確認飯局為 `published`、尚未超過申請截止時間、非主辦人本人，且使用者不存在同一飯局的有效申請。接著以資料庫 transaction 鎖定飯局與使用者點數餘額，確認還有名額與可用點數後，依序建立申請、建立 `held` 狀態的保證金、寫入負值點數帳本，並同步降低 `users.point_balance`。最後才建立給主辦人的 `application_submitted` 通知。

| 寫入順序 | 資料表 | 動作 |
| --- | --- | --- |
| 1 | `event_applications` | 新增 `pending` 申請與自我介紹。 |
| 2 | `event_deposits` | 以飯局的 `deposit_points` 新增一筆 `held` 紀錄。 |
| 3 | `point_transactions` | 新增 `deposit_hold`、負點數與 `balance_after`。 |
| 4 | `users` | 同筆 transaction 更新可用點數餘額。 |
| 5 | `notifications` | 建立給主辦人的待處理申請通知。 |

### 2.2 核准與拒絕

主辦人是唯一可審核的人。核准時，服務端必須再次鎖定飯局、重新計算已核准人數，避免兩位申請者同時通過導致超額。成功核准後，將申請改為 `approved`、建立 `event_attendances(status=confirmed)`，並通知申請者。若正好達上限，飯局狀態改為 `full`。

拒絕或申請者在允許取消期限內撤回時，應將申請標為終態，將保證金標為 `released` 或 `refunded`，並新增一筆正值 `deposit_release` 點數帳本，與 `users.point_balance` 同步。系統不得修改先前的凍結帳本資料。

## 3. 群組聊天室授權與即時體驗

聊天室讀寫權限以 `event_attendances` 為準，而不是僅檢查申請是否存在。查詢與送訊息前，後端需驗證呼叫者為飯局主辦人，或擁有此飯局的出席紀錄且狀態在 `confirmed`、`attended`、`late` 之一；`no_show`、`excused` 或未核准申請者不可進入聊天室。

| API 契約 | 授權條件 | 寫入／回傳 |
| --- | --- | --- |
| `POST /api/events/:id/applications` | 已登入且飯局可報名 | 申請、保證金、帳本、通知。 |
| `POST /api/events/:id/applications/:applicationId/review` | 飯局主辦人 | 核准／拒絕、出席紀錄或退款帳本、通知。 |
| `GET /api/events/:id/messages` | 已確認成員或主辦人 | 依 `created_at` 分頁的文字訊息。 |
| `POST /api/events/:id/messages` | 已確認成員或主辦人 | 一筆 `chat_messages` 與成員的新訊息通知。 |
| `POST /api/events/:id/reviews` | 飯局已完成且雙方出席 | 一筆不可重複的三維互評。 |

第一版可採用短輪詢或 Server-Sent Events 提供對話更新；正式版若採 WebSocket，仍不得用記憶體保存聊天室權限或未讀狀態，所有授權應每次以資料庫狀態為準。

## 4. 評價、信用與防爽約規則

飯局轉為 `completed` 後，系統可向所有 `attended` 成員建立 `review_request` 通知。提交互評時，驗證者與被評者必須不同、同屬同一已完成飯局，且評分範圍限制為 1 至 5；Schema 的唯一索引防止任一方向對同一對象重複評價。信用分數應以背景工作或受控服務匯總，避免讓用戶端直接計算或修改。

爽約處理由主辦人或營運人員登記出席結果後觸發。當出席狀態改為 `no_show`，服務端在單一 transaction 中將保證金標為 `forfeited`、寫入原因、遞增 `users.no_show_count`、依政策降低 `credit_score`，並對其他已確認成員建立 `member_no_show` 通知。因保證金已在報名時自點數餘額扣除，沒收時不應重複扣點；只需更新保證金狀態與紀錄結果。

| 情境 | 保證金 | 點數帳本 | 信用影響 | 通知 |
| --- | --- | --- | --- | --- |
| 主辦人核准 | 維持 `held` | 無新增 | 無 | 申請者收到核准。 |
| 主辦人拒絕 | `released` | `deposit_release` 正值 | 無 | 申請者收到拒絕。 |
| 準時完成 | `released` | `deposit_release` 正值 | 互評後更新 | 互評邀請。 |
| 取消且符合期限 | `refunded` | `deposit_release` 正值 | 無或輕微規則 | 主辦人與成員收到取消。 |
| 登記爽約 | `forfeited` | 不重複扣點 | 依政策扣分 | 相關成員收到爽約通知。 |

## 5. 飯局前兩小時提醒

提醒為確定性、時間驅動的工作，應由可靠的受管背景排程呼叫站內的受保護端點。建立或改期飯局時，服務端以 `event_start_at - 2 hours` 建立或更新任務，並把任務識別碼寫入 `dining_events.reminder_task_uid`。執行端點只依受信任的任務識別碼找飯局，確認其仍處於 `published`、`full` 或 `locked`，再向 `event_attendances.status = confirmed` 的成員建立 `event_reminder` 通知。

處理器必須具備冪等性：若因重試再次執行，應依事件與提醒類型檢查既有通知，避免同一成員收到重複提醒。取消飯局或調整開始時間時，需同時停用或更新既有排程工作。

## 6. MVP 驗收案例

| 案例 | 預期結果 |
| --- | --- |
| 使用者點數不足仍嘗試報名 | 回傳可理解的業務錯誤，不建立申請、保證金或帳本。 |
| 主辦人同時核准最後兩位候選人 | 最多一位成功；另一筆安全地回傳名額已滿。 |
| 被拒絕申請者開啟聊天網址 | 回傳 403，不洩漏已確認成員與訊息內容。 |
| 已完成成員提交同一份評價兩次 | 第二次因唯一索引或預檢失敗。 |
| 爽約紀錄重送 | 保證金、信用與通知不應重複處理。 |
| 排程提醒端點重試 | 每位確認成員最多保留一筆該飯局的提醒通知。 |
