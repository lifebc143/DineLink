"use client";

import { MapView } from "@/components/Map";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Crown,
  Heart,
  Home as HomeIcon,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

type Tab = "explore" | "create" | "messages" | "profile";
type ViewMode = "list" | "map";

type DiningEvent = {
  id: number;
  title: string;
  cuisine: string;
  date: string;
  time: string;
  restaurant: string;
  neighborhood: string;
  capacity: string;
  payment: string;
  paymentShort: string;
  budget: string;
  host: string;
  hostInitial: string;
  color: string;
  accent: string;
  lat: number;
  lng: number;
};

const DINING_EVENTS: DiningEvent[] = [
  {
    id: 1,
    title: "週五夜的微醺義式晚餐",
    cuisine: "義式料理 · 輕鬆聊天",
    date: "本週五",
    time: "19:30",
    restaurant: "PASTA & CO.",
    neighborhood: "信義區",
    capacity: "2 / 4 人",
    payment: "各自付",
    paymentShort: "AA 制",
    budget: "$700–900",
    host: "Mia",
    hostInitial: "M",
    color: "from-fuchsia-500 via-pink-500 to-orange-300",
    accent: "bg-fuchsia-500",
    lat: 25.0339,
    lng: 121.5645,
  },
  {
    id: 2,
    title: "日式燒肉，同桌認識新朋友",
    cuisine: "燒肉 · 4 人小聚",
    date: "週六",
    time: "18:45",
    restaurant: "YAKI NIKU LAB",
    neighborhood: "大安區",
    capacity: "3 / 4 人",
    payment: "男請女",
    paymentShort: "男請女",
    budget: "$1,000–1,200",
    host: "Kevin",
    hostInitial: "K",
    color: "from-violet-600 via-purple-500 to-indigo-400",
    accent: "bg-violet-600",
    lat: 25.033,
    lng: 121.543,
  },
  {
    id: 3,
    title: "中山巷弄早午餐散步團",
    cuisine: "早午餐 · 週末慢步調",
    date: "週日",
    time: "11:00",
    restaurant: "Morning Room",
    neighborhood: "中山區",
    capacity: "1 / 3 人",
    payment: "我請客",
    paymentShort: "我請客",
    budget: "$500–650",
    host: "Rin",
    hostInitial: "R",
    color: "from-amber-400 via-orange-400 to-rose-400",
    accent: "bg-orange-500",
    lat: 25.052,
    lng: 121.52,
  },
];

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: typeof Compass }> = [
  { id: "explore", label: "探索", icon: Compass },
  { id: "create", label: "發起飯局", icon: Plus },
  { id: "messages", label: "訊息", icon: MessageCircle },
  { id: "profile", label: "個人主頁", icon: HomeIcon },
];

function PaymentPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
      <WalletCards className="h-3 w-3 text-violet-600" />
      {label}
    </span>
  );
}

function EventCard({ event, onOpen }: { event: DiningEvent; onOpen: () => void }) {
  return (
    <article className="card-lift overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-3 shadow-[0_16px_35px_rgba(30,20,70,0.11)] backdrop-blur-xl">
      <button onClick={onOpen} className="block w-full text-left" aria-label={`查看 ${event.title} 詳情`}>
        <div className={`relative h-32 overflow-hidden rounded-[19px] bg-gradient-to-br ${event.color} p-4 text-white`}>
          <div className="absolute -right-5 -top-9 h-28 w-28 rounded-full border-[18px] border-white/15" />
          <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-white/10 blur-xl" />
          <span className="relative inline-flex rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] backdrop-blur-sm">{event.cuisine}</span>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
            <h3 className="line-clamp-2 max-w-[210px] text-lg font-black leading-tight tracking-tight">{event.title}</h3>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-black backdrop-blur-sm">{event.hostInitial}</span>
          </div>
        </div>
      </button>
      <div className="px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-pink-500" />{event.date} · {event.time}</span>
          <PaymentPill label={event.paymentShort} />
        </div>
        <p className="mt-2 flex items-center gap-1 truncate text-sm font-bold text-slate-800"><MapPin className="h-3.5 w-3.5 shrink-0 text-violet-500" />{event.restaurant} · {event.neighborhood}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500"><Users className="mr-1 inline h-3.5 w-3.5" />{event.capacity}</span>
          <button onClick={onOpen} className="pressable rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white shadow-[0_7px_16px_rgba(15,23,42,0.18)]">我要報名</button>
        </div>
      </div>
    </article>
  );
}

