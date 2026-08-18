"use client";

import React, { useEffect, useState } from "react";

type ProfilePayload = {
  bio: string | null;
  gender: "woman" | "man" | "non_binary" | "prefer_not_to_say";
  ageRange: string | null;
  interestTags: string[];
  preferredArea: string | null;
  trust: { completionPercent: number; completedCount: number; totalCount: number; missingFields: string[]; requiredMissing: string[]; verificationLabel: string; canApply: boolean; isMockAccount: boolean };
};

const AGE_RANGES = ["18-24", "25-34", "35-44", "45+", "不公開"];
const GENDER_OPTIONS = [
  ["prefer_not_to_say", "不公開"],
  ["woman", "女性"],
  ["man", "男性"],
  ["non_binary", "非二元"],
] as const;

export default function ProfileTrustEditor() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<ProfilePayload["gender"]>("prefer_not_to_say");
  const [ageRange, setAgeRange] = useState("");
  const [interests, setInterests] = useState("");
  const [preferredArea, setPreferredArea] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hydrate = (value: ProfilePayload) => {
    setProfile(value); setBio(value.bio ?? ""); setGender(value.gender); setAgeRange(value.ageRange ?? ""); setInterests(value.interestTags.join("、")); setPreferredArea(value.preferredArea ?? "");
  };
  useEffect(() => { void fetch("/api/me/profile", { cache: "no-store" }).then(async (response) => { if (!response.ok) return; const payload = await response.json() as { profile: ProfilePayload }; hydrate(payload.profile); }).catch(() => undefined); }, []);

  if (!profile) return <div className="mt-3 rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-xs font-semibold text-violet-700">登入後可補齊信任資料，讓主辦人更容易認識你。</div>;

  const save = async () => {
    const interestTags = [...new Set(interests.split(/[、,，]/).map((item) => item.trim()).filter(Boolean))].slice(0, 6);
    if (bio.trim().length < 12 || !ageRange || interestTags.length === 0 || preferredArea.trim().length < 2) { setMessage("請補齊至少 12 字自我介紹、年齡區間、至少一個興趣與常用活動區域。" ); return; }
    setSaving(true); setMessage("");
    const response = await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio: bio.trim(), gender, ageRange, interestTags, preferredArea: preferredArea.trim() }) }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { profile?: ProfilePayload } | null;
    setSaving(false);
    if (!response?.ok || !payload?.profile) { setMessage("資料尚未儲存，請稍後再試。" ); return; }
    hydrate(payload.profile); setMessage("信任資料已更新。" ); setOpen(false);
  };

  const trust = profile.trust;
  return <section aria-label="申請前信任資料" className="mt-3 rounded-[24px] border border-fuchsia-100 bg-fuchsia-50/80 p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-fuchsia-950">申請前信任資料</p><p className="mt-1 text-xs leading-relaxed text-fuchsia-800">公開頭像、自我介紹、年齡區間、興趣與活動區域能協助主辦人更安心審核。</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${trust.canApply ? "bg-emerald-100 text-emerald-700" : "bg-white text-fuchsia-700"}`}>{trust.completionPercent}% 完成</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all" style={{ width: `${trust.completionPercent}%` }} /></div>
    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-fuchsia-800">{trust.canApply ? `已符合飯局申請門檻 · ${trust.verificationLabel}` : `申請前請補齊：${trust.requiredMissing.join("、")}`}</p>
    <button type="button" onClick={() => setOpen((value) => !value)} className="pressable mt-3 w-full rounded-xl bg-white py-2.5 text-xs font-black text-fuchsia-800 shadow-sm">{open ? "收起資料編輯" : "補齊我的信任資料"}</button>
    {open && <div className="mt-3 space-y-3 rounded-2xl bg-white p-3"><label className="block text-xs font-bold text-slate-700">自我介紹<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} placeholder="例如：喜歡探索新餐廳，也很願意傾聽與認識新朋友。" className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-fuchsia-500" /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-700">年齡區間<select value={ageRange} onChange={(event) => setAgeRange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-normal"><option value="">請選擇</option>{AGE_RANGES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-bold text-slate-700">性別公開偏好<select value={gender} onChange={(event) => setGender(event.target.value as ProfilePayload["gender"])} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-normal">{GENDER_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label className="block text-xs font-bold text-slate-700">興趣標籤<input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="例如：咖啡、旅行、電影" className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-normal" /></label><label className="block text-xs font-bold text-slate-700">常用活動區域<input value={preferredArea} onChange={(event) => setPreferredArea(event.target.value)} placeholder="例如：台北信義、大安" className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-normal" /></label>{message && <p role="status" className={`rounded-xl p-2.5 text-xs font-bold ${message.includes("已更新") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p>}<button type="button" disabled={saving} onClick={() => void save()} className="pressable w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "儲存中…" : "儲存信任資料"}</button></div>}
  </section>;
}
