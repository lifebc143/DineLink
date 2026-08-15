import type { Metadata } from "next";
import Link from "next/link";
import { getPublicTopicEvents } from "@/lib/public-events";
import { eventDescription, publicEventPath } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: rawTopic } = await params;
  const { topic, events } = await getPublicTopicEvents(decodeURIComponent(rawTopic));
  if (!topic || events.length === 0) return { title: "找不到公開飯局", robots: { index: false, follow: false } };
  const path = `/explore/topic/${encodeURIComponent(topic)}`;
  const description = `探索「${topic}」主題的公開約飯與聚餐活動，查看真實時間、餐廳與完整集合地址。`;
  return { title: `${topic} 約飯與聚餐`, description, alternates: { canonical: path }, openGraph: { title: `${topic} 約飯與聚餐｜${SITE_NAME}`, description, url: path }, twitter: { card: "summary_large_image", title: `${topic} 約飯與聚餐｜${SITE_NAME}`, description } };
}

export default async function TopicExplorePage({ params }: Props) {
  const { topic: rawTopic } = await params;
  const { topic, events } = await getPublicTopicEvents(decodeURIComponent(rawTopic));
  if (!topic || events.length === 0) return <main className="mx-auto min-h-screen max-w-2xl px-5 py-12"><h1 className="text-3xl font-black">目前沒有可公開的飯局</h1><Link className="mt-6 inline-block text-violet-700 underline" href="/">回到 DineLink 探索</Link></main>;
  return <main className="mx-auto min-h-screen max-w-2xl bg-[#fbf9ff] px-5 py-10 text-slate-900"><header><p className="text-xs font-bold tracking-[.18em] text-violet-600">DINING TOPIC</p><h1 className="mt-2 text-3xl font-black">{topic} 約飯與聚餐</h1><p className="mt-3 text-sm leading-6 text-slate-600">探索由主辦人公開的真實飯局；請在申請前閱讀完整時間、餐廳與集合資訊。</p></header><section className="mt-7 space-y-4" aria-label={`${topic} 公開飯局`}>{events.map(publicEvent => <article key={publicEvent.event.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100"><h2 className="text-xl font-black"><Link href={publicEventPath(publicEvent.event.id)}>{publicEvent.event.title}</Link></h2><p className="mt-2 text-sm text-slate-600">{eventDescription(publicEvent)}</p><Link className="mt-4 inline-flex font-bold text-violet-700 underline" href={publicEventPath(publicEvent.event.id)}>查看飯局詳情</Link></article>)}</section></main>;
}
