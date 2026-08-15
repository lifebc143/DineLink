"use client";

import { ArchiveRestore, DatabaseBackup, Download, Play, ShieldAlert, TimerReset } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

type Settings = { dayOfMonth: number; hourTaipei: number; retentionCount: number; enabled: boolean };
type Snapshot = { id: string; scheduleKey: string; status: "succeeded"; trigger: "scheduled" | "manual"; checksumSha256: string | null; byteSize: number | null; tableCounts: Record<string, number>; createdAt: string; completedAt: string | null };
type RestoreRequest = { id: string; snapshotId: string; reason: string; status: "pending" | "cancelled" | "reviewed"; createdAt: string };
type Payload = { settings: Settings; snapshots: Snapshot[]; restoreRequests: RestoreRequest[]; coverage: { included: string[]; excluded: string[]; timezone: string } };

export default function BackupManagementPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [form, setForm] = useState<Settings>({ dayOfMonth: 1, hourTaipei: 3, retentionCount: 3, enabled: true });
  const [state, setState] = useState<"loading" | "ready" | "error" | "saving">("loading");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setState("loading");
    const response = await fetch("/api/admin/backups", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return setState("error");
    const payload = await response.json() as Payload;
    setData(payload); setForm(payload.settings); setState("ready");
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    setState("saving"); setMessage("");
    const response = await fetch("/api/admin/backups", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).catch(() => null);
    if (!response?.ok) { setMessage("備份設定未儲存，請稍後再試。"); setState("ready"); return; }
    setMessage("每月備份設定已儲存。"); await load();
  };
  const createNow = async () => {
    if (!window.confirm("確定立即建立一次完整應用資料快照嗎？此操作會建立新的 S3 備份與管理員通知。")) return;
    setState("saving"); setMessage("");
    const response = await fetch("/api/admin/backups/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "CREATE_SNAPSHOT" }) }).catch(() => null);
    if (!response?.ok) { setMessage("立即快照未完成，請稍後再試。"); setState("ready"); return; }
    setMessage("立即快照已建立，管理員通知已送出。"); await load();
  };
  const requestRestore = async (snapshot: Snapshot) => {
    if (!window.confirm("資料還原申請不會立即覆寫資料，但會通知所有管理員審閱。是否繼續？")) return;
    const reason = window.prompt("請說明還原原因（至少 10 個字）：");
    if (!reason) return;
    setState("saving"); setMessage("");
    const response = await fetch(`/api/admin/backups/${snapshot.id}/restore-request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "REQUEST_RESTORE", reason }) }).catch(() => null);
    if (!response?.ok) { setMessage("還原申請未建立；請確認原因至少 10 個字後重試。"); setState("ready"); return; }
    setMessage("還原申請已建立，尚未對任何資料執行覆寫。"); await load();
  };
  if (state === "loading") return <div className="mt-4 rounded-[24px] bg-white p-4 text-xs font-semibold text-slate-500 shadow-sm">正在讀取備份設定…</div>;
  if (state === "error") return <div className="mt-4 rounded-[24px] border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800">目前無法讀取備份設定。</div>;
  return <section className="mt-4 rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-start gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><DatabaseBackup className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-slate-900">每月應用資料備份</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">快照包含 DineLink 資料庫的會員、飯局、申請、出席、聊天室、評價與通知；時區固定為台灣時間。</p></div></div>
    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3"><label className="text-[10px] font-bold text-slate-600">每月日期<select aria-label="每月備份日期" value={form.dayOfMonth} onChange={(event) => setForm({ ...form, dayOfMonth: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">{Array.from({ length: 28 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} 日</option>)}</select></label><label className="text-[10px] font-bold text-slate-600">台灣時間<select aria-label="每月備份時間" value={form.hourTaipei} onChange={(event) => setForm({ ...form, hourTaipei: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label><label className="text-[10px] font-bold text-slate-600">保留份數<select aria-label="備份保留份數" value={form.retentionCount} onChange={(event) => setForm({ ...form, retentionCount: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">{[1, 2, 3, 6, 12].map((value) => <option key={value} value={value}>{value} 份</option>)}</select></label></div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />啟用每月自動快照</label><div className="flex gap-2"><button disabled={state === "saving"} onClick={() => void createNow()} className="pressable rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800 disabled:opacity-50"><Play className="mr-1 inline h-3 w-3" />立即快照</button><button disabled={state === "saving"} onClick={() => void save()} className="pressable rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{state === "saving" ? "儲存中…" : "儲存設定"}</button></div></div>
    {message && <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">{message}</p>}
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3"><div className="flex gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" /><p className="text-[11px] leading-relaxed text-violet-800">本功能只備份應用資料，不包含網站程式碼、Secrets、網域與平台整合。完整網站備份請使用官方備份工具；還原資料前必須由管理員另行確認。</p></div></div>
    <div className="mt-4"><div className="flex items-center gap-2"><ArchiveRestore className="h-4 w-4 text-emerald-600" /><h3 className="text-xs font-black text-slate-900">可用備份歷程與完整性</h3></div>{data?.snapshots.length ? <div className="mt-2 grid grid-cols-3 gap-2">{data.snapshots.slice(0, 3).reverse().map((snapshot) => { const maxBytes = Math.max(...data.snapshots.map((item) => item.byteSize || 1)); const tables = Object.values(snapshot.tableCounts).reduce((sum, count) => sum + count, 0); return <div key={`${snapshot.id}-trend`} className="rounded-xl bg-slate-50 p-2"><div className="flex h-12 items-end"><div className="w-full rounded-t-lg bg-emerald-400" style={{ height: `${Math.max(12, ((snapshot.byteSize || 0) / maxBytes) * 100)}%` }} /></div><p className="mt-1 text-[10px] font-bold text-slate-700">{snapshot.scheduleKey.slice(0, 7)}</p><p className="text-[9px] text-slate-500">{tables} 筆 · SHA-256 ✓</p></div>; })}</div> : null}<div className="mt-2 space-y-2">{data?.snapshots.length ? data.snapshots.map((snapshot) => <div key={snapshot.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-800">{snapshot.scheduleKey} 應用資料快照</p><p className="mt-0.5 text-[10px] text-slate-500">{new Date(snapshot.createdAt).toLocaleString("zh-TW")} · {snapshot.trigger === "manual" ? "手動" : "月度"} · {snapshot.byteSize ? `${Math.ceil(snapshot.byteSize / 1024)} KB` : "大小整理中"}</p><p className="mt-0.5 text-[9px] text-emerald-700">SHA-256：{snapshot.checksumSha256 ? `${snapshot.checksumSha256.slice(0, 12)}…` : "整理中"}</p></div><a className="pressable rounded-lg bg-white px-2.5 py-2 text-[10px] font-bold text-slate-700 shadow-sm" href={`/api/admin/backups/${snapshot.id}/download`}><Download className="mr-1 inline h-3 w-3" />下載</a></div><button disabled={state === "saving"} onClick={() => void requestRestore(snapshot)} className="pressable mt-2 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[10px] font-bold text-amber-800 disabled:opacity-50"><TimerReset className="mr-1 inline h-3 w-3" />申請手動還原</button></div>) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">尚無成功的月度快照；首次排程執行後會顯示於此。</p>}</div></div>
    {(data?.restoreRequests?.length ?? 0) > 0 ? <div className="mt-3 rounded-2xl bg-amber-50 p-3"><p className="text-xs font-black text-amber-900">最近還原申請（不會自動覆寫資料）</p>{data?.restoreRequests?.map((request) => <p key={request.id} className="mt-1 text-[10px] leading-relaxed text-amber-800">{new Date(request.createdAt).toLocaleString("zh-TW")} · {request.status} · {request.reason}</p>)}</div> : null}
  </section>;
}