function ExploreMap({ onOpen }: { onOpen: (event: DiningEvent) => void }) {
  const markers = useMemo(() => DINING_EVENTS, []);
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_16px_35px_rgba(30,20,70,0.13)]">
      <MapView
        className="h-[390px]"
        initialCenter={{ lat: 25.037, lng: 121.543 }}
        initialZoom={13}
        onMapReady={(map) => {
          markers.forEach((event) => {
            const marker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: event.lat, lng: event.lng },
              title: event.title,
            });
            marker.addListener("click", () => onOpen(event));
          });
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent px-4 pb-4 pt-12">
        <p className="text-xs font-bold text-white">點選標記，即可展開附近飯局</p>
      </div>
    </div>
  );
}

function ExplorePage({ onOpen }: { onOpen: (event: DiningEvent) => void }) {
  const [view, setView] = useState<ViewMode>("list");
  const [filter, setFilter] = useState("全部");
  const filters = ["全部", "今晚", "週末", "近距離"];

  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <header className="relative overflow-hidden rounded-[30px] bg-slate-950 px-5 pb-6 pt-5 text-white shadow-[0_20px_45px_rgba(27,12,62,0.28)]">
        <div className="mesh-orb mesh-orb-one" />
        <div className="mesh-orb mesh-orb-two" />
        <div className="relative flex items-center justify-between">
          <a href="/api/auth/login" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur-md"><MapPin className="h-3.5 w-3.5 text-orange-300" />登入／台北市</a>
          <button aria-label="開啟選單" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-md"><Menu className="h-4 w-4" /></button>
        </div>
        <div className="relative mt-7">
          <p className="text-[11px] font-bold tracking-[0.24em] text-pink-200">DINE DIFFERENT</p>
          <h1 className="mt-1.5 text-[31px] font-black leading-[1.12] tracking-[-0.045em] text-white drop-shadow-sm">下一餐，<br />不只是吃飯。</h1>
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-violet-100">挑一場剛剛好的飯局，讓好好吃飯成為新的相遇方式。</p>
        </div>
        <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur-md">
          <span className="flex items-center gap-2 text-xs font-semibold text-white"><Sparkles className="h-4 w-4 text-orange-300" />今日為你挑選 6 場飯局</span>
          <ChevronRight className="h-4 w-4 text-white/70" />
        </div>
      </header>

      <div className="mt-5 flex items-center gap-2">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 shadow-sm backdrop-blur-md">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">找料理、地點或主題</span>
        </div>
        <div className="flex rounded-2xl bg-white/70 p-1 shadow-sm backdrop-blur-md">
          <button onClick={() => setView("list")} className={`pressable rounded-xl px-3 py-2 text-xs font-bold ${view === "list" ? "bg-slate-950 text-white" : "text-slate-500"}`}>列表</button>
          <button onClick={() => setView("map")} className={`pressable rounded-xl px-3 py-2 text-xs font-bold ${view === "map" ? "bg-slate-950 text-white" : "text-slate-500"}`}>地圖</button>
        </div>
      </div>

      <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`pressable shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${filter === item ? "border-fuchsia-500 bg-fuchsia-500 text-white shadow-[0_8px_18px_rgba(217,70,239,0.28)]" : "border-white/80 bg-white/65 text-slate-600"}`}>{item}</button>)}
      </div>

      <div className="mt-5">
        {view === "list" ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between px-1"><div><p className="text-[11px] font-bold tracking-[0.15em] text-violet-500">NEAR YOU</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">附近的好好飯局</h2></div><button className="text-xs font-bold text-violet-600">查看全部</button></div>
            {DINING_EVENTS.map((event) => <EventCard key={event.id} event={event} onOpen={() => onOpen(event)} />)}
          </div>
        ) : <ExploreMap onOpen={onOpen} />}
      </div>
    </section>
  );
}

