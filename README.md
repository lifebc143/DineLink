# DineLink 約飯 Web MVP

這個儲存庫保存 DineLink 的手機優先約飯社交 Web MVP。主程式已統一為 **Next.js App Router + PostgreSQL + Drizzle ORM**，保留手機版 UI、Manus OAuth 登入流程、飯局 API 與產品規格文件。

| 文件／目錄 | 用途 |
| --- | --- |
| `src/app/page.tsx` | 現行手機優先 UI 原型與互動入口。 |
| `src/app/api/` | OAuth、飯局、申請審核、聊天室、出席與互評 Route Handlers。 |
| `drizzle/schema.ts` | 正式 PostgreSQL Drizzle Schema 與 domain types。 |
| `drizzle/` | 已套用到 Supabase 的 PostgreSQL migration。 |
| `docs/DineLink_MVP_PRD.md` | PRD、技術架構、商業化方向與 0-to-1 Roadmap。 |
| `docs/MVP_DATA_FLOWS.md` | 報名、審核、聊天室、保證金、爽約與提醒的後端契約。 |
| `docs/DineLink_ERD.mmd` | 可在 Mermaid 支援工具中預覽的 ERD 原始碼。 |
| `docs/FRONTEND_COMPONENT_LOGIC.md` | 手機畫面、元件與資料邊界設計。 |

## 本機品質檢查

```bash
pnpm test
pnpm check
```

使用 `pnpm dev` 啟動 Next.js 預覽；使用 `pnpm db:generate` 與 `pnpm db:migrate` 管理 PostgreSQL schema。遷移後的舊 Vite／Express 程式碼已封存於 `legacy/`，不參與新主程式的建置或測試。

## 部署前環境變數

請設定 `POSTGRES_URL`、`JWT_SECRET`、`VITE_APP_ID`、`VITE_OAUTH_PORTAL_URL`、`OAUTH_SERVER_URL`、`NEXT_PUBLIC_FORGE_API_KEY` 與 `NEXT_PUBLIC_FORGE_API_URL`。詳見 [GitHub 推送與環境設定指南](docs/GITHUB_PUSH.md)。

## GitHub 協作規範

請將功能修改拆為聚焦的 Pull Request，禁止提交 `.env*`、金流私鑰、真實使用者匯出資料或未經授權的媒體。涉及 schema 的 PR 必須附上 migration SQL、回復策略與測試結果；涉及點數、保證金、評價與通知的 PR 必須說明 transaction、授權與冪等性處理。
