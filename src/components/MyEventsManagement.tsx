"use client";

import { ArrowLeft, CalendarDays, Check, ChevronDown, X } from "lucide-react";
import React, { useEffect, useState } from "react";

type EventRecord = { id: string; title: string; eventStartAt: string; restaurantName: string | null; venueAddress: string; status: string; capacity: number };
type Payload = {
  hosted: Array<{ event: EventRecord; pendingApplications: Array<{ application: { id: string; introduction: string | null }; applicant: { displayName: string } }>; attendances: Array<{ attendance: { id: string; userId: string; status: string }; member: { displayName: string } }> }>;
  applied: Array<{ application: { id: string; status: string }; event: EventRecord; host: { displayName: string } }>;
};

export default function MyEventsManagement({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Payload | null>(null);
  const [active, setActive] = useState<"hosted" | "applied">("hosted");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/me/events", { cache: "no-store" }).catch(() => null);
    if (!response) setMessage("目前無法讀取飯局資料，請檢查網路後再試。");
    else if (response.status === 401) setMessage("請先登入，才能查看與管理你的飯局。");
    else if (!response.ok) setMessage("目前無法讀取飯局資料，請稍後再試。");
    else { setData(await response.json() as Payload); setMessage(""); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const review = async (id: string, decision: "approved" | "rejected") => {
    const response = await fetch(`/api/applications/${id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }).catch(() => null);
    if (!response?.ok) setMessage("審核未完成，請稍後再試。"); else await load();
  };
  const updateAttendance = async (eventId: string, userId: string, status: "attended" | "late" | "no_show") => {
    const response = await fetch(`/api/events/${eventId}/attendance`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, status }) }).catch(() => null);
    if (!response?.ok) setMessage("出席紀錄未更新，請稍後再試。"); else await load();
  };
  const cancel = async (id: string) => {
    const response = await fetch(`/api/applications/${id}/cancel`, { method: "POST" }).catch(() => null);
    if (!response?.ok) setMessage("目前無法取消申請，請稍後再試。"); else await load();
  };
  const date = (value: string) => new Date(value).toLocaleString("zh-TW", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
  return <section className="page-enter px-4 pb-10 pt-5"><button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button><div className="rounded-[30px] bg-slate-950 p-5 text-white"><p className="text-[11px] font-bold tracking-[0.2em] text-emerald-200">MY DINING PLANS</p><h1 className="mt-2 text-[29px] font-black">我的飯局</h1><p className="mt-2 text-sm leading-relaxed text-emerald-100">管理我發起與我申請的飯局，追蹤審核、取消、出席與信用紀錄。</p></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-1.5 shadow-sm"><button onClick={() => setActive("hosted")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${active === "hosted" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我發起的飯局</button><button onClick={() => setActive("applied")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${active === "applied" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我已申請的飯局</button></div>{loading && <p className="mt-4 rounded-2xl bg-white p-5 text-center text-sm font-semibold text-slate-500">正在讀取你的飯局…</p>}{message && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">{message}{message.startsWith("請先登入") && <a href="/api/auth/login" className="mt-3 inline-block rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">登入並查看我的飯局</a>}</div>}{!loading && !message && active === "hosted" && <div className="mt-4 space-y-3">{data?.hosted.length === 0 && <Empty title="尚未發起飯局" text="發起第一場飯局後，可在此審核申請與管理已確認成員。" />}{data?.hosted.map(({ event, pendingApplications, attendances }) => <div key={event.id} className="rounded-[24px] bg-white p-4 shadow-sm"><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">{date(event.eventStartAt)} · {event.restaurantName || event.venueAddress}</p><div className="mt-3 grid grid-cols-2 rounded-2xl bg-slate-50 p-3 text-center"><div><p className="font-black">{pendingApplications.length}</p><p className="text-[10px] text-slate-500">待審核申請</p></div><div><p className="font-black">{attendances.length} / {event.capacity}</p><p className="text-[10px] text-slate-500">已確認成員</p></div></div>{pendingApplications.map(({ application, applicant }) => <div key={application.id} className="mt-3 rounded-2xl border border-slate-100 p-3"><p className="text-sm font-bold">{applicant.displayName}</p><p className="mt-1 text-xs text-slate-500">{application.introduction || "尚未留下自我介紹"}</p><div className="mt-3 flex gap-2"><button onClick={() => void review(application.id, "approved")} className="pressable flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white">核准</button><button onClick={() => void review(application.id, "rejected")} className="pressable flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600">拒絕</button></div></div>)}<div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-xs font-black text-emerald-950">已確認成員與出席紀錄</p>{attendances.map(({ attendance, member }) => <div key={attendance.id} className="mt-2 rounded-xl bg-white p-2.5"><div className="flex justify-between text-xs font-bold"><span>{member.displayName}</span><span className="text-emerald-700">{attendance.status}</span></div><div className="mt-2 grid grid-cols-3 gap-1"><button onClick={() => void updateAttendance(event.id, attendance.userId, "attended")} className="rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white">出席</button><button onClick={() => void updateAttendance(event.id, attendance.userId, "late")} className="rounded-lg bg-amber-100 py-1.5 text-[10px] font-bold text-amber-800">遲到</button><button onClick={() => void updateAttendance(event.id, attendance.userId, "no_show")} className="rounded-lg bg-rose-100 py-1.5 text-[10px] font-bold text-rose-700">爽約</button></div></div>)}<details className="mt-3 rounded-xl bg-white p-3"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-emerald-950">查看取消規則明細<ChevronDown className="h-4 w-4" /></summary><p className="mt-2 text-[11px] leading-relaxed text-emerald-800">申請者可在飯局開始前取消；核准後取消會退出聊天室並留下取消紀錄。主辦人可更新出席狀態，爽約處理將納入信用與出席率。</p></details></div></div>)}</div>}{!loading && !message && active === "applied" && <div className="mt-4 space-y-3">{data?.applied.length === 0 && <Empty title="尚未申請飯局" text="在探索頁選擇飯局送出申請，審核結果會顯示在這裡。" />}{data?.applied.map(({ application, event, host }) => <div key={application.id} className="rounded-[24px] bg-white p-4 shadow-sm"><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">主辦人 {host.displayName} · {date(event.eventStartAt)}</p><p className="mt-3 text-xs text-slate-600">狀態：{application.status === "approved" ? "已確認，可進入群組聊天室" : "等待主辦人審核"}</p>{["pending", "approved"].includes(application.status) && <button onClick={() => void cancel(application.id)} className="pressable mt-3 w-full rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-bold text-rose-700">{application.status === "approved" ? "取消參與並退出聊天室" : "取消申請"}</button>}</div>)}</div>}</section>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center"><CalendarDays className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-black text-emerald-950">{title}</p><p className="mt-1 text-xs text-emerald-800">{text}</p></div>; }