function CreatePage() {
  const [billMode, setBillMode] = useState("各自付");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [venueQuery, setVenueQuery] = useState("");
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState({ name: "PASTA & CO.", address: "台北市信義區松壽路", lat: 25.0339, lng: 121.5645 });
  const billModes = ["我請客", "各自付", "男請女"];
  const venueSuggestions = [
    { name: "PASTA & CO.", address: "台北市信義區松壽路", lat: 25.0339, lng: 121.5645 },
    { name: "YAKI NIKU LAB", address: "台北市大安區光復南路", lat: 25.033, lng: 121.543 },
  ];
  const chooseVenue = (venue: typeof selectedVenue) => {
    setSelectedVenue(venue);
    setVenueQuery(venue.name);
    setShowSuggestions(false);
    setShowVenueMap(true);
  };
  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <div className="rounded-[30px] bg-white/75 p-5 shadow-[0_18px_45px_rgba(55,28,98,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-bold tracking-[0.2em] text-fuchsia-500">HOST A TABLE</p>
        <h1 className="mt-1 text-[29px] font-black tracking-[-0.04em] text-slate-950">發起一場<br />想認真赴約的晚餐。</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">清楚說明期待，讓每一個報名都更接近你的飯局氛圍。</p>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-4 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_18px_45px_rgba(55,28,98,0.1)] backdrop-blur-xl">
        <Field label="飯局主題" helper="讓人一眼知道這場飯的感覺">
          <input className="form-input" placeholder="例如：下班後想聊聊旅行的義式晚餐" />
        </Field>
        <div className="grid grid-cols-2 gap-3"><Field label="日期"><div className="form-input flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-pink-500" /><input aria-label="選擇日期" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div></Field><Field label="時間"><div className="form-input flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-pink-500" /><input aria-label="選擇時間" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div></Field></div>
        <Field label="餐廳或地點" helper="支援 Google 地點搜尋與地址自動完成">
          <div className="relative"><div className="form-input flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-violet-500" /><input value={venueQuery} onChange={(event) => { setVenueQuery(event.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="搜尋餐廳、地標或地址" /><button type="button" aria-label="在地圖確認餐廳位置" onClick={() => setShowVenueMap((open) => !open)} className="pressable grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700"><MapPin className="h-4 w-4" /></button></div>{showSuggestions && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-violet-100 bg-white p-1 shadow-xl"><p className="px-3 py-2 text-[11px] font-bold tracking-wide text-violet-500">建議地點</p>{venueSuggestions.map((venue) => <button type="button" key={venue.name} onClick={() => chooseVenue(venue)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-violet-50"><MapPin className="h-4 w-4 text-fuchsia-500" /><span>{venue.name} <small className="block text-xs font-normal text-slate-400">{venue.address}</small></span></button>)}</div>}</div>
        </Field>
        {showVenueMap && <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-violet-50 px-3.5 py-2.5"><div><p className="text-xs font-black text-slate-800">地圖確認位置</p><p className="mt-0.5 text-[11px] text-slate-500">{selectedVenue.name} · {selectedVenue.address}</p></div><button type="button" onClick={() => setShowVenueMap(false)} className="pressable rounded-lg p-1.5 text-slate-400" aria-label="關閉地圖"><X className="h-4 w-4" /></button></div><MapView className="h-[250px]" initialCenter={{ lat: selectedVenue.lat, lng: selectedVenue.lng }} initialZoom={16} onMapReady={(map) => { const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: selectedVenue.lat, lng: selectedVenue.lng }, title: selectedVenue.name }); marker.addListener("click", () => setShowVenueMap(false)); }} /></div>}
        <Field label="買單方式"><div className="grid grid-cols-3 gap-2">{billModes.map((mode) => <button type="button" key={mode} onClick={() => setBillMode(mode)} className={`pressable rounded-xl border px-2 py-2.5 text-xs font-bold ${billMode === mode ? "border-violet-600 bg-violet-600 text-white" : "border-slate-100 bg-slate-50 text-slate-500"}`}>{mode}</button>)}</div></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="每人預算"><div className="form-input text-slate-400">例如 $800</div></Field><Field label="人數上限"><div className="form-input text-slate-400">4 人</div></Field></div>
        <div className="rounded-2xl bg-violet-50 px-3.5 py-3 text-xs leading-relaxed text-violet-800"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" />參與者確認後才會進入聊天室；保證金與取消規則將於報名時清楚提示。</div>
        <button className="pressable w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.25)]">預覽並發起飯局</button>
      </form>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-bold text-slate-800">{label}</span>{helper && <span className="mt-0.5 block text-[11px] font-medium text-slate-400">{helper}</span>}<div className="mt-2">{children}</div></label>;
}

function MessagesPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const sendMessage = () => {
    const content = message.trim();
    if (!content) return;
    setSent((current) => [...current, content]);
    setMessage("");
  };
  return (
    <section className="page-enter flex min-h-[680px] flex-col px-4 pb-28 pt-5">
      <header className="flex items-center justify-between"><div><p className="text-[11px] font-bold tracking-[0.2em] text-violet-500">CONFIRMED TABLES</p><h1 className="mt-1 text-[28px] font-black tracking-[-0.04em] text-slate-950">一起吃飯的人</h1></div><button aria-label="通知" className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/75 shadow-sm"><Bell className="h-4 w-4 text-slate-700" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500" /></button></header>
      <div className="mt-5 flex flex-1 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/78 shadow-[0_18px_45px_rgba(55,28,98,0.13)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-black text-white">M</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">週五夜的微醺義式晚餐</p><p className="mt-0.5 text-xs font-medium text-emerald-600">3 位已確認成員 · 可安心聊天</p></div><MoreHorizontal className="h-5 w-5 text-slate-400" /></div>
        <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5"><div className="mx-auto w-fit rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold text-violet-600">飯局已確認 · 週五 19:30</div><ChatBubble name="Mia" text="大家好！期待週五一起吃義大利麵，餐廳離市政府站很近。" /><ChatBubble name="Kevin" text="收到，我會準時到！" inverse />{sent.map((item, index) => <ChatBubble key={`${item}-${index}`} name="你" text={item} own />)}<div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-[11px] leading-relaxed text-orange-700"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />請勿在聊天室要求匯款或分享敏感資訊；若有疑慮，可立即檢舉。</div></div>
        <div className="flex gap-2 border-t border-slate-100 p-3"><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2" placeholder="輸入訊息" /><button onClick={sendMessage} aria-label="發送訊息" className="pressable grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white"><Send className="h-4 w-4" /></button></div>
      </div>
    </section>
  );
}

function ChatBubble({ name, text, own, inverse }: { name: string; text: string; own?: boolean; inverse?: boolean }) {
  const isOwn = own || inverse;
  return <div className={`flex gap-2 ${isOwn ? "justify-end" : ""}`}><div className={`max-w-[82%] ${isOwn ? "order-1" : ""}`}><p className={`mb-1 text-[10px] font-bold ${isOwn ? "text-right text-violet-500" : "text-slate-400"}`}>{name}</p><p className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${isOwn ? "rounded-tr-sm bg-violet-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}>{text}</p></div></div>;
}

function ProfilePage({ onOpenPrd }: { onOpenPrd: () => void }) {
  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <div className="relative overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_20px_45px_rgba(27,12,62,0.28)]"><div className="mesh-orb mesh-orb-three" /><div className="relative flex items-start justify-between"><div className="flex gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300 via-pink-500 to-violet-600 text-lg font-black">A</div><div><p className="text-lg font-black">Ammolite</p><p className="mt-1 text-xs text-violet-200">正在打造更好的相遇方式</p></div></div><button aria-label="更多設定" className="rounded-xl bg-white/10 p-2"><MoreHorizontal className="h-4 w-4" /></button></div><div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/10 py-3 text-center backdrop-blur"><div><p className="text-base font-black">—</p><p className="mt-1 text-[10px] font-bold text-violet-200">信用分數</p></div><div><p className="text-base font-black">0</p><p className="mt-1 text-[10px] font-bold text-violet-200">已完成飯局</p></div><div><p className="text-base font-black">—</p><p className="mt-1 text-[10px] font-bold text-violet-200">點數餘額</p></div></div></div>
      <div className="mt-5 space-y-3"><div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-pink-50 text-pink-500"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-900">信用與互評</p><p className="mt-0.5 text-xs leading-relaxed text-slate-500">飯局完成後可評估準時、禮貌與互動；資料累積後會顯示你的信用概況。</p></div></div></div><div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Crown className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-900">DineLink Plus</p><p className="mt-0.5 text-xs text-slate-500">優先曝光與更多篩選條件</p></div></div><ChevronRight className="h-4 w-4 text-slate-400" /></div></div><button onClick={onOpenPrd} className="pressable flex w-full items-center justify-between rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></span><span><span className="block text-sm font-black text-violet-950">產品規格與開發藍圖</span><span className="mt-0.5 block text-xs text-violet-600">查看 MVP 模組、技術架構與 Roadmap</span></span></span><ChevronRight className="h-4 w-4 text-violet-500" /></button></div>
    </section>
  );
}

function PrdPage({ onBack }: { onBack: () => void }) {
  const roadmap = ["MVP：帳號、飯局探索、申請、審核與文字聊天室", "Beta：保證金、評價／信用、通知與餐廳合作", "Launch：訂閱、點數方案、風險偵測與營運後台"];
  return <section className="page-enter px-4 pb-10 pt-5"><button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button><div className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_18px_45px_rgba(27,12,62,0.25)]"><p className="text-[11px] font-bold tracking-[0.2em] text-pink-200">PRODUCT BRIEF · MVP</p><h1 className="mt-2 text-[29px] font-black leading-tight tracking-[-0.04em]">讓每一場飯局，都有安心赴約的理由。</h1><p className="mt-3 text-sm leading-relaxed text-violet-100">DineLink 是以「好好吃飯」為中心的社交平台，透過明確的飯局規則、成員確認與信用機制，降低陌生社交的不確定性。</p></div><DocSection title="核心功能模組"><DocItem icon={<Compass />} title="探索與配對" text="清楚呈現時間、地點、人數、預算與買單方式，支援列表與地圖探索。" /><DocItem icon={<Check />} title="申請與審核" text="主辦人掌握成員確認權；申請狀態、保證金與取消規則全程可追蹤。" /><DocItem icon={<MessageCircle />} title="確認後聊天室" text="僅限核准成員進入，集中飯局溝通並保留安全檢舉入口。" /></DocSection><DocSection title="技術架構"><div className="rounded-2xl bg-slate-50 p-3.5 text-xs leading-6 text-slate-600"><b className="text-slate-900">前端：</b>Next.js App Router + Tailwind CSS + Lucide React<br /><b className="text-slate-900">資料與 API：</b>PostgreSQL + Drizzle ORM，將飯局、申請、聊天、保證金與評價拆分為獨立 Entity。<br /><b className="text-slate-900">位置服務：</b>Google Maps 地圖標記與餐廳地址自動完成。<br /><b className="text-slate-900">通知：</b>以可靠的背景工作執行飯局前兩小時提醒與狀態通知。</div></DocSection><DocSection title="0-to-1 Roadmap"><div className="space-y-2">{roadmap.map((item, index) => <div key={item} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-500 text-xs font-black text-white">{index + 1}</span><p className="pt-0.5 text-xs font-semibold leading-relaxed text-slate-700">{item}</p></div>)}</div></DocSection></section>;
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mt-5"><h2 className="mb-2.5 px-1 text-base font-black text-slate-950">{title}</h2><div className="space-y-2">{children}</div></div>; }
function DocItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-500">{icon}</span><div><p className="text-sm font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p></div></div>; }

