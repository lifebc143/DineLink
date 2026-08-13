# DineLink 手機版畫面與元件邏輯

## 畫面架構

手機版以 `max-w-md` App Shell 包住所有使用者介面，在桌面保留置中的手機容器與陰影，手機裝置則全寬呈現。底部導覽固定提供「探索」、「發起飯局」、「訊息」、「個人主頁」四個入口；個別詳情頁以回退操作取代隱藏式導覽，避免形成導航死角。

| 畫面 | 核心元件 | 本地互動 | 正式資料來源 |
| --- | --- | --- | --- |
| 探索 | `ExploreHero`、`SearchBar`、`FilterChips`、`EventCard`、`ExploreMap` | 列表／地圖切換、分類 chips、標記開啟詳情。 | `GET /api/events?status=published`。 |
| 發起飯局 | `EventForm`、`PlaceAutocomplete`、`PaymentModePicker` | 表單欄位、買單方式、地點建議、預覽與建立。 | `POST /api/events`；Google Places。 |
| 飯局詳情 | `EventDetailSheet`、`MemberPreview`、`AttendanceNotice` | 開啟／關閉詳情、閱讀取消規則與送出報名。 | `GET /api/events/:id`、`POST /applications`。 |
| 訊息 | `EventChat`、`MessageBubble`、`SafetyNotice` | 送出文字、訊息滾動。 | `GET/POST /messages`，僅確認成員。 |
| 個人主頁 | `ProfileHeader`、`TrustStatus`、`RatingSummary`、`ProductBriefLink` | 顯示驗證、出席紀錄與信用 rating 說明。 | `GET /api/me/profile`。 |
| 產品規格 | `PrdSummary`、`RoadmapList` | 返回個人頁。 | 靜態 Markdown／CMS 內容。 |

## 狀態與資料邊界

目前原型以本地 Mock Data 呈現資訊層級與操作回饋；正式版不可沿用假資料作為使用者信用、評價或出席狀態。讀取型頁面以 Server Components 載入初始資料，地圖、表單、底部導覽與聊天室輸入則使用 Client Components。所有會改變飯局、申請或出席狀態的動作必須呼叫服務端受保護端點，並在成功後重新驗證快取資料。

| 互動 | UI 立即回饋 | 服務端保證 |
| --- | --- | --- |
| 送出報名 | 按鈕進入 loading，再顯示「等待主辦人審核」。 | 驗證飯局可報名、非主辦人與未重複申請；建立申請與通知。 |
| 主辦人核准 | 申請卡更新為已確認。 | 再次鎖定名額，建立 attendance 與通知。 |
| 發送訊息 | 顯示送出中；成功後加入時間線。 | 以 attendance 驗證聊天室權限。 |
| 地點選擇 | 將選取的餐廳名稱與地址顯示於輸入框。 | 保存 Place ID、格式化地址、緯經度與必要欄位。 |
| 取消或爽約 | 顯示取消規則、出席紀錄與申訴入口。 | 保存狀態、原因、操作者與時間；更新信用與通知，且具冪等性。 |

## 設計系統規則

視覺以深藍背景承接熱粉、紫羅蘭與柔橙的 Mesh Gradient 光暈；文字保持高對比白色或深色，避免裝飾色影響可讀性。卡片使用大圓角、半透明白底與柔和陰影營造社交感，互動按鈕維持明確按壓回饋並遵循降低動態效果偏好。任何未上線功能都應顯示誠實的「即將推出」訊息，而非製造看似真實的交易、評價或成員活動。
