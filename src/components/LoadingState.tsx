import React from "react";

type LoadingSize = "sm" | "md";

export function LoadingIndicator({ size = "md", className = "" }: { size?: LoadingSize; className?: string }) {
  const dimensions = size === "sm" ? "h-4 w-4" : "h-8 w-8";
  return <span aria-hidden="true" className={`dine-loading-indicator ${dimensions} ${className}`}><span className="dine-loading-orbit" /><span className="dine-loading-core" /></span>;
}

export default function LoadingState({ label = "正在載入資料…", description, compact = false, className = "" }: { label?: string; description?: string; compact?: boolean; className?: string }) {
  return <div role="status" aria-live="polite" className={`dine-loading-state ${compact ? "dine-loading-state-compact" : ""} ${className}`}><LoadingIndicator size={compact ? "sm" : "md"} /><div><p className="text-sm font-bold text-slate-700">{label}</p>{description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}</div></div>;
}
