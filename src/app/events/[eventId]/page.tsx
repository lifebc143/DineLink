import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicEvent } from "@/lib/public-events";
import { eventDescription, eventJsonLd, publicEventPath } from "@/lib/seo";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type EventPageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const publicEvent = await getPublicEvent(eventId);
  if (!publicEvent) return { title: "找不到這場飯局", robots: { index: false, follow: false } };
  const { event } = publicEvent;
  const path = publicEventPath(event.id);
  const description = eventDescription(publicEvent);
  return {
    title: event.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "zh_TW",
      siteName: SITE_NAME,
      title: `${event.title}｜${SITE_NAME}`,
      description,
      url: path,
      images: [{ url: `${publicEventPath(event.id)}/opengraph-image`, width: 1200, height: 630, alt: `${event.title}｜DineLink 飯局` }],
    },
    twitter: { card: "summary_large_image", title: `${event.title}｜${SITE_NAME}`, description, images: [`${publicEventPath(event.id)}/opengraph-image`] },
  };
}

export default async function PublicEventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const publicEvent = await getPublicEvent(eventId);
  if (!publicEvent) notFound();
  const { event, host } = publicEvent;
  const startsAt = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", dateStyle: "full", timeStyle: "short", hour12: false }).format(event.eventStartAt);
  const jsonLd = eventJsonLd(publicEvent);
  return <main className="min-h-screen bg-[#17152a] px-4 py-8 font-sans text-slate-900"><article className="mx-auto max-w-2xl overflow-hidden rounded-[32px] bg-[#f7f5ff] shadow-[0_30px_100px_rgba(1,3,30,.55)]"><header className="bg-gradient-to-br from-violet-950 via-violet-700 to-fuchsia-500 p-7 text-white"><p className="text-xs font-bold tracking-[.22em] text-fuchsia-100">DINE DIFFERENT</p><h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">{event.title}</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-violet-50">{event.description || "透過 DineLink 的主辦人審核機制，和願意一起好好吃飯的人相遇。"}</p></header><div className="space-y-5 p-6"><section aria-labelledby="event-information"><h2 id="event-information" className="text-lg font-black text-slate-950">飯局資訊</h2><dl className="mt-3 grid gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm"><div><dt className="font-bold text-violet-700">時間</dt><dd className="mt-1 text-slate-700">{startsAt}（台灣時間）</dd></div><div><dt className="font-bold text-violet-700">餐廳</dt><dd className="mt-1 text-slate-700">{event.restaurantName || "餐廳待確認"}</dd></div><div><dt className="font-bold text-violet-700">完整地址</dt><dd className="mt-1 text-slate-700">{event.venueAddress}</dd></div><div><dt className="font-bold text-violet-700">人數上限</dt><dd className="mt-1 text-slate-700">{event.capacity} 人</dd></div></dl></section><section aria-labelledby="event-host" className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><h2 id="event-host" className="text-sm font-black text-violet-950">主辦人</h2><div className="mt-3 flex items-center gap-3">{host.avatarUrl ? <Image src={host.avatarUrl} alt={`${host.displayName} 的會員頭像`} width={48} height={48} sizes="48px" className="h-12 w-12 rounded-full object-cover" /> : <span aria-label={`${host.displayName} 的會員縮寫`} className="grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-sm font-black text-white">{host.displayName.slice(0, 1)}</span>}<p className="font-bold text-slate-900">{host.displayName}</p></div></section><Link href={`${absoluteUrl(`/?event=${encodeURIComponent(event.id)}`)}`} className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white">在 DineLink 查看並申請加入</Link></div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /></main>;
}
