# DineLink GitHub 推送與環境設定指南

本專案的主執行架構為 **Next.js App Router、PostgreSQL 與 Drizzle ORM**。請先在本機安裝 Node.js 22 與 pnpm 10，接著從 GitHub clone 專案並安裝依賴。

```bash
git clone <YOUR_REPOSITORY_URL> dine-link-mvp
cd dine-link-mvp
pnpm install
```

## 必要環境變數

請在 `.env.local` 設定以下變數。不要將此檔案推送至 GitHub，也不要在 issue、Pull Request 或前端程式中揭露 PostgreSQL 密碼與 JWT secret。

| 變數 | 用途 |
| --- | --- |
| `POSTGRES_URL` | Supabase 或其他受管 PostgreSQL 的 SSL 連線 URL。 |
| `JWT_SECRET` | 至少 32 字元的隨機字串，用於簽署登入 session。 |
| `VITE_APP_ID` | Manus OAuth App ID。 |
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth portal base URL。 |
| `OAUTH_SERVER_URL` | Manus OAuth server base URL。 |
| `NEXT_PUBLIC_FORGE_API_KEY` | Google Maps proxy 的前端存取金鑰。 |
| `NEXT_PUBLIC_FORGE_API_URL` | Google Maps proxy 的 base URL。 |

## 資料庫與品質檢查

在首次設定 PostgreSQL 後，先檢查 migration，再套用 schema。當 `pnpm test` 通過時，會驗證資料庫連線及十個 DineLink 核心資料表。

```bash
pnpm db:generate
pnpm db:migrate
pnpm test
pnpm check
pnpm build
pnpm dev
```

## 推送到 GitHub

若目前資料夾尚未連接遠端倉庫，請用下列指令建立首個 commit 與 GitHub repository。將 `<github-user>` 與 `<repository-name>` 替換為你的帳號與專案名稱。

```bash
git status
git add .
git commit -m "feat: migrate DineLink to Next.js and PostgreSQL"
gh repo create <github-user>/<repository-name> --private --source=. --remote=origin --push
```

若你已先在 GitHub 建好空 repository，則改用下列方式連接後推送。

```bash
git remote add origin https://github.com/<github-user>/<repository-name>.git
git branch -M main
git push -u origin main
```

> 每次修改 `drizzle/schema.ts` 後，請一併提交產生的 migration SQL。涉及點數、保證金、互評、爽約或通知的變更，應附上 transaction、授權與冪等性測試結果。
