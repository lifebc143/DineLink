"use client";

import { Copy, ExternalLink, Smartphone } from "lucide-react";
import React, { useEffect, useState } from "react";
import { detectInAppBrowser, type InAppBrowser } from "@/lib/mobile-login";

const providerLabel: Record<Exclude<InAppBrowser, null>, string> = { line: "LINE", facebook: "Facebook" };

export default function InAppBrowserLoginNotice() {
  const [browser, setBrowser] = useState<InAppBrowser>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setBrowser(detectInAppBrowser(navigator.userAgent)), []);
  if (!browser) return null;

  const copyCurrentLink = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return <aside role="alert" data-testid="in-app-browser-login-notice" className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 p-3.5 text-amber-950 shadow-sm"><div className="flex gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950"><Smartphone className="h-4 w-4" /></span><div className="min-w-0"><p className="text-xs font-black">建議改用 Safari 登入</p><p className="mt-1 text-[11px] leading-relaxed text-amber-900">你目前正透過 {providerLabel[browser]} 內建瀏覽器開啟。為避免 iPhone 的第三方登入或 Cookie 狀態中斷，請點選右下角選單，以「在 Safari 開啟」後再登入。</p><div className="mt-2.5 flex flex-wrap gap-2"><button type="button" onClick={() => void copyCurrentLink()} className="pressable inline-flex items-center gap-1 rounded-lg bg-amber-950 px-2.5 py-1.5 text-[11px] font-bold text-white"><Copy className="h-3.5 w-3.5" />{copied ? "已複製連結" : "複製目前連結"}</button><span className="inline-flex items-center gap-1 px-1 text-[11px] font-semibold text-amber-800"><ExternalLink className="h-3.5 w-3.5" />Safari 開啟後使用全頁登入</span></div></div></div></aside>;
}
