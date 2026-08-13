import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DineLink 約飯",
  description: "以好好吃飯為核心的社交飯局平台",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
