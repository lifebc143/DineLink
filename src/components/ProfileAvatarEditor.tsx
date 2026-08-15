"use client";

import { Camera, LoaderCircle, Upload, X } from "lucide-react";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AvatarUser = { id?: string; displayName?: string | null; avatarUrl?: string | null };

function initialOf(displayName?: string | null) {
  return displayName?.trim().slice(0, 1).toUpperCase() || "你";
}

async function cropToCircleSource(source: string, zoom: number) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const size = 512;
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob) throw new Error("CROP_FAILED");
  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export default function ProfileAvatarEditor({ user, onUpdated }: { user: AvatarUser; onUpdated: (updated: AvatarUser) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setSuccess("");
    if (!ALLOWED_TYPES.has(file.type)) { setError("請選擇 JPG、PNG 或 WebP 格式的圖片。"); return; }
    if (file.size > MAX_AVATAR_BYTES) { setError("圖片大小不可超過 5MB，請選擇較小的圖片。 "); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setZoom(1);
  };

  const upload = async () => {
    if (!previewUrl || uploading) return;
    setUploading(true); setError("");
    try {
      const avatar = await cropToCircleSource(previewUrl, zoom);
      const formData = new FormData();
      formData.append("avatar", avatar);
      const response = await fetch("/api/me/avatar", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({})) as { user?: AvatarUser; error?: string };
      if (!response.ok || !payload.user?.avatarUrl) {
        const labels: Record<string, string> = { UNAUTHENTICATED: "請先登入後再更新頭像。", AVATAR_TOO_LARGE: "圖片大小不可超過 5MB。", UNSUPPORTED_IMAGE_TYPE: "僅支援 JPG、PNG 或 WebP 格式。" };
        throw new Error(labels[payload.error || ""] || "頭像更新未成功，請稍後再試。 ");
      }
      onUpdated(payload.user);
      window.dispatchEvent(new CustomEvent("dine-link:avatar-updated", { detail: payload.user }));
      setSuccess("頭像更新成功！");
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "頭像更新未成功，請稍後再試。 ");
    } finally { setUploading(false); }
  };

  const visibleAvatar = previewUrl || user.avatarUrl;
  return <>
    <button type="button" onClick={() => inputRef.current?.click()} aria-label="更換會員頭像" className="pressable relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-300 via-pink-500 to-violet-600 text-lg font-black shadow-sm">
      {visibleAvatar ? <img src={visibleAvatar} alt="目前會員頭像" className="h-full w-full object-cover" /> : initialOf(user.displayName)}
      <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-tl-lg bg-slate-950 text-white"><Camera className="h-3.5 w-3.5" /></span>
    </button>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFile} />
    {previewUrl && <div role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title" className="fixed inset-0 z-[90] flex items-end bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full rounded-[30px] bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p id="avatar-editor-title" className="text-lg font-black text-slate-950">調整會員頭像</p><p className="mt-1 text-xs leading-relaxed text-slate-500">預設會以中央圓形裁切；可調整縮放範圍，完成後將安全儲存。</p></div><button type="button" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} aria-label="關閉頭像裁切" className="pressable rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button></div><div className="mx-auto mt-5 grid h-44 w-44 place-items-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-violet-100"><img src={previewUrl} alt="頭像裁切預覽" className="h-full w-full object-cover transition-transform duration-150" style={{ transform: `scale(${zoom})` }} /></div><label className="mt-5 block text-xs font-bold text-slate-700">縮放比例 <span className="text-violet-600">{zoom.toFixed(1)}×</span><input aria-label="調整頭像縮放比例" type="range" min="1" max="2.4" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-violet-600" /></label><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={uploading} onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="pressable rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 disabled:opacity-60">取消</button><button type="button" disabled={uploading} onClick={() => void upload()} className="pressable flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white disabled:opacity-60">{uploading ? <><LoaderCircle className="h-4 w-4 animate-spin" />上傳中…</> : <><Upload className="h-4 w-4" />套用頭像</>}</button></div></div></div>}
    {error && <p role="alert" className="mt-2 text-xs font-semibold leading-relaxed text-rose-200">{error}</p>}
    {success && <p role="status" className="mt-2 text-xs font-semibold text-emerald-200">{success}</p>}
  </>;
}
