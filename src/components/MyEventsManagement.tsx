"use client";

import { ArrowLeft, Bell, CalendarDays, Check, ChevronDown, Star, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type EventRecord = { id: string; title: string; eventStartAt: string; restaurantName: string | null; venueAddress: string; status: string; capacity: number };
type Payload = {
  hosted: Array<{ event: EventRecord; pendingApplications: Array<{ application: { id: string; introduction: string | null }; applicant: { displayName: string } }>; attendances: Array<{ attendance: { id: string; userId: string; status: string }; member: { displayName: string } }> }>;
  applied: Array<{ application: { id: string; status: string }; event: EventRecord; host: { displayName: string } }>;
};
type Notification = { id: string; title: string; body: string; type: string; eventId: string | null; readAt: string | null; createdAt: string };
type ReviewTask = { event: EventRecord; peer: { id: string; displayName: string; avatarUrl: string | null } };
type View = "list" | "calendar" | "notifications" | "reviews";

const dateText = (value: string) => new Date(value).toLocaleString("zh-TW", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });

export default function MyEventsManagement({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Payload | null>(null);
  const [view, setView] = useState<View>("list");
  const [list, setList] = useState<"hosted" | "applied">("hosted");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [scores, setScores] = useState({ punctuality: 5, politeness: 5, fun: 5 });
  const [attendanceNote, setAttendanceNote] = useState("");
  const [reviewTarget, setReviewTarget] = useState<ReviewTask | null>(null);
  const [focusEventId] = useState(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("eventId"));

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/me/events", { cache: "no-store" }).catch(() => null);
    if (!response) setMessage("目前無法讀取飯局資料，請檢查網路後再試。");
    else if (response.status === 401) setMessage("請先登入，才能查看與管理你的飯局。");
    else if (!response.ok) setMessage("目前無法讀取飯局資料，請稍後再試。");
    else { setData(await response.json() as Payload); setMessage(""); }
    setLoading(false);
  };
  const loadNotifications = async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
    if (response?.ok) setNotifications((await response.json() as { notifications?: Notification[] }).notifications ?? []);
  };
  const loadReviewTasks = async () => {
    const response = await fetch("/api/me/review-tasks", { cache: "no-store" }).catch(() => null);
    if (response?.ok) setReviewTasks((await response.json() as { tasks?: ReviewTask[] }).tasks ?? []);
  };
  useEffect(() => { void load(); void loadNotifications(); void loadReviewTasks(); }, []);

  const reviewApplication = async (id: string, decision: "approved" | "rejected") => {
    const response = await fetch(`/api/applications/${id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }).catch(() => null);
    if (!response?.ok) setMessage("審核未完成，請稍後再試。"); else { await load(); await loadNotifications(); }
  };
  const updateAttendance = async (eventId: string, userId: string, status: "attended" | "late" | "no_show") => {
    const response = await fetch(`/api/events/${eventId}/attendance`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, status }) }).catch(() => null);
    if (!response?.ok) setMessage("出席紀錄未更新，請稍後再試。"); else await load();
  };
  const cancel = async (id: string) => {
    const response = await fetch(`/api/applications/${id}/cancel`, { method: "POST" }).catch(() => null);
    if (!response?.ok) setMessage("目前無法取消申請，請稍後再試。"); else { await load(); await loadNotifications(); }
  };
  const markRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => null);
    if (response?.ok) setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
  };
  const submitReview = async () => {
    if (!reviewTarget) return;
    const response = await fetch(`/api/events/${reviewTarget.event.id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revieweeId: reviewTarget.peer.id, punctualityScore: scores.punctuality, politenessScore: scores.politeness, funScore: scores.fun, attendanceNote }) }).catch(() => null);
    if (!response?.ok) { setMessage("評價尚未送出，請確認飯局已結束且雙方都有出席。"); return; }
    setReviewTasks((items) => items.filter((task) => !(task.event.id === reviewTarget.event.id && task.peer.id === reviewTarget.peer.id)));
    setReviewTarget(null); setAttendanceNote(""); setScores({ punctuality: 5, politeness: 5, fun: 5 });
  };

  const allEvents = useMemo(() => [ ...(data?.hosted.map((row) => ({ event: row.event, role: "主辦" as const })) ?? []), ...(data?.applied.map((row) => ({ event: row.event, role: "參與" as const })) ?? []) ], [data]);
  const unread = notifications.filter((item) => !item.readAt).length;
  return <section className="page-enter px-4 pb-10 pt-5">
    <button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button>
    <div className="rounded-[30px] bg-slate-950 p-5 text-white"><p className="text-[11px] font-bold tracking-[0.2em] text-emerald-200">MY DINING PLANS</p><h1 className="mt-2 text-[29px] font-black">我的飯局</h1><p className="mt-2 text-sm leading-relaxed text-emerald-100">快速掌握行程、主辦通知、出席紀錄與飯後信用評價。</p></div>
    <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-white/80 p-1.5 shadow-sm"><ViewButton active={view === "list"} onClick={() => setView("list")} icon={<Check className="h-4 w-4" />} label="管理" /><ViewButton active={view === "calendar"} onClick={() => setView("calendar")} icon={<CalendarDays className="h-4 w-4" />} label="日曆" /><ViewButton active={view === "notifications"} onClick={() => setView("notifications")} icon={<Bell className="h-4 w-4" />} label={unread ? `通知 ${unread}` : "通知"} /><ViewButton active={view === "reviews"} onClick={() => setView("reviews")} icon={<Star className="h-4 w-4" />} label="評價" /></div>
    {focusEventId && !loading && !message && <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">已由通知帶你前往對應飯局；該飯局以綠色外框標示。</p>}
    {loading && <p className="mt-4 rounded-2xl bg-white p-5 text-center text-sm font-semibold text-slate-500">正在讀取你的飯局…</p>}
    {message && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">{message}{message.startsWith("請先登入") && <a href="/api/auth/login" className="mt-3 inline-block rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">登入並查看我的飯局</a>}</div>}
    {!loading && !message && view === "list" && <ManageView active={list} setActive={setList} data={data} focusEventId={focusEventId} review={reviewApplication} updateAttendance={updateAttendance} cancel={cancel} />}
    {!loading && !message && view === "calendar" && <CalendarView items={allEvents} />}
    {!loading && !message && view === "notifications" && <NotificationView items={notifications} markRead={markRead} />}
    {!loading && !message && view === "reviews" && <ReviewView tasks={reviewTasks} onOpen={setReviewTarget} />}
    {reviewTarget && <ReviewDialog task={reviewTarget} scores={scores} setScores={setScores} attendanceNote={attendanceNote} setAttendanceNote={setAttendanceNote} onClose={() => setReviewTarget(null)} onSubmit={submitReview} />}
  </section>;
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button onClick={onClick} className={`pressable flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${active ? "bg-emerald-600 text-white" : "text-slate-500"}`}>{icon}<span>{label}</span></button>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center"><CalendarDays className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-black text-emerald-950">{title}</p><p className="mt-1 text-xs text-emerald-800">{text}</p></div>; }

function ManageView({ active, setActive, data, focusEventId, review, updateAttendance, cancel }: { active: "hosted" | "applied"; setActive: (value: "hosted" | "applied") => void; data: Payload | null; focusEventId: string | null; review: (id: string, decision: "approved" | "rejected") => void; updateAttendance: (eventId: string, userId: string, status: "attended" | "late" | "no_show") => void; cancel: (id: string) => void }) {
  return <div className="mt-4"><div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-1.5"><button onClick={() => setActive("hosted")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${active === "hosted" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我發起的飯局</button><button onClick={() => setActive("applied")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${active === "applied" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我已申請的飯局</button></div>
    {active === "hosted" ? <div className="mt-3 space-y-3">{data?.hosted.length === 0 && <Empty title="尚未發起飯局" text="發起第一場飯局後，可在此審核申請與管理已確認成員。" />}{data?.hosted.map(({ event, pendingApplications, attendances }) => <article key={event.id} className={`rounded-[24px] bg-white p-4 shadow-sm ${event.id === focusEventId ? "ring-2 ring-emerald-500" : ""}`}><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">{dateText(event.eventStartAt)} · {event.restaurantName || event.venueAddress}</p><div className="mt-3 grid grid-cols-2 rounded-2xl bg-slate-50 p-3 text-center"><div><p className="font-black">{pendingApplications.length}</p><p className="text-[10px] text-slate-500">待審核申請</p></div><div><p className="font-black">{attendances.length} / {event.capacity}</p><p className="text-[10px] text-slate-500">已確認成員</p></div></div>{pendingApplications.map(({ application, applicant }) => <div key={application.id} className="mt-3 rounded-2xl border border-slate-100 p-3"><p className="text-sm font-bold">{applicant.displayName}</p><p className="mt-1 text-xs text-slate-500">{application.introduction || "尚未留下自我介紹"}</p><div className="mt-3 flex gap-2"><button onClick={() => review(application.id, "approved")} className="pressable flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white">核准</button><button onClick={() => review(application.id, "rejected")} className="pressable flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600">拒絕</button></div></div>)}<div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-xs font-black text-emerald-950">已確認成員與出席紀錄</p>{attendances.map(({ attendance, member }) => <div key={attendance.id} className="mt-2 rounded-xl bg-white p-2.5"><div className="flex justify-between text-xs font-bold"><span>{member.displayName}</span><span className="text-emerald-700">{attendance.status}</span></div><div className="mt-2 grid grid-cols-3 gap-1"><button onClick={() => updateAttendance(event.id, attendance.userId, "attended")} className="rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white">出席</button><button onClick={() => updateAttendance(event.id, attendance.userId, "late")} className="rounded-lg bg-amber-100 py-1.5 text-[10px] font-bold text-amber-800">遲到</button><button onClick={() => updateAttendance(event.id, attendance.userId, "no_show")} className="rounded-lg bg-rose-100 py-1.5 text-[10px] font-bold text-rose-700">爽約</button></div></div>)}</div><details className="mt-3 rounded-xl bg-white p-3"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-emerald-950">查看取消規則明細<ChevronDown className="h-4 w-4" /></summary><p className="mt-2 text-[11px] leading-relaxed text-emerald-800">申請者可在飯局開始前取消；核准後取消會退出聊天室並留下取消紀錄。主辦人可更新出席狀態，爽約處理將納入信用與出席率。</p></details></article>)}</div> : <div className="mt-3 space-y-3">{data?.applied.length === 0 && <Empty title="尚未申請飯局" text="在探索頁選擇飯局送出申請，審核結果會顯示在這裡。" />}{data?.applied.map(({ application, event, host }) => <article key={application.id} className={`rounded-[24px] bg-white p-4 shadow-sm ${event.id === focusEventId ? "ring-2 ring-emerald-500" : ""}`}><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">主辦人 {host.displayName} · {dateText(event.eventStartAt)}</p><p className="mt-3 text-xs text-slate-600">狀態：{application.status === "approved" ? "已確認，可進入群組聊天室" : "等待主辦人審核"}</p>{["pending", "approved"].includes(application.status) && <button onClick={() => cancel(application.id)} className="pressable mt-3 w-full rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-bold text-rose-700">{application.status === "approved" ? "取消參與並退出聊天室" : "取消申請"}</button>}</article>)}</div>}</div>;
}

function CalendarView({ items }: { items: Array<{ event: EventRecord; role: "主辦" | "參與" }> }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [scope, setScope] = useState<"全部" | "主辦" | "參與">("全部");
  const [reminders, setReminders] = useState<Set<string>>(() => { try { return new Set<string>(JSON.parse(window.localStorage.getItem("dine-link-calendar-reminders") ?? "[]") as string[]); } catch { return new Set<string>(); } });
  useEffect(() => { window.localStorage.setItem("dine-link-calendar-reminders", JSON.stringify([...reminders])); }, [reminders]);
  const scoped = items.filter((item) => scope === "全部" || item.role === scope);
  const monthItems = scoped.filter((item) => { const date = new Date(item.event.eventStartAt); return date.getMonth() === cursor.getMonth() && date.getFullYear() === cursor.getFullYear(); });
  return <div className="mt-4 rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="pressable rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold">‹</button><p className="text-sm font-black">{cursor.toLocaleString("zh-TW", { year: "numeric", month: "long" })}</p><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="pressable rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold">›</button></div><div className="mt-3 flex gap-2">{(["全部", "主辦", "參與"] as const).map((item) => <button key={item} onClick={() => setScope(item)} className={`pressable rounded-full px-3 py-1.5 text-xs font-bold ${scope === item ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div><p className="mt-3 text-[10px] leading-relaxed text-slate-400">「提醒標記」會儲存在這台裝置，並在本頁呈現；飯局前推播通知由系統既有通知流程處理。</p><div className="mt-4 space-y-2">{monthItems.map(({ event, role }) => { const start = new Date(event.eventStartAt); const isSoon = start.getTime() - Date.now() > 0 && start.getTime() - Date.now() < 48 * 60 * 60 * 1000; const active = reminders.has(event.id); return <div key={event.id} className="rounded-2xl border border-slate-100 p-3"><div className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-emerald-600" /><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-800">{event.title}</p><p className="mt-1 text-[11px] text-slate-500">{dateText(event.eventStartAt)} · {role}</p>{isSoon && <p className="mt-1 text-[10px] font-bold text-orange-600">即將開始</p>}</div></div><button onClick={() => setReminders((current) => { const next = new Set(current); active ? next.delete(event.id) : next.add(event.id); return next; })} className={`pressable mt-2 w-full rounded-xl py-2 text-[11px] font-bold ${active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>{active ? "已標記提醒（本裝置）" : "標記提醒（本裝置）"}</button></div>; })}{monthItems.length === 0 && <Empty title="本月沒有符合篩選的飯局" text="切換月份或分類，即可查看其他飯局行程。" />}</div></div>;
}

function NotificationView({ items, markRead }: { items: Notification[]; markRead: (id: string) => void }) {
  const open = (item: Notification) => { if (!item.readAt) void markRead(item.id); if (item.eventId) { window.history.pushState({}, "", `/?tab=my-events&eventId=${encodeURIComponent(item.eventId)}`); window.dispatchEvent(new Event("dine-link:navigate")); } };
  return <div className="mt-4 space-y-3">{items.length === 0 && <Empty title="目前沒有通知" text="新的申請、審核結果與成員變動會顯示在這裡。" />}{items.map((item) => <button key={item.id} onClick={() => open(item)} className={`pressable w-full rounded-[20px] p-4 text-left shadow-sm ${item.readAt ? "bg-white" : "border border-emerald-100 bg-emerald-50"}`}><div className="flex gap-3"><Bell className={`h-5 w-5 ${item.readAt ? "text-slate-400" : "text-emerald-600"}`} /><div><p className="text-sm font-black text-slate-900">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p><p className="mt-2 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString("zh-TW")}{item.eventId ? " · 點擊前往對應飯局" : !item.readAt ? " · 點選標示已讀" : ""}</p></div></div></button>)}</div>;
}

function ReviewView({ tasks, onOpen }: { tasks: ReviewTask[]; onOpen: (task: ReviewTask) => void }) { return <div className="mt-4 space-y-3">{tasks.length === 0 && <Empty title="目前沒有待評價飯局" text="飯局結束且雙方出席後，系統會在此提醒你留下出席與互動評價。" />}{tasks.map((task) => <div key={`${task.event.id}:${task.peer.id}`} className="rounded-[24px] bg-white p-4 shadow-sm"><p className="text-sm font-black text-slate-900">{task.event.title}</p><p className="mt-1 text-xs text-slate-500">與 {task.peer.displayName} 的飯後評價 · {dateText(task.event.eventStartAt)}</p><button onClick={() => onOpen(task)} className="pressable mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white">填寫出席評價</button></div>)}</div>; }
function ReviewDialog({ task, scores, setScores, attendanceNote, setAttendanceNote, onClose, onSubmit }: { task: ReviewTask; scores: { punctuality: number; politeness: number; fun: number }; setScores: (value: { punctuality: number; politeness: number; fun: number }) => void; attendanceNote: string; setAttendanceNote: (value: string) => void; onClose: () => void; onSubmit: () => void }) { const rows: Array<[keyof typeof scores, string]> = [["punctuality", "準時"], ["politeness", "禮貌"], ["fun", "互動感受"]]; return <div className="absolute inset-0 z-50 flex items-end bg-slate-950/40 p-4"><div className="w-full rounded-[28px] bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-lg font-black">評價 {task.peer.displayName}</p><p className="mt-1 text-xs text-slate-500">僅限已完成且雙方出席的飯局。</p></div><button onClick={onClose} className="rounded-full bg-slate-100 p-2"><X className="h-4 w-4" /></button></div><div className="mt-4 space-y-3">{rows.map(([key, label]) => <div key={key}><p className="text-xs font-bold text-slate-700">{label}：{scores[key]} / 5</p><div className="mt-1 grid grid-cols-5 gap-1.5">{[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setScores({ ...scores, [key]: value })} className={`pressable rounded-lg py-2 text-xs font-black ${scores[key] >= value ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>{value}</button>)}</div></div>)}</div><label className="mt-4 block text-xs font-bold text-slate-700">出席註記<textarea value={attendanceNote} onChange={(event) => setAttendanceNote(event.target.value)} maxLength={500} placeholder="例如：準時抵達、互動愉快。" className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-violet-500" /></label><p className="mt-2 text-[11px] text-slate-500">評價會彙整為信用 rating，註記僅用於本次飯局的出席紀錄。</p><button onClick={onSubmit} className="pressable mt-4 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white">送出評價</button></div></div>; }