function ProfileV2({ onOpenPrd }: { onOpenPrd: () => void }) {
  const reviewDimensions = ["準時", "禮貌", "趣味"];
  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <div className="relative overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_20px_45px_rgba(27,12,62,0.28)]">
        <div className="mesh-orb mesh-orb-three" />
        <div className="relative flex items-start justify-between">
          <div className="flex gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300 via-pink-500 to-violet-600 text-lg font-black">A</div><div><p className="text-lg font-black">Ammolite</p><p className="mt-1 text-xs text-violet-200">建立你的第一筆飯局紀錄</p></div></div>
          <button aria-label="更多設定" className="rounded-xl bg-white/10 p-2"><MoreHorizontal className="h-4 w-4" /></button>
        </div>
        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/10 py-3 text-center backdrop-blur">
          <div><p className="text-base font-black">待累積</p><p className="mt-1 text-[10px] font-bold text-violet-200">信用分數</p></div>
          <div><p className="text-base font-black">0</p><p className="mt-1 text-[10px] font-bold text-violet-200">已完成飯局</p></div>
          <div><p className="text-base font-black">320</p><p className="mt-1 text-[10px] font-bold text-violet-200">點數餘額</p></div>
        </div>
      </div>
      <div className="mt-5 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-pink-50 text-pink-500"><Heart className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-900">互評信用檔案</p><p className="mt-0.5 text-xs text-slate-500">完成首場飯局後，可收到匿名互評邀請</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2">{reviewDimensions.map((dimension) => <span key={dimension} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{dimension} · 尚待累積</span>)}</div>
      </div>
      <div className="mt-3 rounded-[24px] border border-amber-100 bg-amber-50 p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-white"><Crown className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-black text-amber-950">DineLink Plus</p><p className="mt-0.5 text-xs text-amber-800">優先曝光與更多精準篩選條件</p></div><ChevronRight className="h-4 w-4 text-amber-700" /></div></div>
      <button onClick={onOpenPrd} className="pressable mt-3 flex w-full items-center justify-between rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></span><span><span className="block text-sm font-black text-violet-950">產品規格與開發藍圖</span><span className="mt-0.5 block text-xs text-violet-600">查看 MVP 模組、技術架構與 Roadmap</span></span></span><ChevronRight className="h-4 w-4 text-violet-500" /></button>
    </section>
  );
}

