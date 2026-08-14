"use client";

import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import React from "react";

type PreviewConfirmSheetProps = {
  title: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  billMode: string;
  budget: string;
  capacity: string;
  apiError: string;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export default function PreviewConfirmSheet({ title, date, time, venueName, venueAddress, billMode, budget, capacity, apiError, isSubmitting, onBack, onConfirm }: PreviewConfirmSheetProps) {
  return <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-label="飯局預覽建立確認" className="page-enter flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-[32px] bg-[#fcfbff] shadow-2xl">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-6">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" />
        <div className="rounded-[24px] bg-slate-950 p-4 text-white"><p className="text-[11px] font-bold tracking-[0.18em] text-pink-200">TABLE PREVIEW</p><h2 className="mt-2 text-xl font-black">{title}</h2><p className="mt-3 flex items-center gap-2 text-sm text-violet-100"><CalendarDays className="h-4 w-4 text-pink-300" />{date} · {time}</p><p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-violet-100"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /><span>{venueName} · {venueAddress}</span></p></div>
        <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">{billMode}</div><div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">{budget || "預算待補"} · {capacity || "4"} 人</div></div>
        <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3 text-xs leading-relaxed text-violet-900"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" />確認後會建立飯局並寫入你的飯局清單；取消規則、出席紀錄與信用 rating 會於送出前清楚提示。</div>
        {apiError && <div role="alert" className="mt-3 rounded-2xl bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-700"><p>{apiError}</p>{apiError.startsWith("請先登入") && <a href="/api/auth/login?returnTo=/?tab=create" className="mt-2 inline-block rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">立即登入後建立飯局</a>}</div>}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_rgba(15,23,42,0.08)]"><div className="mx-auto flex max-w-md gap-3"><button type="button" disabled={isSubmitting} onClick={onBack} className="pressable flex-1 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 disabled:opacity-50">返回編輯</button><button type="button" disabled={isSubmitting} onClick={onConfirm} className="pressable flex-1 rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? "建立中…" : "確認建立飯局"}</button></div></div>
    </section>
  </div>;
}
