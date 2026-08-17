"use client";

import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { loginRedirectHref } from "@/lib/mobile-login";
import InAppBrowserLoginNotice from "./InAppBrowserLoginNotice";

type Step = "email" | "code";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export default function EmailOtpLoginSheet({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loginHref, setLoginHref] = useState("/api/auth/login");
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));

  useEffect(() => setLoginHref(loginRedirectHref(window.location.origin)), []);

  const showCodeStep = () => {
    if (emailIsValid) setStep("code");
  };

  return <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/50 p-0 backdrop-blur-sm" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="email-otp-login-title" className="page-enter max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto rounded-t-[32px] bg-[#fcfbff] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"><div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" /><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[0.18em] text-violet-600">PASSWORDLESS LOGIN</p><h2 id="email-otp-login-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">使用 Email 登入</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">輸入 Email 後，以 6 位數驗證碼快速登入。</p></div><button type="button" aria-label="關閉 Email 登入" onClick={onClose} className="pressable grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button></div><InAppBrowserLoginNotice />{step === "email" ? <div className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Email 地址</span><span className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3.5 py-3 shadow-sm focus-within:border-violet-400"><Mail className="h-4 w-4 text-violet-600" /><input aria-label="Email 地址" type="email" autoComplete="email" autoCapitalize="none" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400" /></span></label><button type="button" disabled={!emailIsValid} onClick={showCodeStep} className="pressable w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">寄送 6 位數驗證碼</button><div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950"><ShieldCheck className="mr-1 inline h-4 w-4 text-amber-700" /><b>目前為介面測試模式。</b> 郵件寄送服務尚未啟用；你可先測試 Email 與 iPhone 驗證碼自動帶入畫面，正式驗證碼將於寄信憑證啟用後寄送。</div></div> : <div className="mt-5 space-y-4"><button type="button" onClick={() => { setStep("email"); setCode(""); }} className="pressable inline-flex items-center gap-1 text-xs font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />更換 Email</button><div className="rounded-2xl bg-violet-50 p-3.5 text-sm leading-relaxed text-violet-950"><p className="font-bold">驗證碼將寄至</p><p className="mt-0.5 break-all font-semibold text-violet-700">{normalizeEmail(email)}</p></div><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">6 位數驗證碼</span><span className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-violet-500"><KeyRound className="h-5 w-5 text-violet-600" /><input aria-label="6 位數驗證碼" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="123456" className="min-w-0 flex-1 bg-transparent text-center text-2xl font-black tracking-[0.35em] text-slate-950 outline-none placeholder:tracking-[0.2em] placeholder:text-slate-300" /></span></label><p className="text-center text-xs leading-relaxed text-slate-500">iPhone 收到驗證碼郵件後，鍵盤上方會提供自動帶入建議。</p>{code.length === 6 && <p role="status" className="flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" />驗證碼輸入完成；啟用寄信服務後即可安全驗證登入。</p>}<button type="button" disabled={code.length !== 6} className="pressable w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">驗證並登入</button><button type="button" className="pressable w-full py-1 text-xs font-bold text-violet-700">重新寄送驗證碼（測試模式）</button></div>}<div className="mt-5 border-t border-slate-100 pt-4 text-center"><p className="text-xs text-slate-500">若偏好 Apple、Google 等第三方登入，會以全頁安全轉址完成。</p><a href={loginHref} className="pressable mt-2 inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">使用其他方式登入</a></div></section></div>;
}
