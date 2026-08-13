import type { Metadata } from "next";
import type { ReactNode } from "react";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DineLink 約飯",
  description: "以好好吃飯為核心的社交飯局配對平台。",
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
