# DineLink 約飯 Web MVP

這個儲存庫保存 DineLink 的手機優先約飯社交 Web MVP。它包含可操作的 UI 原型、PostgreSQL + Drizzle 目標資料模型、飯局資料流程與產品規格文件。

| 文件／目錄 | 用途 |
| --- | --- |
| `client/src/pages/Home.tsx` | 現行手機優先 UI 原型與 Mock 互動。 |
| `architecture/next-postgres/drizzle/schema.ts` | 正式 Next.js + PostgreSQL 目標架構的完整 Drizzle Schema。 |
| `docs/DineLink_MVP_PRD.md` | PRD、技術架構、商業化方向與 0-to-1 Roadmap。 |
| `docs/MVP_DATA_FLOWS.md` | 報名、審核、聊天室、保證金、爽約與提醒的後端契約。 |
| `docs/DineLink_ERD.mmd` | 可在 Mermaid 支援工具中預覽的 ERD 原始碼。 |
| `docs/FRONTEND_COMPONENT_LOGIC.md` | 手機畫面、元件與資料邊界設計。 |

## 本機品質檢查

```bash
pnpm test
pnpm check
```

目前受管預覽使用既有全端範本提供 UI 操作；`architecture/next-postgres/` 是依產品指定技術棧整理的正式遷移來源。將此原型切換為正式產品時，應建立 Next.js App Router 專案，遷移目標 Schema 至 PostgreSQL，並依 `docs/MVP_DATA_FLOWS.md` 建立受保護 API 與背景任務。

## GitHub 協作規範

請將功能修改拆為聚焦的 Pull Request，禁止提交 `.env*`、金流私鑰、真實使用者匯出資料或未經授權的媒體。涉及 schema 的 PR 必須附上 migration SQL、回復策略與測試結果；涉及點數、保證金、評價與通知的 PR 必須說明 transaction、授權與冪等性處理。