function EventDetail({ event, onClose }: { event: DiningEvent; onClose: () => void }) {
  const [applied, setApplied] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-sm"><section className="page-enter max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] bg-[#fcfbff] p-4 pb-8 shadow-2xl"><div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" /><div className={`relative h-40 overflow-hidden rounded-[25px] bg-gradient-to-br ${event.color} p-4 text-white`}><button onClick={onClose} aria-label="關閉詳情" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/15 backdrop-blur"><X className="h-4 w-4" /></button><span className="inline-flex rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em]">{event.cuisine}</span><h2 className="absolute bottom-4 left-4 right-12 text-[25px] font-black leading-tight tracking-[-0.04em]">{event.title}</h2></div><div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm"><div className={`grid h-10 w-10 place-items-center rounded-2xl ${event.accent} text-sm font-black text-white`}>{event.hostInitial}</div><div><p className="text-sm font-black text-slate-900">由 {event.host} 發起</p><p className="mt-0.5 text-xs text-slate-500">完整資料驗證後顯示信用概況</p></div></div><div className="mt-4 grid grid-cols-2 gap-2">{[[<CalendarDays />, `${event.date} · ${event.time}`], [<MapPin />, `${event.restaurant} · ${event.neighborhood}`], [<Users />, event.capacity], [<WalletCards />, `${event.payment} · ${event.budget}`]].map(([icon, value], index) => <div key={index} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-xs font-bold leading-relaxed text-slate-700 shadow-sm"><span className="text-violet-500">{icon}</span>{value}</div>)}</div><div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3.5 text-xs leading-relaxed text-violet-950"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" /><b>保證金與點數提示：</b>送出申請前會明確顯示保留點數、取消期限與爽約處理方式；主辦人核准後才會進入確認成員名單與聊天室。</div><div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm"><p className="text-sm font-black text-slate-900">已確認成員</p><div className="mt-3 flex items-center gap-2"><div className="flex -space-x-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-fuchsia-500 text-[10px] font-bold text-white">M</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-violet-500 text-[10px] font-bold text-white">K</span></div><span className="text-xs font-medium text-slate-500">報名核准後顯示成員完整資訊</span></div></div><button onClick={() => setApplied(true)} className={`pressable mt-4 w-full rounded-2xl py-3.5 text-sm font-bold shadow-[0_12px_24px_rgba(15,23,42,0.2)] ${applied ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"}`}>{applied ? "申請已送出，等待主辦人審核" : "送出報名申請"}</button></section></div>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "explore";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "create" || tab === "messages" || tab === "profile" ? tab : "explore";
  });
  const [activeEvent, setActiveEvent] = useState<DiningEvent | null>(null);
  const [showPrd, setShowPrd] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "prd");

  const content = showPrd ? <PrdPage onBack={() => setShowPrd(false)} /> : activeTab === "explore" ? <ExplorePage onOpen={setActiveEvent} /> : activeTab === "create" ? <CreatePage /> : activeTab === "messages" ? <MessagesPage /> : <ProfileV2 onOpenPrd={() => setShowPrd(true)} />;
  return <main className="min-h-screen bg-[#17152a] p-0 font-sans text-slate-900 sm:p-5"><div className="phone-shell relative mx-auto min-h-screen max-w-md overflow-hidden bg-[#f7f5ff] sm:min-h-[calc(100vh-40px)] sm:rounded-[34px] sm:shadow-[0_30px_100px_rgba(1,3,30,0.55)]"><div className="ambient-glow ambient-one" /><div className="ambient-glow ambient-two" /> <div className="relative min-h-screen">{content}</div>{!showPrd && <nav className="absolute bottom-0 left-0 right-0 z-40 border-t border-white/70 bg-white/85 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl"><div className="grid grid-cols-4">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className="pressable flex flex-col items-center gap-1.5 px-1 py-1.5"><span className={`grid h-9 w-11 place-items-center rounded-xl transition ${activeTab === id ? "bg-slate-950 text-white shadow-lg" : "text-slate-400"}`}><Icon className={`h-[18px] w-[18px] ${id === "create" && activeTab !== id ? "text-fuchsia-500" : ""}`} /></span><span className={`text-[10px] font-bold ${activeTab === id ? "text-slate-950" : "text-slate-400"}`}>{label}</span></button>)}</div></nav>}{activeEvent && <EventDetail event={activeEvent} onClose={() => setActiveEvent(null)} />}</div></main>;
}
