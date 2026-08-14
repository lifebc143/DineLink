"use client";

import { ArrowLeft, CalendarDays, ClipboardList, ShieldCheck, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

type MemberAction = "verify" | "reject_verification" | "suspend" | "restore" | "deactivate";
type Member = { id: string; displayName: string; role: "member" | "moderator" | "admin"; verificationStatus: "unverified" | "pending" | "verified" | "rejected"; accountStatus: "active" | "suspended" | "deactivated"; suspensionReason: string | null; createdAt: string };
type Metrics = { registeredMembers: number; verifiedMembers: number; pendingVerification: number; restrictedMembers: number; totalEvents: number; publishedEvents: number; totalApplications: number; pendingApplications: number; totalAttendances: number; noShowCount: number };
type Overview = { metrics: Metrics; recentMembers: Member[] };

function Metric({ label, value, tone = "violet" }: { label: string; value: number; tone?: "violet" | "emerald" | "amber" | "rose" }) {
  const tones = { violet: "bg-violet-50 text-violet-900", emerald: "bg-emerald-50 text-emerald-900", amber: "bg-amber-50 text-amber-900", rose: "bg-rose-50 text-rose-900" };
  return <div className={`rounded-2xl p-3.5 ${tones[tone]}`}><p className="text-2xl font-black tabular-nums">{(value ?? 0).toLocaleString("zh-TW")}</p><p className="mt-1 text-[11px] font-bold opacity-70">{label}</p></div>;
}

const verificationLabel = (member: Member) => member.role === "admin" && member.verificationStatus === "verified" ? "管理員已授權" : ({ verified: "已驗證", pending: "待審核", rejected: "未通過", unverified: "未驗證" }[member.verificationStatus]);
const accountLabel = (status: Member["accountStatus"]) => ({ active: "資格正常", suspended: "已停權", deactivated: "已取消資格" }[status]);

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "forbidden" | "error" | "ready">("loading");
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const load = useCallback(async () => {
    setState("loading"); setActionError("");
    const response = await fetch("/api/admin/overview", { cache: "no-store" }).catch(() => null);
    if (!response) return setState("error");
    if (response.status === 401 || response.status === 403) return setState("forbidden");
    if (!response.ok) return setState("error");
    const payload = await response.json() as Partial<Overview>;
    if (!payload.metrics || !Array.isArray(payload.recentMembers)) return setState("error");
    setOverview(payload as Overview); setState("ready");
  }, []);
  useEffect(() => { void load(); }, [load]);
  const handleMemberAction = async (member: Member, action: MemberAction) => {
    const labels: Record<MemberAction, string> = { verify: "核准驗證", reject_verification: "拒絕驗證", suspend: "停權", restore: "恢復資格", deactivate: "取消資格" };
    const restricted = action === "suspend" || action === "deactivate";
    if (restricted && !window.confirm(`確定要${labels[action]}「${member.displayName}」嗎？此處置會立即限制帳號使用受保護功能。`)) return;
    const reason = restricted ? window.prompt(`${labels[action]}原因（會保留於管理稽核紀錄）：`, action === "suspend" ? "違反平台使用規範" : "依平台使用規範取消資格") : undefined;
    if (restricted && reason === null) return;
    setActioning(`${member.id}:${action}`); setActionError("");
    const response = await fetch(`/api/admin/members/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) }).catch(() => null);
    setActioning(null);
    if (!response?.ok) { setActionError("會員處置未完成，請稍後再試。"); return; }
    await load();
  };
  const memberActions = (member: Member) => {
    if (member.role === "admin") return <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-violet-700">管理員帳號已授權且受保護：不可由同一後台自行停權或取消資格；如需變更管理權限，請由另一位管理員或依專案擁有者流程處理。</p>;
    return <div className="mt-2 flex flex-wrap gap-1.5">
      {member.verificationStatus !== "verified" && <button disabled={!!actioning} onClick={() => void handleMemberAction(member, "verify")} className="pressable rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50">核准驗證</button>}
      {member.verificationStatus === "pending" && <button disabled={!!actioning} onClick={() => void handleMemberAction(member, "reject_verification")} className="pressable rounded-lg bg-amber-100 px-2.5 py-1.5 text-[10px] font-bold text-amber-800 disabled:opacity-50">拒絕驗證</button>}
      {member.accountStatus === "active" ? <><button disabled={!!actioning} onClick={() => void handleMemberAction(member, "suspend")} className="pressable rounded-lg bg-rose-100 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 disabled:opacity-50">停權</button><button disabled={!!actioning} onClick={() => void handleMemberAction(member, "deactivate")} className="pressable rounded-lg bg-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-50">取消資格</button></> : <button disabled={!!actioning} onClick={() => void handleMemberAction(member, "restore")} className="pressable rounded-lg bg-violet-100 px-2.5 py-1.5 text-[10px] font-bold text-violet-700 disabled:opacity-50">恢復資格</button>}
    </div>;
  };
  return <section className="page-enter mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
    <button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button>
    <header className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_18px_45px_rgba(27,12,62,0.25)]"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[0.2em] text-violet-200">ADMIN CONSOLE</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">營運後台</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-violet-100">僅管理員可存取的會員與飯局營運摘要。帳號處置採停權或取消資格，不直接刪除資料。</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/25 text-violet-100"><ShieldCheck className="h-5 w-5" /></span></div></header>
    {state === "loading" && <div className="mt-4 rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">正在整理營運資料…</div>}
    {state === "forbidden" && <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm leading-relaxed text-rose-800"><p className="font-black">此帳號沒有管理後台權限</p><p className="mt-1">請由既有管理員將你的角色設定為 admin 後再試。</p></div>}
    {state === "error" && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">目前無法載入營運摘要，請稍後重新整理。</div>}
    {state === "ready" && overview && <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5"><Metric label="已註冊會員" value={overview.metrics.registeredMembers} /><Metric label="已驗證會員" value={overview.metrics.verifiedMembers} tone="emerald" /><Metric label="待驗證審核" value={overview.metrics.pendingVerification} tone="amber" /><Metric label="受限制帳號" value={overview.metrics.restrictedMembers} tone="rose" /><Metric label="已發布飯局" value={overview.metrics.publishedEvents} tone="emerald" /></div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="飯局總數" value={overview.metrics.totalEvents} tone="amber" /><Metric label="申請總數" value={overview.metrics.totalApplications} /><Metric label="待審核申請" value={overview.metrics.pendingApplications} tone="amber" /><Metric label="爽約紀錄" value={overview.metrics.noShowCount} tone="rose" /></div>
      {actionError && <p role="alert" className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{actionError}</p>}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.45fr_1fr]"><div className="rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-600" /><h2 className="text-sm font-black text-slate-900">會員管理</h2></div><span className="text-[10px] font-bold text-slate-400">最近 {overview.recentMembers.length} 筆</span></div><p className="mt-1 text-xs leading-relaxed text-slate-500">核准驗證後會標示已驗證；違規帳號可停權或取消資格，並保留處置理由。</p><div className="mt-3 space-y-2">{overview.recentMembers.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">目前尚無會員資料。</p> : overview.recentMembers.map((member) => <div key={member.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-800">{member.displayName}</p><p className="mt-0.5 text-[10px] text-slate-500">{new Date(member.createdAt).toLocaleDateString("zh-TW")} · {accountLabel(member.accountStatus)}</p>{member.suspensionReason && <p className="mt-1 text-[10px] text-rose-700">原因：{member.suspensionReason}</p>}</div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{verificationLabel(member)}</span></div>{memberActions(member)}</div>)}</div></div><div className="rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-emerald-600" /><h2 className="text-sm font-black text-slate-900">營運與資格規範</h2></div><div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600"><p className="rounded-xl bg-amber-50 p-3"><CalendarDays className="mr-1 inline h-3.5 w-3.5 text-amber-700" />目前有 <b>{overview.metrics.pendingVerification}</b> 位會員等待驗證審核，以及 <b>{overview.metrics.pendingApplications}</b> 筆待主辦人審核的申請。</p><p className="rounded-xl bg-rose-50 p-3">平台得依騷擾、詐騙、危害安全或其他違反使用規範情形，限制或取消帳號資格。</p><p className="rounded-xl bg-violet-50 p-3">後台僅提供必要營運摘要與顯示名稱，不顯示會員 email 或私人聊天內容。</p></div></div></div>
    </>}
  </section>;
}
