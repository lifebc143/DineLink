"use client";

import { loadGoogleMaps, MapView } from "@/components/Map";
import MyEventsManagement from "@/components/MyEventsManagement";
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
import React, { useEffect, useMemo, useState } from "react";

type Tab = "explore" | "create" | "messages" | "profile";
type ViewMode = "list" | "map";

type DiningEvent = {
  id: string | number;
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

type ApiEventRow = { event: { id: string; title: string; eventStartAt: string; restaurantName: string | null; venueAddress: string; neighborhood: string | null; capacity: number; paymentMode: "host_treats" | "split_bill" | "men_treat_women"; budgetMin: number | null; budgetMax: number | null; latitude: string | null; longitude: string | null; cuisineTags: string[] }; host: { displayName: string } };

function eventFromApi({ event, host }: ApiEventRow): DiningEvent {
  const startsAt = new Date(event.eventStartAt);
  const payment = event.paymentMode === "host_treats" ? "我請客" : event.paymentMode === "men_treat_women" ? "男請女" : "各自付";
  const budget = event.budgetMin === null ? "預算待補" : event.budgetMax && event.budgetMax !== event.budgetMin ? `$${event.budgetMin}–${event.budgetMax}` : `$${event.budgetMin}`;
  return { id: event.id, title: event.title, cuisine: event.cuisineTags?.join(" · ") || "新建立飯局", date: new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", weekday: "short" }).format(startsAt), time: new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }).format(startsAt), restaurant: event.restaurantName || event.venueAddress, neighborhood: event.neighborhood || "地點待確認", capacity: `最多 ${event.capacity} 人`, payment, paymentShort: payment === "各自付" ? "AA 制" : payment, budget, host: host.displayName, hostInitial: host.displayName.slice(0, 1) || "飯", color: "from-emerald-500 via-teal-500 to-cyan-400", accent: "bg-emerald-500", lat: Number(event.latitude) || 25.0339, lng: Number(event.longitude) || 121.5645 };
}

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

function ExploreMap({ events, onOpen }: { events: DiningEvent[]; onOpen: (event: DiningEvent) => void }) {
  const markers = useMemo(() => events, [events]);
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

function ExplorePage({ events, notice, onOpen }: { events: DiningEvent[]; notice: string; onOpen: (event: DiningEvent) => void }) {
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
        {notice && <p role="status" className="mb-4 rounded-2xl bg-emerald-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-emerald-700"><Check className="mr-1 inline h-4 w-4" />{notice}</p>}
        {view === "list" ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between px-1"><div><p className="text-[11px] font-bold tracking-[0.15em] text-violet-500">NEAR YOU</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">附近的好好飯局</h2></div><button className="text-xs font-bold text-violet-600">查看全部</button></div>
            {events.map((event) => <EventCard key={event.id} event={event} onOpen={() => onOpen(event)} />)}
          </div>
        ) : <ExploreMap events={events} onOpen={onOpen} />}
      </div>
    </section>
  );
}

function CreatePage({ onCreated }: { onCreated: (event: DiningEvent) => void }) {
  const [billMode, setBillMode] = useState("各自付");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [venueQuery, setVenueQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formError, setFormError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState({ name: "", address: "", lat: 25.037, lng: 121.543, placeId: null as string | null });
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{ placeId: string; name: string; address: string }>>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState("");
  const [hasResolvedVenue, setHasResolvedVenue] = useState(false);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "anonymous">("checking");
  const billModes = ["我請客", "各自付", "男請女"];
  useEffect(() => { let active = true; void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => { const payload = await response.json().catch(() => ({ user: null })); if (active) setAuthStatus(payload.user ? "authenticated" : "anonymous"); }).catch(() => { if (active) setAuthStatus("anonymous"); }); return () => { active = false; }; }, []);
  const searchPlaces = async (query: string) => {
    if (query.trim().length < 2) { setPlaceSuggestions([]); setPlacesError(""); return; }
    setPlacesLoading(true); setPlacesError("");
    try {
      await loadGoogleMaps();
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions({ input: query, componentRestrictions: { country: "tw" }, types: ["establishment", "geocode"] }, (predictions, status) => {
        setPlacesLoading(false);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) { setPlaceSuggestions([]); if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) setPlacesError("暫時找不到建議地點，可直接使用目前輸入的地址。 "); return; }
        setPlaceSuggestions(predictions.slice(0, 5).map((prediction) => ({ placeId: prediction.place_id, name: prediction.structured_formatting.main_text, address: prediction.description })));
      });
    } catch { setPlacesLoading(false); setPlaceSuggestions([]); setPlacesError("地點服務暫時無法載入，仍可直接輸入完整地址。 "); }
  };
  const choosePlace = async (placeId: string, fallbackName: string) => {
    setPlacesLoading(true); setPlacesError("");
    try {
      await loadGoogleMaps();
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      service.getDetails({ placeId, fields: ["name", "formatted_address", "geometry", "place_id"] }, (place, status) => {
        setPlacesLoading(false);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) { setPlacesError("此地點無法取得座標，請改用完整地址。 "); return; }
        const location = place.geometry.location;
        setSelectedVenue({ name: place.name || fallbackName, address: place.formatted_address || fallbackName, lat: location.lat(), lng: location.lng(), placeId: place.place_id || placeId });
        setVenueQuery(place.name || fallbackName); setHasResolvedVenue(true); setPlaceSuggestions([]); setShowSuggestions(false); setShowVenueMap(true);
      });
    } catch { setPlacesLoading(false); setPlacesError("地點詳細資料暫時無法讀取，請稍後重試。 "); }
  };
  const openVenueMap = async () => {
    if (!venueQuery.trim()) { setFormError("請先輸入餐廳名稱或完整地址，再開啟地圖。 "); return; }
    if (hasResolvedVenue) { setShowVenueMap((open) => !open); return; }
    setPlacesLoading(true); setPlacesError("");
    try {
      await loadGoogleMaps();
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: venueQuery }, (results, status) => {
        setPlacesLoading(false);
        if (status !== google.maps.GeocoderStatus.OK || !results?.[0]?.geometry?.location) { setPlacesError("無法定位這個地址，請從建議清單選擇或輸入更完整的地址。 "); return; }
        const result = results[0]; const location = result.geometry.location;
        setSelectedVenue({ name: venueQuery, address: result.formatted_address, lat: location.lat(), lng: location.lng(), placeId: null }); setHasResolvedVenue(true); setShowVenueMap(true);
      });
    } catch { setPlacesLoading(false); setPlacesError("地圖服務暫時無法載入，請稍後再試。 "); }
  };
  const handlePreview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !date || !venueQuery.trim()) {
      setFormError("請先填妥飯局主題、日期與餐廳／地點，再預覽飯局。");
      return;
    }
    setFormError("");
    setApiError("");
    setShowPreview(true);
  };
  const confirmCreate = async () => {
    setIsSubmitting(true);
    setApiError("");
    try {
      const paymentMode = billMode === "我請客" ? "host_treats" : billMode === "男請女" ? "men_treat_women" : "split_bill";
      const numericBudget = Number.parseInt(budget.replace(/\D/g, ""), 10);
      const venueAddress = hasResolvedVenue ? selectedVenue.address : venueQuery.trim();
      const localStart = new Date(`${date}T${time}:00+08:00`);
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          eventStartAt: localStart.toISOString(),
          venueAddress,
          restaurantName: venueQuery.trim(),
          placeId: hasResolvedVenue ? selectedVenue.placeId ?? undefined : undefined,
          latitude: hasResolvedVenue ? selectedVenue.lat.toString() : undefined,
          longitude: hasResolvedVenue ? selectedVenue.lng.toString() : undefined,
          capacity: Number.parseInt(capacity, 10) || 4,
          paymentMode,
          budgetMin: Number.isFinite(numericBudget) ? numericBudget : undefined,
          budgetMax: Number.isFinite(numericBudget) ? numericBudget : undefined,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setApiError(response.status === 401 ? "請先登入後再建立飯局。" : result.error === "INVALID_EVENT" ? "飯局資料格式有誤，請回到表單確認內容。" : "目前無法建立飯局，請稍後再試。");
        return;
      }
      const event = result.event as { id?: string; title?: string };
      const eventDate = new Date(`${date}T${time}:00+08:00`);
      const createdCard: DiningEvent = {
        id: event.id ?? `local-${Date.now()}`,
        title: event.title ?? title.trim(),
        cuisine: "新建立飯局 · 等待報名",
        date: new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", weekday: "short" }).format(eventDate),
        time,
        restaurant: venueQuery.trim(),
        neighborhood: venueAddress.split("市").pop()?.slice(0, 3) || "待確認",
        capacity: `1 / ${capacity || "4"} 人`,
        payment: billMode,
        paymentShort: billMode === "各自付" ? "AA 制" : billMode,
        budget: budget ? `$${budget}` : "預算待補",
        host: "你",
        hostInitial: "你",
        color: "from-emerald-500 via-teal-500 to-cyan-400",
        accent: "bg-emerald-500",
        lat: selectedVenue.lat,
        lng: selectedVenue.lng,
      };
      setShowPreview(false);
      setCreated(true);
      onCreated(createdCard);
    } catch {
      setApiError("連線暫時中斷，請檢查網路後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <div className="rounded-[30px] bg-white/75 p-5 shadow-[0_18px_45px_rgba(55,28,98,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-bold tracking-[0.2em] text-fuchsia-500">HOST A TABLE</p>
        <h1 className="mt-1 text-[29px] font-black tracking-[-0.04em] text-slate-950">發起一場<br />想認真赴約的晚餐。</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">清楚說明期待，讓每一個報名都更接近你的飯局氛圍。</p>
      </div>
      <form onSubmit={handlePreview} className="mt-4 space-y-4 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_18px_45px_rgba(55,28,98,0.1)] backdrop-blur-xl">
        <Field label="飯局主題" helper="讓人一眼知道這場飯的感覺">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" placeholder="例如：下班後想聊聊旅行的義式晚餐" />
        </Field>
        <div className="grid grid-cols-2 gap-3"><Field label="日期"><div className="form-input flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-pink-500" /><input aria-label="選擇日期" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div></Field><Field label="時間"><div className="form-input flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-pink-500" /><input aria-label="選擇時間" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div></Field></div>
        <Field label="餐廳或地點" helper="支援 Google 地點搜尋與地址自動完成">
          <div className="relative"><div className="form-input flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-violet-500" /><input value={venueQuery} onChange={(event) => { const query = event.target.value; setVenueQuery(query); setShowSuggestions(true); setCreated(false); setHasResolvedVenue(false); void searchPlaces(query); }} onFocus={() => { setShowSuggestions(true); if (venueQuery.trim().length >= 2) void searchPlaces(venueQuery); }} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="搜尋餐廳、地標或地址" /><button type="button" aria-label="在地圖確認餐廳位置" onClick={() => void openVenueMap()} className="pressable grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700"><MapPin className="h-4 w-4" /></button></div>{showSuggestions && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-violet-100 bg-white p-1 shadow-xl"><p className="px-3 py-2 text-[11px] font-bold tracking-wide text-violet-500">{placesLoading ? "正在搜尋地點…" : "Google 地點建議"}</p>{placeSuggestions.map((place) => <button type="button" key={place.placeId} onClick={() => void choosePlace(place.placeId, place.name)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-violet-50"><MapPin className="h-4 w-4 text-fuchsia-500" /><span>{place.name} <small className="block text-xs font-normal text-slate-400">{place.address}</small></span></button>)}{!placesLoading && placeSuggestions.length === 0 && venueQuery.trim().length >= 2 && <p className="px-3 py-2 text-xs leading-relaxed text-slate-500">{placesError || "找不到建議地點；可直接輸入完整地址，再點右側地圖圖示定位。"}</p>}</div>}</div>
        </Field>
        {showVenueMap && <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-violet-50 px-3.5 py-2.5"><div><p className="text-xs font-black text-slate-800">地圖確認位置</p><p className="mt-0.5 text-[11px] text-slate-500">{selectedVenue.name} · {selectedVenue.address}</p></div><button type="button" onClick={() => setShowVenueMap(false)} className="pressable rounded-lg p-1.5 text-slate-400" aria-label="關閉地圖"><X className="h-4 w-4" /></button></div><MapView className="h-[250px]" initialCenter={{ lat: selectedVenue.lat, lng: selectedVenue.lng }} initialZoom={16} onMapReady={(map) => { const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: selectedVenue.lat, lng: selectedVenue.lng }, title: selectedVenue.name }); marker.addListener("click", () => setShowVenueMap(false)); }} /></div>}
        <Field label="買單方式"><div className="grid grid-cols-3 gap-2">{billModes.map((mode) => <button type="button" key={mode} onClick={() => setBillMode(mode)} className={`pressable rounded-xl border px-2 py-2.5 text-xs font-bold ${billMode === mode ? "border-violet-600 bg-violet-600 text-white" : "border-slate-100 bg-slate-50 text-slate-500"}`}>{mode}</button>)}</div></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="每人預算"><input value={budget} onChange={(event) => setBudget(event.target.value)} className="form-input" placeholder="例如 $800" inputMode="numeric" /></Field><Field label="人數上限"><input value={capacity} onChange={(event) => setCapacity(event.target.value)} className="form-input" placeholder="4 人" inputMode="numeric" /></Field></div>
        <div className="rounded-2xl bg-violet-50 px-3.5 py-3 text-xs leading-relaxed text-violet-800"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" />參與者確認後才會進入聊天室；取消規則、出席紀錄與信用 rating 將於報名時清楚提示。</div>
        {authStatus === "anonymous" && <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900"><b>登入後才能正式建立飯局。</b><a href="/api/auth/login?returnTo=/?tab=create" className="ml-2 inline-flex rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white">立即登入</a></div>}
        {formError && <p role="alert" className="rounded-2xl bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-700">{formError}</p>}
        {created && <p role="status" className="rounded-2xl bg-emerald-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-emerald-700"><Check className="mr-1 inline h-4 w-4" />飯局已成功建立，現在已顯示在探索清單與我的飯局中。</p>}
        <button type="submit" className="pressable w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.25)]">{created ? "已確認發起飯局" : "預覽並發起飯局"}</button>
      </form>
      {showPreview && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-label="飯局預覽確認" className="page-enter max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto overscroll-contain rounded-t-[32px] bg-[#fcfbff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"><div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" /><div className="rounded-[24px] bg-slate-950 p-4 text-white"><p className="text-[11px] font-bold tracking-[0.18em] text-pink-200">TABLE PREVIEW</p><h2 className="mt-2 text-xl font-black">{title}</h2><p className="mt-3 flex items-center gap-2 text-sm text-violet-100"><CalendarDays className="h-4 w-4 text-pink-300" />{date} · {time}</p><p className="mt-2 flex items-center gap-2 text-sm text-violet-100"><MapPin className="h-4 w-4 text-orange-300" />{venueQuery} · {hasResolvedVenue ? selectedVenue.address : "使用輸入的地點文字"}</p></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">{billMode}</div><div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">{budget || "預算待補"} · {capacity || "4"} 人</div></div><div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3 text-xs leading-relaxed text-violet-900"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" />確認後會建立飯局並寫入你的飯局清單；取消規則、出席紀錄與信用 rating 會於送出前清楚提示。</div>{apiError && <div role="alert" className="mt-3 rounded-2xl bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-700"><p>{apiError}</p>{apiError.startsWith("請先登入") && <a href="/api/auth/login" className="mt-2 inline-block rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">立即登入後建立飯局</a>}</div>}<div className="sticky bottom-0 -mx-4 mt-5 flex gap-3 border-t border-slate-100 bg-[#fcfbff]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><button type="button" disabled={isSubmitting} onClick={() => setShowPreview(false)} className="pressable flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 disabled:opacity-50">返回編輯</button><button type="button" disabled={isSubmitting} onClick={confirmCreate} className="pressable flex-1 rounded-2xl bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? "建立中…" : "確認建立飯局"}</button></div></section></div>}
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
  const roadmap = [
    "MVP：帳號與實名驗證、飯局探索、申請審核、文字聊天室與基礎出席評價。",
    "Beta：出席率／信用評分系統、飯局前推播通知、餐廳合作方案。",
    "Launch：訂閱制、點數方案、風險防護與營運後台。",
  ];
  return <section className="page-enter px-4 pb-10 pt-5"><button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button><div className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_18px_45px_rgba(27,12,62,0.25)]"><p className="text-[11px] font-bold tracking-[0.2em] text-pink-200">PRODUCT BRIEF · MVP</p><h1 className="mt-2 text-[29px] font-black leading-tight tracking-[-0.04em]">讓每一場飯局，都有安心赴約的理由。</h1><p className="mt-3 text-sm leading-relaxed text-violet-100">DineLink 透過明確的飯局規則、主辦人審核、可追蹤出席紀錄與信用 rating，降低陌生社交的不確定性。</p></div><DocSection title="核心功能模組"><DocItem icon={<Compass />} title="探索與配對" text="清楚呈現時間、地點、人數、預算與買單方式，支援列表與地圖探索。" /><DocItem icon={<Check />} title="申請與審核" text="主辦人掌握成員審核權；申請狀態、取消規則與出席紀錄全程可追蹤。" /><DocItem icon={<MessageCircle />} title="確認後聊天室" text="僅限核准成員進入，集中飯局溝通並保留安全檢舉入口。" /></DocSection><DocSection title="技術架構"><div className="rounded-2xl bg-slate-50 p-3.5 text-xs leading-6 text-slate-600"><b className="text-slate-900">前端：</b>Next.js App Router + Tailwind CSS + Lucide React<br /><b className="text-slate-900">資料與 API：</b>PostgreSQL + Drizzle ORM，將飯局、申請、聊天與評價拆分為獨立 Entity。<br /><b className="text-slate-900">位置服務：</b>Google Maps 地圖標記與餐廳地址自動完成。<br /><b className="text-slate-900">通知：</b>以可靠背景工作執行飯局前兩小時提醒與狀態通知。</div></DocSection><DocSection title="0-to-1 Roadmap"><div className="space-y-2">{roadmap.map((item, index) => <div key={item} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-500 text-xs font-black text-white">{index + 1}</span><p className="pt-0.5 text-xs font-semibold leading-relaxed text-slate-700">{item}</p></div>)}</div></DocSection></section>;
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mt-5"><h2 className="mb-2.5 px-1 text-base font-black text-slate-950">{title}</h2><div className="space-y-2">{children}</div></div>; }
function DocItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-500">{icon}</span><div><p className="text-sm font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p></div></div>; }

function ProfileV2({ onOpenPrd, onOpenMyEvents }: { onOpenPrd: () => void; onOpenMyEvents: () => void }) {
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
          <div><p className="text-base font-black">待累積</p><p className="mt-1 text-[10px] font-bold text-violet-200">出席率</p></div>
        </div>
      </div>
      <ProfileInsights />
      <div className="mt-3 rounded-[24px] border border-amber-100 bg-amber-50 p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-white"><Crown className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-black text-amber-950">DineLink Plus</p><p className="mt-0.5 text-xs text-amber-800">優先曝光與更多精準篩選條件</p></div><ChevronRight className="h-4 w-4 text-amber-700" /></div></div>
      <button onClick={onOpenMyEvents} className="pressable mt-3 flex w-full items-center justify-between rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white"><CalendarDays className="h-5 w-5" /></span><span><span className="block text-sm font-black text-emerald-950">我的飯局</span><span className="mt-0.5 block text-xs text-emerald-700">管理我發起、我申請與待審核的飯局</span></span></span><ChevronRight className="h-4 w-4 text-emerald-600" /></button>
      <button onClick={onOpenPrd} className="pressable mt-3 flex w-full items-center justify-between rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></span><span><span className="block text-sm font-black text-violet-950">產品規格與開發藍圖</span><span className="mt-0.5 block text-xs text-violet-600">查看 MVP 模組、技術架構與 Roadmap</span></span></span><ChevronRight className="h-4 w-4 text-violet-500" /></button>
    </section>
  );
}

type InsightPayload = { creditScore: number; completedEventCount: number; attendanceRate: number | null; attendanceTotal: number; trend: Array<{ label: string; score: number }>; dimensions: { punctuality: number | null; politeness: number | null; interaction: number | null } };

function ProfileInsights() {
  const [insights, setInsights] = useState<InsightPayload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  useEffect(() => { let active = true; void fetch("/api/me/insights", { cache: "no-store" }).then(async (response) => { if (!active) return; if (response.status === 401) { setState("empty"); return; } if (!response.ok) { setState("error"); return; } const result = await response.json() as InsightPayload; setInsights(result); setState(result.trend.length || result.attendanceTotal ? "ready" : "empty"); }).catch(() => { if (active) setState("error"); }); return () => { active = false; }; }, []);
  if (state === "loading") return <div className="mt-5 rounded-[24px] bg-white/80 p-4 text-xs font-semibold text-slate-500 shadow-sm">正在整理你的信用與出席紀錄…</div>;
  if (state === "empty") return <div className="mt-5 rounded-[24px] border border-violet-100 bg-violet-50 p-4"><p className="text-sm font-black text-violet-950">信用檔案等待第一筆紀錄</p><p className="mt-1 text-xs leading-relaxed text-violet-700">完成飯局並收到互評後，這裡會顯示真實的信用 Rating 趨勢與歷史出席率。</p></div>;
  if (state === "error" || !insights) return <div className="mt-5 rounded-[24px] border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">目前無法載入信用洞察，請稍後重新整理再試。</div>;
  const steps = Math.max(1, insights.trend.length - 1); const points = insights.trend.map((point, index) => `${(index / steps) * 100},${100 - point.score}`).join(" "); const dimensions: Array<[string, number | null]> = [["準時", insights.dimensions.punctuality], ["禮貌", insights.dimensions.politeness], ["互動", insights.dimensions.interaction]];
  return <div className="mt-5 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-900">信用 Rating 與出席紀錄</p><p className="mt-0.5 text-xs text-slate-500">依已完成飯局與收到的互評彙整</p></div><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">{insights.creditScore} 分</span></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-emerald-50 p-3"><p className="text-lg font-black text-emerald-800">{insights.attendanceRate === null ? "待累積" : `${insights.attendanceRate}%`}</p><p className="mt-1 text-[10px] font-bold text-emerald-700">歷史出席率 · {insights.attendanceTotal} 場已結算</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-800">{insights.completedEventCount}</p><p className="mt-1 text-[10px] font-bold text-slate-500">已完成飯局</p></div></div>{insights.trend.length > 0 ? <div className="mt-4"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700">信用 Rating 趨勢</p><p className="text-[10px] text-slate-400">收到互評後累積更新</p></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-20 w-full overflow-visible"><polyline points={points} fill="none" stroke="#7c3aed" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />{insights.trend.map((point, index) => <circle key={`${point.label}-${index}`} cx={(index / steps) * 100} cy={100 - point.score} r="3" fill="#ec4899" vectorEffect="non-scaling-stroke" />)}</svg><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{insights.trend[0]?.label}</span><span>{insights.trend[insights.trend.length - 1]?.label}</span></div></div> : <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">尚未收到可呈現趨勢的互評資料。</p>}<div className="mt-3 flex flex-wrap gap-2">{dimensions.map(([label, score]) => <span key={label} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{label} · {score === null ? "待累積" : `${score} / 5`}</span>)}</div></div>;
}

type MyEventRecord = { id: string; title: string; eventStartAt: string; restaurantName: string | null; venueAddress: string; status: string; capacity: number };
type MyEventsPayload = {
  hosted: Array<{ event: MyEventRecord; pendingApplications: Array<{ application: { id: string; introduction: string | null }; applicant: { displayName: string; avatarUrl: string | null } }>; attendances: Array<{ attendance: { id: string; userId: string; status: string }; member: { displayName: string; avatarUrl: string | null } }> }>;
  applied: Array<{ application: { id: string; status: string; introduction: string | null }; event: MyEventRecord; host: { displayName: string } }>;
};

function MyEventsPage({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<MyEventsPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<"hosted" | "applied">("hosted");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/me/events", { cache: "no-store" }).catch(() => null);
    if (!response) { setError("目前無法讀取飯局資料，請檢查網路後再試。"); setLoading(false); return; }
    if (response.status === 401) { setError("請先登入，才能查看與管理你的飯局。"); setLoading(false); return; }
    if (!response.ok) { setError("目前無法讀取飯局資料，請稍後再試。"); setLoading(false); return; }
    setData(await response.json() as MyEventsPayload);
    setError("");
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const review = async (applicationId: string, decision: "approved" | "rejected") => {
    setReviewing(applicationId);
    const response = await fetch(`/api/applications/${applicationId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }).catch(() => null);
    setReviewing(null);
    if (!response?.ok) { setError("審核未完成，請稍後再試。"); return; }
    await load();
  };
  const updateAttendance = async (eventId: string, userId: string, status: "attended" | "late" | "no_show") => {
    const response = await fetch(`/api/events/${eventId}/attendance`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, status }) }).catch(() => null);
    if (!response?.ok) { setError("出席紀錄未更新，請稍後再試。"); return; }
    await load();
  };
  const cancelApplication = async (applicationId: string) => {
    const response = await fetch(`/api/applications/${applicationId}/cancel`, { method: "POST" }).catch(() => null);
    if (!response?.ok) { setError("目前無法取消申請，請稍後再試。"); return; }
    await load();
  };
  const eventDate = (value: string) => new Date(value).toLocaleString("zh-TW", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
  const statusLabel = (status: string) => ({ pending: "等待主辦人審核", approved: "已確認", rejected: "未被接受", withdrawn: "已撤回", cancelled: "已取消" }[status] ?? status);
  return <section className="page-enter px-4 pb-10 pt-5"><button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button><div className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_18px_45px_rgba(27,12,62,0.25)]"><p className="text-[11px] font-bold tracking-[0.2em] text-emerald-200">MY DINING PLANS</p><h1 className="mt-2 text-[29px] font-black tracking-[-0.04em]">我的飯局</h1><p className="mt-2 text-sm leading-relaxed text-emerald-100">追蹤我發起與我申請的飯局，審核成員並保留取消、出席與信用紀錄。</p></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-1.5 shadow-sm"><button onClick={() => setActiveList("hosted")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${activeList === "hosted" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我發起的飯局</button><button onClick={() => setActiveList("applied")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${activeList === "applied" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我已申請的飯局</button></div>{loading && <div className="mt-4 rounded-2xl bg-white/80 p-5 text-center text-sm font-semibold text-slate-500">正在讀取你的飯局…</div>}{error && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><p>{error}</p>{error.startsWith("請先登入") ? <a href="/api/auth/login" className="mt-3 inline-flex rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">登入並查看我的飯局</a> : <button onClick={() => void load()} className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">重新讀取</button>}</div>}{!loading && !error && activeList === "hosted" && <div className="mt-4 space-y-3">{data?.hosted.length === 0 && <EmptyMyEvents title="尚未發起飯局" text="發起第一場飯局後，可在此審核申請與管理已確認成員。" />}{data?.hosted.map(({ event, pendingApplications, attendances }) => <div key={event.id} className="rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">{eventDate(event.eventStartAt)} · {event.restaurantName || event.venueAddress}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{event.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-center"><div><p className="text-base font-black text-slate-900">{pendingApplications.length}</p><p className="text-[10px] font-bold text-slate-500">待審核申請</p></div><div><p className="text-base font-black text-slate-900">{attendances.length} / {event.capacity}</p><p className="text-[10px] font-bold text-slate-500">已確認成員</p></div></div>{pendingApplications.length > 0 && <div className="mt-3 space-y-2"><p className="text-xs font-black text-slate-700">待審核成員</p>{pendingApplications.map(({ application, applicant }) => <div key={application.id} className="rounded-2xl border border-slate-100 p-3"><p className="text-sm font-bold text-slate-800">{applicant.displayName}</p><p className="mt-1 text-xs text-slate-500">{application.introduction || "尚未留下自我介紹"}</p><div className="mt-3 flex gap-2"><button disabled={reviewing === application.id} onClick={() => void review(application.id, "approved")} className="pressable flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white disabled:opacity-50">核准</button><button disabled={reviewing === application.id} onClick={() => void review(application.id, "rejected")} className="pressable flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">拒絕</button></div></div>)}</div>}<div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-xs font-black text-emerald-950">已確認成員與出席紀錄</p>{attendances.length === 0 ? <p className="mt-1 text-xs text-emerald-800">尚無已確認成員。</p> : <div className="mt-2 space-y-2">{attendances.map(({ attendance, member }) => <div key={attendance.id} className="rounded-xl bg-white p-2.5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800">{member.displayName}</span><span className="text-[10px] font-bold text-emerald-700">{attendance.status}</span></div><div className="mt-2 grid grid-cols-3 gap-1"><button onClick={() => void updateAttendance(event.id, attendance.userId, "attended")} className="rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white">出席</button><button onClick={() => void updateAttendance(event.id, attendance.userId, "late")} className="rounded-lg bg-amber-100 py-1.5 text-[10px] font-bold text-amber-800">遲到</button><button onClick={() => void updateAttendance(event.id, attendance.userId, "no_show")} className="rounded-lg bg-rose-100 py-1.5 text-[10px] font-bold text-rose-700">爽約</button></div></div>)}</div>}<p className="mt-2 text-[11px] leading-relaxed text-emerald-800">取消規則：申請者可在飯局開始前取消；已確認參與者取消後會退出聊天室，主辦人可更新出席紀錄。</p></div></div>)}</div>}{!loading && !error && activeList === "applied" && <div className="mt-4 space-y-3">{data?.applied.length === 0 && <EmptyMyEvents title="尚未申請飯局" text="在探索頁選擇合適的飯局送出申請，審核結果會顯示在這裡。" />}{data?.applied.map(({ application, event, host }) => <div key={application.id} className="rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">主辦人 {host.displayName} · {eventDate(event.eventStartAt)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${application.status === "approved" ? "bg-emerald-50 text-emerald-700" : application.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(application.status)}</span></div><p className="mt-3 text-xs leading-relaxed text-slate-500">{application.status === "approved" ? "你已是確認成員，可進入群組聊天室並留意開始前提醒。" : "申請狀態與取消規則會全程保留；主辦人審核後會以通知提醒。"}</p>{["pending", "approved"].includes(application.status) && <button onClick={() => void cancelApplication(application.id)} className="pressable mt-3 w-full rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-bold text-rose-700">{application.status === "approved" ? "取消參與並退出聊天室" : "取消申請"}</button>}</div>)}</div>}</section>;
}

function EmptyMyEvents({ title, text }: { title: string; text: string }) { return <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center"><CalendarDays className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-black text-emerald-950">{title}</p><p className="mt-1 text-xs leading-relaxed text-emerald-800">{text}</p></div>; }

function EventDetail({ event, onClose }: { event: DiningEvent; onClose: () => void }) {
  const [applied, setApplied] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-sm"><section className="page-enter max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] bg-[#fcfbff] p-4 pb-8 shadow-2xl"><div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" /><div className={`relative h-40 overflow-hidden rounded-[25px] bg-gradient-to-br ${event.color} p-4 text-white`}><button onClick={onClose} aria-label="關閉詳情" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/15 backdrop-blur"><X className="h-4 w-4" /></button><span className="inline-flex rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em]">{event.cuisine}</span><h2 className="absolute bottom-4 left-4 right-12 text-[25px] font-black leading-tight tracking-[-0.04em]">{event.title}</h2></div><div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm"><div className={`grid h-10 w-10 place-items-center rounded-2xl ${event.accent} text-sm font-black text-white`}>{event.hostInitial}</div><div><p className="text-sm font-black text-slate-900">由 {event.host} 發起</p><p className="mt-0.5 text-xs text-slate-500">完整資料驗證後顯示信用概況</p></div></div><div className="mt-4 grid grid-cols-2 gap-2">{[[<CalendarDays />, `${event.date} · ${event.time}`], [<MapPin />, `${event.restaurant} · ${event.neighborhood}`], [<Users />, event.capacity], [<WalletCards />, `${event.payment} · ${event.budget}`]].map(([icon, value], index) => <div key={index} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-xs font-bold leading-relaxed text-slate-700 shadow-sm"><span className="text-violet-500">{icon}</span>{value}</div>)}</div><div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3.5 text-xs leading-relaxed text-violet-950"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" /><b>審核與出席提示：</b>送出申請前會明確顯示取消期限、出席期望與爽約處理方式；主辦人核准後才會進入確認成員名單與聊天室。</div><div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm"><p className="text-sm font-black text-slate-900">已確認成員</p><div className="mt-3 flex items-center gap-2"><div className="flex -space-x-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-fuchsia-500 text-[10px] font-bold text-white">M</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-violet-500 text-[10px] font-bold text-white">K</span></div><span className="text-xs font-medium text-slate-500">報名核准後顯示成員完整資訊</span></div></div><button onClick={() => setApplied(true)} className={`pressable mt-4 w-full rounded-2xl py-3.5 text-sm font-bold shadow-[0_12px_24px_rgba(15,23,42,0.2)] ${applied ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"}`}>{applied ? "申請已送出，等待主辦人審核" : "送出報名申請"}</button></section></div>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "explore";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "create" || tab === "messages" || tab === "profile" ? tab : "explore";
  });
  const [activeEvent, setActiveEvent] = useState<DiningEvent | null>(null);
  const [events, setEvents] = useState<DiningEvent[]>(() => DINING_EVENTS);
  const [creationNotice, setCreationNotice] = useState("");
  const [showPrd, setShowPrd] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "prd");
  const [showMyEvents, setShowMyEvents] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "my-events");

  useEffect(() => { let active = true; void fetch("/api/events", { cache: "no-store" }).then(async (response) => { if (!response.ok || !active) return; const payload = await response.json() as { events?: ApiEventRow[] }; if (active && payload.events?.length) setEvents(payload.events.map(eventFromApi)); }).catch(() => undefined); return () => { active = false; }; }, []);

  useEffect(() => { const syncDeepLink = () => { const tab = new URLSearchParams(window.location.search).get("tab"); if (tab === "my-events") setShowMyEvents(true); }; window.addEventListener("dine-link:navigate", syncDeepLink); return () => window.removeEventListener("dine-link:navigate", syncDeepLink); }, []);

  const handleEventCreated = (event: DiningEvent) => {
    setEvents((current) => [event, ...current]);
    setCreationNotice(`「${event.title}」已建立，現在已顯示在探索清單中。`);
    setActiveTab("explore");
  };

  const content = showPrd ? <PrdPage onBack={() => setShowPrd(false)} /> : showMyEvents ? <MyEventsManagement onBack={() => setShowMyEvents(false)} /> : activeTab === "explore" ? <ExplorePage events={events} notice={creationNotice} onOpen={setActiveEvent} /> : activeTab === "create" ? <CreatePage onCreated={handleEventCreated} /> : activeTab === "messages" ? <MessagesPage /> : <ProfileV2 onOpenPrd={() => setShowPrd(true)} onOpenMyEvents={() => setShowMyEvents(true)} />;
  return <main className="min-h-screen bg-[#17152a] p-0 font-sans text-slate-900 sm:p-5"><div className="phone-shell relative mx-auto min-h-screen max-w-md overflow-hidden bg-[#f7f5ff] sm:min-h-[calc(100vh-40px)] sm:rounded-[34px] sm:shadow-[0_30px_100px_rgba(1,3,30,0.55)]"><div className="ambient-glow ambient-one" /><div className="ambient-glow ambient-two" /> <div className="relative min-h-screen">{content}</div>{!showPrd && !showMyEvents && <nav className="absolute bottom-0 left-0 right-0 z-40 border-t border-white/70 bg-white/85 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl"><div className="grid grid-cols-4">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className="pressable flex flex-col items-center gap-1.5 px-1 py-1.5"><span className={`grid h-9 w-11 place-items-center rounded-xl transition ${activeTab === id ? "bg-slate-950 text-white shadow-lg" : "text-slate-400"}`}><Icon className={`h-[18px] w-[18px] ${id === "create" && activeTab !== id ? "text-fuchsia-500" : ""}`} /></span><span className={`text-[10px] font-bold ${activeTab === id ? "text-slate-950" : "text-slate-400"}`}>{label}</span></button>)}</div></nav>}{activeEvent && <EventDetail event={activeEvent} onClose={() => setActiveEvent(null)} />}</div></main>;
}
