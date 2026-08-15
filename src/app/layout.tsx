import type { Metadata } from "next";
import type { ReactNode } from "react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SITE_NAME, template: `%s｜${SITE_NAME}` },
  description: "DineLink 是以好好吃飯為核心的社交飯局平台；探索公開飯局、經主辦人審核後安心認識新朋友。",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "zh_TW", siteName: SITE_NAME, title: SITE_NAME, description: "以好好吃飯為核心的社交飯局平台。", url: "/", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DineLink 約飯社交平台" }] },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: "以好好吃飯為核心的社交飯局平台。", images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

function loadBuiltStyles() {
  const candidates = [
    join(process.cwd(), ".next", "static", "css"),
    join(process.cwd(), ".next", "standalone", ".next", "static", "css"),
  ];

  for (const directory of candidates) {
    if (!existsSync(directory)) continue;
    const cssFiles = readdirSync(directory).filter(file => file.endsWith(".css"));
    if (cssFiles.length === 0) continue;
    return cssFiles.map(file => readFileSync(join(directory, file), "utf8")).join("\n");
  }

  return "";
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const inlineStyles = loadBuiltStyles();
  return <html lang="zh-Hant"><head>{inlineStyles ? <style dangerouslySetInnerHTML={{ __html: inlineStyles }} /> : null}</head><body>{children}</body></html>;
}
