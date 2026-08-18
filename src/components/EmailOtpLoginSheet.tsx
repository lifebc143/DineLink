"use client";

import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { loginRedirectHref } from "@/lib/mobile-login";
import InAppBrowserLoginNotice from "./InAppBrowserLoginNotice";

type Step = "email" | "code";
const DEMO_OTP_CODE = "123456";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export default function EmailOtpLoginSheet({ onClose, onLoginSuccess }: { onClose: () => void; onLoginSuccess: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [demoVerified, setDemoVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginHref, setLoginHref] = useState("/api/auth/login");
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));

  useEffect(() => setLoginHref(loginRedirectHref(window.location.origin)), []);

  const showCodeStep = () => {
    if (emailIsValid) {
      setCode("");
      setDemoVerified(false);
      setStep("code");
    }
  };

  const completeDemoLogin = async () => {
    if (code !== DEMO_OTP_CODE || submitting) return;
    setSubmitting(true);
    setLoginError("");
    try {
      const response = await fetch("/api/auth/mock-email-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizeEmail(email), code }),
      });
      if (!response.ok) throw new Error("Mock login failed");
      setDemoVerified(true);
      onLoginSuccess();
    } catch {
      setLoginError("測試登入暫時無法啟用，請重新整理頁面後再試一次。");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/50 p-0 backdrop-blur-sm" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="email-otp-login-title" className="page-enter max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto rounded-t-[32px] bg-[#fcfbff] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"><div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" /><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[0.18em] text-violet-600">PASSWORDLESS LOGIN · TEST MODE</p><h2 id="email-otp-login-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">使用 Email 登入</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">目前為測試模式：不會寄送 Email，可用示範碼體驗 6 位數輸入與登入後流程。</p></div><button type="button" aria-label="關閉 Email 登入" onClick={onClose} className="pressable grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button></div><InAppBrowserLoginNotice />{step === "email" ? <div className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Email 地址（僅用於測試帳號）</span><span className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3.5 py-3 shadow-sm focus-within:border-violet-400"><Mail className="h-4 w-4 text-violet-600" /><input aria-label="Email 地址" type="email" autoComplete="email" autoCapitalize="none" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400" /></span></label><button type="button" disabled={!emailIsValid} onClick={showCodeStep} className="pressable w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">繼續使用示範驗證碼</button><div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950"><ShieldCheck className="mr-1 inline h-4 w-4 text-amber-700" /><b>測試模式不會寄送真實郵件。</b> 請在下一步輸入示範碼 <b>{DEMO_OTP_CODE}</b>；系統會建立隔離的測試帳號，方便驗證登入後流程。</div></div> : <div className="mt-5 space-y-4"><button type="button" onClick={() => { setStep("email"); setCode(""); setDemoVerified(false); setLoginError(""); }} className="pressable inline-flex items-center gap-1 text-xs font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />更換 Email</button><div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-950"><p className="font-bold">測試模式：不會寄送驗證碼至 Email</p><p className="mt-0.5 break-all text-amber-900">{normalizeEmail(email)} 僅用於建立隔離測試帳號。</p><p className="mt-2 font-bold">請輸入示範驗證碼：{DEMO_OTP_CODE}</p></div><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">6 位數示範驗證碼</span><span className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3.5 shadow-sm focus-within:border-violet-500"><KeyRound className="h-5 w-5 text-violet-600" /><input aria-label="6 位數驗證碼" value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setDemoVerified(false); setLoginError(""); }} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder={DEMO_OTP_CODE} className="min-w-0 flex-1 bg-transparent text-center text-2xl font-black tracking-[0.35em] text-slate-950 outline-none placeholder:tracking-[0.2em] placeholder:text-slate-300" /></span></label><p className="text-center text-xs leading-relaxed text-slate-500">正式寄信啟用後，iPhone 收到驗證碼郵件時可由鍵盤上方自動帶入。</p>{code.length === 6 && <p role="status" className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-3 text-xs font-bold ${code === DEMO_OTP_CODE ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}><CheckCircle2 className="h-4 w-4" />{code === DEMO_OTP_CODE ? "示範碼正確，可以登入隔離測試帳號。" : `測試模式請輸入示範碼 ${DEMO_OTP_CODE}。`}</p>}{loginError && <p role="alert" className="rounded-2xl bg-rose-50 px-3.5 py-3 text-xs font-bold text-rose-800">{loginError}</p>}{demoVerified && <p role="status" className="rounded-2xl bg-emerald-600 px-3.5 py-3 text-xs font-bold text-white">測試登入成功，正在前往 DineLink。</p>}<button type="button" disabled={code !== DEMO_OTP_CODE || demoVerified || submitting} onClick={completeDemoLogin} className="pressable w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "登入中…" : demoVerified ? "測試登入完成" : "登入測試帳號"}</button><p className="text-center text-xs font-bold text-slate-500">測試模式無法重新寄信，因為尚未啟用郵件服務。</p></div>}<div className="mt-5 border-t border-slate-100 pt-4 text-center"><p className="text-xs text-slate-500">若偏好 Apple、Google 等第三方登入，會以全頁安全轉址完成。</p><a href={loginHref} className="pressable mt-2 inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">使用其他方式登入</a></div></section></div>;
}
