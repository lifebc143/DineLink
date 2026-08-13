"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-Hant">
      <body>
        <main style={{ fontFamily: "system-ui, sans-serif", margin: "0 auto", maxWidth: 640, padding: 24 }}>
          <h1>頁面暫時無法載入</h1>
          <p>請稍後再試；若問題持續，請聯絡 DineLink 支援團隊。</p>
          <button type="button" onClick={reset}>重新整理內容</button>
        </main>
      </body>
    </html>
  );
}
