import type { Metadata } from "next";
import Link from "next/link";
import { getPublicCityEvents } from "@/lib/public-events";
import { eventDescription, publicEventPath } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const { city, events } = await getPublicCityEvents(slug);
  if (!city || events.length === 0) return { title: "找不到公開飯局", robots: { index: false, follow: false } };
  const path = `/explore/city/${city.slug}`;
  const description = `探索 ${city.label} 的公開約飯與聚餐活動，查看真實時間、餐廳與完整集合地址。`;
  return { title: `${city.label} 約飯與聚餐`, description, alternates: { canonical: path }, openGraph: { title: `${city.label} 約飯與聚餐｜${SITE_NAME}`, description, url: path }, twitter: { card: "summary_large_image", title: `${city.label} 約飯與聚餐｜${SITE_NAME}`, description } };
}

export default async function CityExplorePage({ params }: Props) {
  const { city: slug } = await params;
  const { city, events } = await getPublicCityEvents(slug);
  if (!city || events.length === 0) return <main className="mx-auto min-h-screen max-w-2xl px-5 py-12"><h1 className="text-3xl font-black">目前沒有可公開的飯局</h1><Link className="mt-6 inline-block text-violet-700 underline" href="/">回到 DineLink 探索</Link></main>;
  return <main className="mx-auto min-h-screen max-w-2xl bg-[#fbf9ff] px-5 py-10 text-slate-900"><header><p className="text-xs font-bold tracking-[.18em] text-violet-600">CITY DINING GUIDE</p><h1 className="mt-2 text-3xl font-black">{city.label} 約飯與聚餐</h1><p className="mt-3 text-sm leading-6 text-slate-600">瀏覽近期公開飯局；申請加入前，請在 DineLink 查看主辦人規則與完整資訊。</p></header><section className="mt-7 space-y-4" aria-label={`${city.label} 公開飯局`}>{events.map(publicEvent => <article key={publicEvent.event.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100"><h2 className="text-xl font-black"><Link href={publicEventPath(publicEvent.event.id)}>{publicEvent.event.title}</Link></h2><p className="mt-2 text-sm text-slate-600">{eventDescription(publicEvent)}</p><Link className="mt-4 inline-flex font-bold text-violet-700 underline" href={publicEventPath(publicEvent.event.id)}>查看飯局詳情</Link></article>)}</section></main>;
}
