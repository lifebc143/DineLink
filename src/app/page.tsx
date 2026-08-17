"use client";

import { loadGoogleMaps, MapView } from "@/components/Map";
import Image from "next/image";
import { formatTaipeiTime, TAIPEI_TIME_ZONE } from "@/lib/time";
import AdminDashboard from "@/components/AdminDashboard";
import LoadingState from "@/components/LoadingState";
import InAppBrowserLoginNotice from "@/components/InAppBrowserLoginNotice";
import EmailOtpLoginSheet from "@/components/EmailOtpLoginSheet";
import MyEventsManagement from "@/components/MyEventsManagement";
import PreviewConfirmSheet from "@/components/PreviewConfirmSheet";
import ProfileAvatarEditor, { AvatarUser } from "@/components/ProfileAvatarEditor";
import { loginRedirectHref } from "@/lib/mobile-login";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
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
  Share2,
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
  venueAddress?: string;
  neighborhood: string;
  capacity: string;
  payment: string;
  paymentShort: string;
  budget: string;
  host: string;
  hostInitial: string;
  hostAvatarUrl?: string | null;
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

type ApiEventRow = { event: { id: string; title: string; eventStartAt: string; restaurantName: string | null; venueAddress: string; neighborhood: string | null; capacity: number; paymentMode: "host_treats" | "split_bill" | "men_treat_women"; budgetMin: number | null; budgetMax: number | null; latitude: string | null; longitude: string | null; cuisineTags: string[] }; host: { displayName: string; avatarUrl?: string | null } };

function eventFromApi({ event, host }: ApiEventRow): DiningEvent {
  const startsAt = new Date(event.eventStartAt);
  const payment = event.paymentMode === "host_treats" ? "我請客" : event.paymentMode === "men_treat_women" ? "男請女" : "各自付";
  const budget = event.budgetMin === null ? "預算待補" : event.budgetMax && event.budgetMax !== event.budgetMin ? `$${event.budgetMin}–${event.budgetMax}` : `$${event.budgetMin}`;
  return { id: event.id, title: event.title, cuisine: event.cuisineTags?.join(" · ") || "新建立飯局", date: new Intl.DateTimeFormat("zh-TW", { timeZone: TAIPEI_TIME_ZONE, month: "numeric", day: "numeric", weekday: "short" }).format(startsAt), time: formatTaipeiTime(startsAt), restaurant: event.restaurantName || event.venueAddress, venueAddress: event.venueAddress, neighborhood: event.neighborhood || "地點待確認", capacity: `最多 ${event.capacity} 人`, payment, paymentShort: payment === "各自付" ? "AA 制" : payment, budget, host: host.displayName, hostInitial: host.displayName.slice(0, 1) || "飯", hostAvatarUrl: host.avatarUrl, color: "from-emerald-500 via-teal-500 to-cyan-400", accent: "bg-emerald-500", lat: Number(event.latitude) || 25.0339, lng: Number(event.longitude) || 121.5645 };
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
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-black backdrop-blur-sm">{event.hostAvatarUrl ? <Image src={event.hostAvatarUrl} alt={`${event.host} 的會員頭像`} fill sizes="32px" className="object-cover" /> : event.hostInitial}</span>
          </div>
        </div>
      </button>
      <div className="px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-pink-500" />{event.date} · {event.time}</span>
          <PaymentPill label={event.paymentShort} />
        </div>
        <p className="mt-2 flex items-center gap-1 truncate text-sm font-bold text-slate-800"><MapPin className="h-3.5 w-3.5 shrink-0 text-violet-500" />{event.restaurant} · {event.venueAddress || event.neighborhood}</p>
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

function AccountAvatar({ avatarUrl, userName }: { avatarUrl?: string | null; userName: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [avatarUrl]);
  if (avatarUrl && !failed) return <img src={avatarUrl} alt={`${userName} 的會員頭像`} onError={() => setFailed(true)} className="h-4 w-4 rounded-full object-cover" />;
  return <span aria-label={`${userName} 的會員縮寫`} className="grid h-4 w-4 place-items-center rounded-full bg-orange-300 text-[9px] font-black text-slate-950">{userName.slice(0, 1).toUpperCase()}</span>;
}

function ExplorePage({ events, notice, onOpen, userName, userAvatarUrl, onAccountClick, loading }: { events: DiningEvent[]; notice: string; onOpen: (event: DiningEvent) => void; userName?: string | null; userAvatarUrl?: string | null; onAccountClick: () => void; loading: boolean }) {
  const [view, setView] = useState<ViewMode>("list");
  const [filter, setFilter] = useState("全部");
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const filters = ["全部", "今晚", "週末", "近距離"];

  return (
    <section className="page-enter app-top-safe px-4 pb-28">
      <header className="relative overflow-hidden rounded-[30px] bg-slate-950 px-5 pb-6 pt-5 text-white shadow-[0_20px_45px_rgba(27,12,62,0.28)]">
        <div className="mesh-orb mesh-orb-one" />
        <div className="mesh-orb mesh-orb-two" />
        <div className="relative flex items-center justify-between">
          {userName ? <button type="button" onClick={onAccountClick} aria-label={`開啟 ${userName} 的個人主頁`} className="pressable flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur-md"><AccountAvatar avatarUrl={userAvatarUrl} userName={userName} />{userName}</button> : <button type="button" onClick={() => setShowEmailLogin(true)} className="pressable flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur-md"><MapPin className="h-3.5 w-3.5 text-orange-300" />登入／台北市</button>}
          <button aria-label="開啟選單" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 backdrop-blur-md"><Menu className="h-4 w-4" /></button>
        </div>
        <div className="relative mt-7">
          <p className="text-[11px] font-bold tracking-[0.24em] text-pink-200">DINE DIFFERENT</p>
          <h1 className="mt-1.5 text-[31px] font-black leading-[1.12] tracking-[-0.045em] text-white drop-shadow-sm">下一餐，<br />不只是吃飯。</h1>
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-violet-100">挑一場剛剛好的飯局，讓好好吃飯成為新的相遇方式。</p>
        </div>
        <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur-md">
          <span className="flex items-center gap-2 text-xs font-semibold text-white"><Sparkles className="h-4 w-4 text-orange-300" />{loading ? "正在更新附近飯局" : `今日為你挑選 ${events.length} 場飯局`}</span>
          <ChevronRight className="h-4 w-4 text-white/70" />
        </div>
      </header>
      {!userName && <InAppBrowserLoginNotice />}

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
            {loading && <LoadingState compact label="正在更新附近飯局…" />}
            {events.map((event) => <EventCard key={event.id} event={event} onOpen={() => onOpen(event)} />)}
          </div>
        ) : <ExploreMap events={events} onOpen={onOpen} />}
      </div>
      <footer className="mt-8 px-1 text-center text-[11px] leading-relaxed text-slate-500">DineLink 約飯｜公開飯局經主辦人審核後加入，請妥善保護個人資訊。</footer>
      {showEmailLogin && <EmailOtpLoginSheet onClose={() => setShowEmailLogin(false)} />}
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
      service.getPlacePredictions({ input: query, componentRestrictions: { country: "tw" }, language: "zh-TW", region: "TW", types: ["establishment", "geocode"] }, (predictions, status) => {
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
      service.getDetails({ placeId, language: "zh-TW", fields: ["name", "formatted_address", "geometry", "place_id"] }, (place, status) => {
        setPlacesLoading(false);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) { setPlacesError("此地點無法取得座標，請改用完整地址。 "); return; }
        const location = place.geometry.location;
        const saveVenue = (localizedAddress?: string) => { setSelectedVenue({ name: place.name || fallbackName, address: localizedAddress || place.formatted_address || fallbackName, lat: location.lat(), lng: location.lng(), placeId: place.place_id || placeId }); setVenueQuery(place.name || fallbackName); setHasResolvedVenue(true); setPlaceSuggestions([]); setShowSuggestions(false); setShowVenueMap(true); };
        if (!google.maps.Geocoder) { saveVenue(); return; }
        new google.maps.Geocoder().geocode({ location, language: "zh-TW", region: "TW" }, (results, geocodeStatus) => saveVenue(geocodeStatus === google.maps.GeocoderStatus.OK ? results?.[0]?.formatted_address : undefined));
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
      geocoder.geocode({ address: venueQuery, region: "TW", language: "zh-TW" }, (results, status) => {
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
        {showPreview && <PreviewConfirmSheet title={title} date={date} time={time} venueName={venueQuery} venueAddress={hasResolvedVenue ? selectedVenue.address : "使用輸入的地點文字"} billMode={billMode} budget={budget} capacity={capacity} apiError={apiError} isSubmitting={isSubmitting} onBack={() => setShowPreview(false)} onConfirm={confirmCreate} />}
      </form>
      {showPreview && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-label="飯局預覽確認" className="page-enter max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto overscroll-contain rounded-t-[32px] bg-[#fcfbff] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"><div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" /><div className="rounded-[24px] bg-slate-950 p-4 text-white"><p className="text-[11px] font-bold tracking-[0.18em] text-pink-200">TABLE PREVIEW</p><h2 className="mt-2 text-xl font-black">{title}</h2><p className="mt-3 flex items-center gap-2 text-sm text-violet-100"><CalendarDays className="h-4 w-4 text-pink-300" />{date} · {time}</p><p className="mt-2 flex items-center gap-2 text-sm text-violet-100"><MapPin className="h-4 w-4 text-orange-300" />{venueQuery} · {hasResolvedVenue ? selectedVenue.address : "使用輸入的地點文字"}</p></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">{billMode}</div><div className="rounded-2xl bg-white p-3 text-xs font-bold text-slate-700 shadow-sm">{budget || "預算待補"} · {capacity || "4"} 人</div></div><div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3 text-xs leading-relaxed text-violet-900"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" />確認後會建立飯局並寫入你的飯局清單；取消規則、出席紀錄與信用 rating 會於送出前清楚提示。</div>{apiError && <div role="alert" className="mt-3 rounded-2xl bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-700"><p>{apiError}</p>{apiError.startsWith("請先登入") && <a href="/api/auth/login" className="mt-2 inline-block rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">立即登入後建立飯局</a>}</div>}<div className="sticky bottom-0 -mx-4 mt-5 flex gap-3 border-t border-slate-100 bg-[#fcfbff]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><button type="button" disabled={isSubmitting} onClick={() => setShowPreview(false)} className="pressable flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 disabled:opacity-50">返回編輯</button><button type="button" disabled={isSubmitting} onClick={confirmCreate} className="pressable flex-1 rounded-2xl bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? "建立中…" : "確認建立飯局"}</button></div></section></div>}
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-bold text-slate-800">{label}</span>{helper && <span className="mt-0.5 block text-[11px] font-medium text-slate-400">{helper}</span>}<div className="mt-2">{children}</div></label>;
}

type ChatMessageRecord = { message: { id: string; content: string; createdAt: string }; author: { id: string; displayName: string; avatarUrl?: string | null } };

function ChatAvatarImage({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [avatarUrl]);
  if (avatarUrl && !failed) return <img src={avatarUrl} alt={`${name} 的會員頭像`} onError={() => setFailed(true)} className="h-full w-full object-cover" />;
  return <span aria-label={`${name} 的會員縮寫`}>{name.slice(0, 1).toUpperCase()}</span>;
}

function MessagesPage({ chatTarget, currentUserId, onOpenNotifications }: { chatTarget?: { eventId: string; eventTitle: string; memberName: string } | null; currentUserId?: string | null; onOpenNotifications: () => void }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  useEffect(() => { let active = true; void fetch("/api/notifications?unread=true", { cache: "no-store" }).then(async (response) => { const payload = await response.json().catch(() => ({})) as { notifications?: unknown[] }; if (active && response.ok) setUnreadNotifications(payload.notifications?.length ?? 0); }).catch(() => undefined); return () => { active = false; }; }, []);
  useEffect(() => { let active = true; if (!chatTarget?.eventId) { setMessages([]); setChatError(""); return () => { active = false; }; } setLoading(true); setChatError(""); void fetch(`/api/events/${chatTarget.eventId}/messages`, { cache: "no-store" }).then(async (response) => { const payload = await response.json().catch(() => ({})) as { messages?: ChatMessageRecord[]; error?: string }; if (!active) return; if (!response.ok) { setMessages([]); setChatError(payload.error === "CHAT_ACCESS_DENIED" ? "只有主辦人與已確認成員可以查看此飯局聊天室。" : payload.error === "UNAUTHENTICATED" ? "請先登入後再使用聊天室。" : "目前無法載入聊天室訊息，請稍後再試。"); return; } setMessages(payload.messages ?? []); }).catch(() => { if (active) setChatError("目前無法載入聊天室訊息，請檢查網路後再試。"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [chatTarget?.eventId, refreshToken]);
  const sendMessage = async () => {
    const content = message.trim();
    if (!content || !chatTarget?.eventId || sending) return;
    setSending(true); setChatError("");
    const response = await fetch(`/api/events/${chatTarget.eventId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).catch(() => null);
    if (!response?.ok) { setChatError("訊息未送出，請確認你仍是此飯局的已確認成員後再試。"); setSending(false); return; }
    setMessage(""); setSending(false); setRefreshToken((value) => value + 1);
  };
  return (
    <section className="page-enter flex min-h-[680px] flex-col px-4 pb-28 pt-5">
      <header className="flex items-center justify-between"><div><p className="text-[11px] font-bold tracking-[0.2em] text-violet-500">CONFIRMED TABLES</p><h1 className="mt-1 text-[28px] font-black tracking-[-0.04em] text-slate-950">一起吃飯的人</h1></div><button onClick={onOpenNotifications} aria-label={unreadNotifications ? `開啟通知中心，目前有 ${unreadNotifications} 則未讀通知` : "開啟通知中心"} className="pressable relative grid h-10 w-10 place-items-center rounded-2xl bg-white/75 shadow-sm"><Bell className="h-4 w-4 text-slate-700" />{unreadNotifications > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-pink-500 px-1 text-[9px] font-black text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}</button></header>
      <div className="mt-5 flex flex-1 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/78 shadow-[0_18px_45px_rgba(55,28,98,0.13)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5"><div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-black text-white"><ChatAvatarImage avatarUrl={messages.find((item) => item.author.id !== currentUserId)?.author.avatarUrl} name={messages.find((item) => item.author.id !== currentUserId)?.author.displayName || chatTarget?.memberName || "M"} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{chatTarget?.eventTitle || "週五夜的微醺義式晚餐"}</p><p className="mt-0.5 text-xs font-medium text-emerald-600">{chatTarget ? `飯局群組聊天室 · 可傳訊給 ${chatTarget.memberName}` : "3 位已確認成員 · 可安心聊天"}</p></div><MoreHorizontal className="h-5 w-5 text-slate-400" /></div>
        <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5">{!chatTarget ? <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-4 text-center text-xs leading-relaxed text-violet-800">請從「我的飯局」的已確認成員卡片點選「傳送訊息」，開啟對應飯局的群組聊天室。</div> : loading ? <LoadingState compact label="正在載入真實歷史訊息…" /> : chatError ? <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-xs font-bold leading-relaxed text-rose-700">{chatError}</p> : <>{messages.length === 0 && <p className="rounded-2xl bg-slate-50 p-3 text-center text-xs text-slate-500">這個飯局尚無訊息，發送第一則問候吧。</p>}{messages.map(({ message: item, author }) => <ChatBubble key={item.id} name={author.id === currentUserId ? "你" : author.displayName} text={item.content} own={author.id === currentUserId} avatarUrl={author.avatarUrl} />)}</>}<div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-[11px] leading-relaxed text-orange-700"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />請勿在聊天室要求匯款或分享敏感資訊；若有疑慮，可立即檢舉。</div></div>
        <div className="flex gap-2 border-t border-slate-100 p-3"><input disabled={!chatTarget || sending} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(); }} className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60" placeholder={chatTarget ? "輸入訊息" : "請先選擇飯局聊天室"} /><button disabled={!chatTarget || sending} onClick={() => void sendMessage()} aria-label="發送訊息" className="pressable grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" /></button></div>
      </div>
    </section>
  );
}

function ChatBubble({ name, text, own, inverse, avatarUrl }: { name: string; text: string; own?: boolean; inverse?: boolean; avatarUrl?: string | null }) {
  const isOwn = own || inverse;
  return <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : ""}`}>{!isOwn && <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 text-[10px] font-black text-violet-700"><ChatAvatarImage avatarUrl={avatarUrl} name={name} /></span>}<div className={`max-w-[82%] ${isOwn ? "order-1" : ""}`}><p className={`mb-1 text-[10px] font-bold ${isOwn ? "text-right text-violet-500" : "text-slate-400"}`}>{name}</p><p className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${isOwn ? "rounded-tr-sm bg-violet-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}>{text}</p></div></div>;
}

function ProfilePage({ onOpenPrd, userName, onLogout }: { onOpenPrd: () => void; userName?: string | null; onLogout: () => Promise<void> }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const displayName = userName || "訪客";
  const initial = displayName.slice(0, 1).toUpperCase() || "你";
  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <div className="relative overflow-visible rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_20px_45px_rgba(27,12,62,0.28)]"><div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]"><div className="mesh-orb mesh-orb-three" /></div><div className="relative flex items-start justify-between"><div className="flex gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300 via-pink-500 to-violet-600 text-lg font-black">{initial}</div><div><p className="text-lg font-black">{displayName}</p><p className="mt-1 text-xs text-violet-200">正在打造更好的相遇方式</p></div></div><div className="relative"><button type="button" onClick={() => setAccountMenuOpen((open) => !open)} aria-label="更多帳號設定" aria-expanded={accountMenuOpen} className="pressable rounded-xl bg-white/10 p-2"><MoreHorizontal className="h-4 w-4" /></button>{accountMenuOpen && <div role="menu" aria-label="帳號選單" className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-white/15 bg-slate-900/95 p-1.5 text-left shadow-2xl backdrop-blur"><p className="px-3 py-2 text-xs font-semibold text-violet-200">目前登入：{displayName}</p><div className="my-1 h-px bg-white/10" /><button role="menuitem" type="button" onClick={() => void onLogout()} className="pressable w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-200 hover:bg-rose-400/15">登出此帳號</button></div>}</div></div><div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/10 py-3 text-center backdrop-blur"><div><p className="text-base font-black">—</p><p className="mt-1 text-[10px] font-bold text-violet-200">信用分數</p></div><div><p className="text-base font-black">0</p><p className="mt-1 text-[10px] font-bold text-violet-200">已完成飯局</p></div><div><p className="text-base font-black">—</p><p className="mt-1 text-[10px] font-bold text-violet-200">點數餘額</p></div></div></div>
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

function ProfileV2({ onOpenPrd, onOpenMyEvents, userName, avatarUrl, onAvatarUpdated, onLogout, isAdmin, onOpenAdmin, verificationStatus }: { onOpenPrd: () => void; onOpenMyEvents: () => void; userName?: string | null; avatarUrl?: string | null; onAvatarUpdated: (updated: AvatarUser) => void; onLogout: () => Promise<void>; isAdmin: boolean; onOpenAdmin: () => void; verificationStatus?: "unverified" | "pending" | "verified" | "rejected" | null }) {
  const reviewDimensions = ["準時", "禮貌", "趣味"];
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [verification, setVerification] = useState(verificationStatus ?? "unverified");
  const [verificationMessage, setVerificationMessage] = useState("");
  const displayName = userName || "訪客";
  const initial = displayName.slice(0, 1).toUpperCase() || "你";
  const { insights, state: insightsState } = useProfileInsights();
  const summaryReady = insightsState === "ready" && insights;
  const summaryCredit = summaryReady ? `${insights.creditScore} 分` : insightsState === "loading" ? "整理中" : "待累積";
  const summaryCompleted = summaryReady ? `${insights.completedEventCount} 場` : "0 場";
  const summaryAttendance = summaryReady && insights.attendanceRate !== null ? `${insights.attendanceRate}%` : insightsState === "loading" ? "整理中" : "待累積";
  const requestVerification = async () => { const response = await fetch("/api/me/verification", { method: "POST" }).catch(() => null); if (!response?.ok) { setVerificationMessage("驗證申請未送出，請稍後再試。"); return; } setVerification("pending"); setVerificationMessage("申請已送出，管理員將進行簡易審核。"); };
  return (
    <section className="page-enter px-4 pb-28 pt-5">
      <div className="relative overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_20px_45px_rgba(27,12,62,0.28)]">
        <div className="mesh-orb mesh-orb-three" />
        <div className="relative flex items-start justify-between">
          <div className="flex gap-3"><ProfileAvatarEditor user={{ displayName, avatarUrl }} onUpdated={onAvatarUpdated} /><div><p className="text-lg font-black">{displayName}</p><p className="mt-1 text-xs text-violet-200">建立你的第一筆飯局紀錄</p></div></div>
          <div className="relative"><button type="button" onClick={() => setAccountMenuOpen((open) => !open)} aria-label="更多帳號設定" aria-expanded={accountMenuOpen} className="pressable rounded-xl bg-white/10 p-2"><MoreHorizontal className="h-4 w-4" /></button>{accountMenuOpen && <div role="menu" aria-label="帳號選單" className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-white/15 bg-slate-900/95 p-1.5 text-left shadow-2xl backdrop-blur"><p className="px-3 py-2 text-xs font-semibold text-violet-200">目前登入：{displayName}</p>{isAdmin && <button role="menuitem" type="button" onClick={() => { setAccountMenuOpen(false); onOpenAdmin(); }} className="pressable mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-violet-100 hover:bg-violet-400/15">開啟 Admin 後台</button>}<div className="my-1 h-px bg-white/10" /><button role="menuitem" type="button" onClick={() => void onLogout()} className="pressable w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-200 hover:bg-rose-400/15">登出此帳號</button></div>}</div>
        </div>
        <div aria-label={`個人摘要：信用分數 ${summaryCredit}，已完成飯局 ${summaryCompleted}，出席率 ${summaryAttendance}`} className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/10 py-3 text-center backdrop-blur">
          <div><p className="text-base font-black">{summaryCredit}</p><p className="mt-1 text-[10px] font-bold text-violet-200">信用分數</p></div>
          <div><p className="text-base font-black">{summaryCompleted}</p><p className="mt-1 text-[10px] font-bold text-violet-200">已完成飯局</p></div>
          <div><p className="text-base font-black">{summaryAttendance}</p><p className="mt-1 text-[10px] font-bold text-violet-200">出席率</p></div>
        </div>
      </div>
      <ProfileInsights insights={insights} state={insightsState} />
      <VerificationStatusCard isAdmin={isAdmin} verification={verification} verificationMessage={verificationMessage} onRequestVerification={() => void requestVerification()} />
      <div className="mt-3 rounded-[24px] border border-violet-100 bg-violet-50 p-4"><p className="text-sm font-black text-violet-950">平台資格與安全規範</p><p className="mt-1 text-xs leading-relaxed text-violet-800">請尊重他人並遵守飯局約定。若涉及騷擾、詐騙、危害安全或其他違反規範情形，平台得限制帳號功能、停權或取消使用資格；請勿事先匯款，並保護個人隱私。</p></div>
      <div className="mt-3 rounded-[24px] border border-amber-100 bg-amber-50 p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-white"><Crown className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-black text-amber-950">DineLink Plus</p><p className="mt-0.5 text-xs text-amber-800">優先曝光與更多精準篩選條件</p></div><ChevronRight className="h-4 w-4 text-amber-700" /></div></div>
      <button onClick={onOpenMyEvents} aria-label="前往我的飯局管理與完成飯局" className="pressable mt-3 flex w-full items-center justify-between rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white"><CalendarDays className="h-5 w-5" /></span><span><span className="block text-sm font-black text-emerald-950">我的飯局</span><span className="mt-0.5 block text-xs leading-relaxed text-emerald-700">要完成飯局？先標記成員出席，再點「完成飯局並前往評價」</span></span></span><ChevronRight className="h-4 w-4 text-emerald-600" /></button>
      <button onClick={onOpenPrd} className="pressable mt-3 flex w-full items-center justify-between rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></span><span><span className="block text-sm font-black text-violet-950">產品規格與開發藍圖</span><span className="mt-0.5 block text-xs text-violet-600">查看 MVP 模組、技術架構與 Roadmap</span></span></span><ChevronRight className="h-4 w-4 text-violet-500" /></button>
    </section>
  );
}

function VerificationStatusCard({ isAdmin, verification, verificationMessage, onRequestVerification }: { isAdmin: boolean; verification: "unverified" | "pending" | "verified" | "rejected"; verificationMessage: string; onRequestVerification: () => void }) {
  if (isAdmin) return <div data-testid="admin-authorization-card" className="mt-3 rounded-[24px] border border-violet-100 bg-violet-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-violet-950">管理者帳號</p><p className="mt-1 text-xs leading-relaxed text-violet-800">此帳號已獲平台管理者授權，可使用營運後台功能，不需另行申請會員驗證。</p></div><span className="shrink-0 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white">管理者已授權</span></div></div>;
  return <div className="mt-3 rounded-[24px] border border-sky-100 bg-sky-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-sky-950">帳號驗證</p><p className="mt-1 text-xs leading-relaxed text-sky-800">{verification === "verified" ? "你的帳號已完成驗證。" : verification === "pending" ? "驗證申請已送出，等待管理員審核。" : verification === "rejected" ? "上次驗證未通過，你可以重新提出申請。" : "完成簡易驗證後，後台會標示為已驗證會員。"}</p>{verificationMessage && <p role="status" className="mt-2 text-xs font-semibold text-sky-700">{verificationMessage}</p>}</div>{verification !== "verified" && verification !== "pending" && <button type="button" onClick={onRequestVerification} className="pressable shrink-0 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white">申請驗證</button>}<span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${verification === "verified" ? "bg-emerald-100 text-emerald-700" : verification === "pending" ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500"}`}>{verification === "verified" ? "已驗證" : verification === "pending" ? "審核中" : "未驗證"}</span></div></div>;
}

type InsightPayload = { creditScore: number; completedEventCount: number; attendanceRate: number | null; attendanceTotal: number; trend: Array<{ label: string; score: number }>; dimensions: { punctuality: number | null; politeness: number | null; interaction: number | null } };

type InsightState = "loading" | "ready" | "empty" | "error";

function useProfileInsights() {
  const [insights, setInsights] = useState<InsightPayload | null>(null);
  const [state, setState] = useState<InsightState>("loading");
  useEffect(() => { let active = true; void fetch("/api/me/insights", { cache: "no-store" }).then(async (response) => { if (!active) return; if (response.status === 401) { setState("empty"); return; } if (!response.ok) { setState("error"); return; } const result = await response.json() as InsightPayload; setInsights(result); setState(result.trend.length || result.attendanceTotal || result.completedEventCount ? "ready" : "empty"); }).catch(() => { if (active) setState("error"); }); return () => { active = false; }; }, []);
  return { insights, state };
}

function ProfileInsights({ insights, state }: { insights: InsightPayload | null; state: InsightState }) {
  if (state === "loading") return <LoadingState className="mt-5" compact label="正在整理你的信用與出席紀錄…" />;
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
  const eventDate = (value: string) => new Date(value).toLocaleString("zh-TW", { timeZone: TAIPEI_TIME_ZONE, month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
  const statusLabel = (status: string) => ({ pending: "等待主辦人審核", approved: "已確認", rejected: "未被接受", withdrawn: "已撤回", cancelled: "已取消" }[status] ?? status);
  return <section className="page-enter px-4 pb-10 pt-5"><button onClick={onBack} className="pressable mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />返回個人主頁</button><div className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_18px_45px_rgba(27,12,62,0.25)]"><p className="text-[11px] font-bold tracking-[0.2em] text-emerald-200">MY DINING PLANS</p><h1 className="mt-2 text-[29px] font-black tracking-[-0.04em]">我的飯局</h1><p className="mt-2 text-sm leading-relaxed text-emerald-100">追蹤我發起與我申請的飯局，審核成員並保留取消、出席與信用紀錄。</p></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-1.5 shadow-sm"><button onClick={() => setActiveList("hosted")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${activeList === "hosted" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我發起的飯局</button><button onClick={() => setActiveList("applied")} className={`pressable rounded-xl py-2.5 text-sm font-bold ${activeList === "applied" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>我已申請的飯局</button></div>{loading && <div className="mt-4 rounded-2xl bg-white/80 p-5 text-center text-sm font-semibold text-slate-500">正在讀取你的飯局…</div>}{error && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><p>{error}</p>{error.startsWith("請先登入") ? <a href="/api/auth/login" className="mt-3 inline-flex rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">登入並查看我的飯局</a> : <button onClick={() => void load()} className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">重新讀取</button>}</div>}{!loading && !error && activeList === "hosted" && <div className="mt-4 space-y-3">{data?.hosted.length === 0 && <EmptyMyEvents title="尚未發起飯局" text="發起第一場飯局後，可在此審核申請與管理已確認成員。" />}{data?.hosted.map(({ event, pendingApplications, attendances }) => <div key={event.id} className="rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">{eventDate(event.eventStartAt)} · {event.restaurantName || event.venueAddress}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{event.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-center"><div><p className="text-base font-black text-slate-900">{pendingApplications.length}</p><p className="text-[10px] font-bold text-slate-500">待審核申請</p></div><div><p className="text-base font-black text-slate-900">{attendances.length} / {event.capacity}</p><p className="text-[10px] font-bold text-slate-500">已確認成員</p></div></div>{pendingApplications.length > 0 && <div className="mt-3 space-y-2"><p className="text-xs font-black text-slate-700">待審核成員</p>{pendingApplications.map(({ application, applicant }) => <div key={application.id} className="rounded-2xl border border-slate-100 p-3"><p className="text-sm font-bold text-slate-800">{applicant.displayName}</p><p className="mt-1 text-xs text-slate-500">{application.introduction || "尚未留下自我介紹"}</p><div className="mt-3 flex gap-2"><button disabled={reviewing === application.id} onClick={() => void review(application.id, "approved")} className="pressable flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white disabled:opacity-50">核准</button><button disabled={reviewing === application.id} onClick={() => void review(application.id, "rejected")} className="pressable flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">拒絕</button></div></div>)}</div>}<div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-xs font-black text-emerald-950">已確認成員與出席紀錄</p>{attendances.length === 0 ? <p className="mt-1 text-xs text-emerald-800">尚無已確認成員。</p> : <div className="mt-2 space-y-2">{attendances.map(({ attendance, member }) => <div key={attendance.id} className="rounded-xl bg-white p-2.5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800">{member.displayName}</span><span className="text-[10px] font-bold text-emerald-700">{attendance.status}</span></div><div className="mt-2 grid grid-cols-3 gap-1"><button onClick={() => void updateAttendance(event.id, attendance.userId, "attended")} className="rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white">出席</button><button onClick={() => void updateAttendance(event.id, attendance.userId, "late")} className="rounded-lg bg-amber-100 py-1.5 text-[10px] font-bold text-amber-800">遲到</button><button onClick={() => void updateAttendance(event.id, attendance.userId, "no_show")} className="rounded-lg bg-rose-100 py-1.5 text-[10px] font-bold text-rose-700">爽約</button></div></div>)}</div>}<p className="mt-2 text-[11px] leading-relaxed text-emerald-800">取消規則：申請者可在飯局開始前取消；已確認參與者取消後會退出聊天室，主辦人可更新出席紀錄。</p></div></div>)}</div>}{!loading && !error && activeList === "applied" && <div className="mt-4 space-y-3">{data?.applied.length === 0 && <EmptyMyEvents title="尚未申請飯局" text="在探索頁選擇合適的飯局送出申請，審核結果會顯示在這裡。" />}{data?.applied.map(({ application, event, host }) => <div key={application.id} className="rounded-[24px] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">主辦人 {host.displayName} · {eventDate(event.eventStartAt)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${application.status === "approved" ? "bg-emerald-50 text-emerald-700" : application.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(application.status)}</span></div><p className="mt-3 text-xs leading-relaxed text-slate-500">{application.status === "approved" ? "你已是確認成員，可進入群組聊天室並留意開始前提醒。" : "申請狀態與取消規則會全程保留；主辦人審核後會以通知提醒。"}</p>{["pending", "approved"].includes(application.status) && <button onClick={() => void cancelApplication(application.id)} className="pressable mt-3 w-full rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-bold text-rose-700">{application.status === "approved" ? "取消參與並退出聊天室" : "取消申請"}</button>}</div>)}</div>}</section>;
}

function EmptyMyEvents({ title, text }: { title: string; text: string }) { return <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center"><CalendarDays className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-black text-emerald-950">{title}</p><p className="mt-1 text-xs leading-relaxed text-emerald-800">{text}</p></div>; }

function EventShareActions({ event }: { event: DiningEvent }) {
  const [copied, setCopied] = useState(false);
  const sharePath = `/events/${encodeURIComponent(String(event.id))}`;
  const shareUrl = typeof window === "undefined" ? sharePath : `${window.location.origin}${sharePath}`;
  const shareText = `想找人一起吃「${event.title}」！${event.date} ${event.time}，店名：${event.restaurant}，地址：${event.venueAddress || event.neighborhood}。`;
  const threadsText = `📍 集合地點\n店名：${event.restaurant}\n完整地址：${event.venueAddress || event.neighborhood}\n\n🍽 ${event.title}\n🕐 ${event.date} ${event.time}\n\n一起加入 DineLink 飯局！`;
  const threadsUrl = `https://www.threads.com/intent/post?text=${encodeURIComponent(threadsText)}&url=${encodeURIComponent(shareUrl)}&tag=DineLink`;
  const copyLink = async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { window.prompt("請複製此分享連結", shareUrl); } };
  const systemShare = async () => { if (navigator.share) { try { await navigator.share({ title: event.title, text: shareText, url: shareUrl }); return; } catch (error) { if ((error as DOMException).name === "AbortError") return; } } await copyLink(); };
  return <section aria-label="分享飯局" className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/80 p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-900">分享這場飯局</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">分享連結僅包含公開飯局資訊，不會公開申請或成員資料。</p></div><Share2 className="h-5 w-5 shrink-0 text-sky-600" /></div><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => void copyLink()} className="pressable rounded-xl bg-white px-2 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm">{copied ? "已複製" : <><Copy className="mr-1 inline h-3.5 w-3.5" />複製連結</>}</button><button onClick={() => void systemShare()} className="pressable rounded-xl bg-slate-950 px-2 py-2.5 text-[11px] font-bold text-white"><Share2 className="mr-1 inline h-3.5 w-3.5" />更多分享</button><a href={threadsUrl} target="_blank" rel="noreferrer" className="pressable rounded-xl bg-[#101010] px-2 py-2.5 text-center text-[11px] font-bold text-white">分享到 Threads</a></div></section>;
}

function EventShareFab({ event }: { event: DiningEvent }) {
  const [open, setOpen] = useState(false);
  return <div className="fixed right-4 z-[70]" style={{ bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))" }}><button onClick={() => setOpen((value) => !value)} aria-label="分享飯局" className="pressable grid h-12 w-12 place-items-center rounded-full bg-sky-600 text-white shadow-[0_12px_28px_rgba(2,132,199,0.42)]"><Share2 className="h-5 w-5" /></button>{open && <div className="absolute bottom-14 right-0 w-[min(340px,calc(100vw-2rem))] rounded-[24px] bg-white p-1 shadow-[0_18px_45px_rgba(15,23,42,0.22)]"><EventShareActions event={event} /></div>}</div>;
}

function EventDetail({ event, onClose, shareActions }: { event: DiningEvent; onClose: () => void; shareActions?: React.ReactNode }) {
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const submitApplication = async () => {
    if (applied || submitting) return;
    setSubmitting(true); setApplicationError("");
    const response = await fetch(`/api/events/${event.id}/applications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => null);
    const payload = await response?.json().catch(() => ({})) as { error?: string } | undefined;
    if (!response?.ok) {
      const messages: Record<string, string> = { UNAUTHENTICATED: "請先登入後再送出飯局申請。", DUPLICATE_APPLICATION: "你已送出過這場飯局的申請，請等待主辦人審核。", EVENT_NOT_OPEN: "這場飯局目前已不開放報名。", HOST_CANNOT_APPLY: "主辦人無法申請自己的飯局。", INSUFFICIENT_POINTS: "目前點數不足，無法完成報名申請。" };
      setApplicationError(messages[payload?.error || ""] || "報名申請未送出，請稍後再試。"); setSubmitting(false); return;
    }
    setApplied(true); setSubmitting(false);
  };
  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-sm"><section className="page-enter max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] bg-[#fcfbff] p-4 pb-8 shadow-2xl"><div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" /><div className={`relative h-40 overflow-hidden rounded-[25px] bg-gradient-to-br ${event.color} p-4 text-white`}><button onClick={onClose} aria-label="關閉詳情" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/15 backdrop-blur"><X className="h-4 w-4" /></button><span className="inline-flex rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em]">{event.cuisine}</span><h2 className="absolute bottom-4 left-4 right-12 text-[25px] font-black leading-tight tracking-[-0.04em]">{event.title}</h2></div><div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm"><div className={`grid h-10 w-10 place-items-center overflow-hidden rounded-2xl ${event.accent} text-sm font-black text-white`}>{event.hostAvatarUrl ? <img src={event.hostAvatarUrl} alt={`${event.host} 的頭像`} className="h-full w-full object-cover" /> : event.hostInitial}</div><div><p className="text-sm font-black text-slate-900">由 {event.host} 發起</p><p className="mt-0.5 text-xs text-slate-500">完整資料驗證後顯示信用概況</p></div></div><div className="mt-4 grid grid-cols-2 gap-2">{[[<CalendarDays />, `${event.date} · ${event.time}`], [<MapPin />, `店名：${event.restaurant}`], [<MapPin />, `地址：${event.venueAddress || event.neighborhood}`], [<Users />, event.capacity], [<WalletCards />, `${event.payment} · ${event.budget}`]].map(([icon, value], index) => <div key={index} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-xs font-bold leading-relaxed text-slate-700 shadow-sm"><span className="text-violet-500">{icon}</span>{value}</div>)}</div><div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-3.5 text-xs leading-relaxed text-violet-950"><ShieldCheck className="mr-1 inline h-4 w-4 text-violet-600" /><b>審核與出席提示：</b>送出申請前會明確顯示取消期限、出席期望與爽約處理方式；主辦人核准後才會進入確認成員名單與聊天室。</div><div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm"><p className="text-sm font-black text-slate-900">已確認成員</p><div className="mt-3 flex items-center gap-2"><div className="flex -space-x-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-fuchsia-500 text-[10px] font-bold text-white">M</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-violet-500 text-[10px] font-bold text-white">K</span></div><span className="text-xs font-medium text-slate-500">報名核准後顯示成員完整資訊</span></div></div>{shareActions}{applicationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold leading-relaxed text-rose-700">{applicationError}{applicationError.startsWith("請先登入") && <a href="/api/auth/login" className="mt-2 inline-block rounded-lg bg-slate-950 px-3 py-2 text-xs text-white">立即登入</a>}</div>}<button disabled={applied || submitting} onClick={() => void submitApplication()} className={`pressable mt-4 w-full rounded-2xl py-3.5 text-sm font-bold shadow-[0_12px_24px_rgba(15,23,42,0.2)] ${applied ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"} disabled:opacity-70`}>{applied ? "申請已送出，等待主辦人審核" : submitting ? "送出申請中…" : "送出報名申請"}</button></section></div>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "explore";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "create" || tab === "messages" || tab === "profile" ? tab : "explore";
  });
  const [activeEvent, setActiveEvent] = useState<DiningEvent | null>(null);
  const [events, setEvents] = useState<DiningEvent[]>(() => DINING_EVENTS);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [creationNotice, setCreationNotice] = useState("");
  const [showPrd, setShowPrd] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "prd");
  const [showMyEvents, setShowMyEvents] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "my-events");
  const [myEventsInitialView, setMyEventsInitialView] = useState<"list" | "calendar" | "notifications" | "reviews">(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "notifications" ? "notifications" : "list");
  const [showAdmin, setShowAdmin] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "admin");
  const [chatTarget, setChatTarget] = useState<{ eventId: string; eventTitle: string; memberName: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "messages" && params.get("eventId") ? { eventId: params.get("eventId")!, eventTitle: params.get("eventTitle") || "飯局聊天室", memberName: params.get("member") || "確認成員" } : null;
  });
  const [sessionUser, setSessionUser] = useState<{ id?: string; displayName?: string | null; name?: string | null; avatarUrl?: string | null; role?: "member" | "moderator" | "admin"; verificationStatus?: "unverified" | "pending" | "verified" | "rejected" } | null>(null);

  useEffect(() => { let active = true; void fetch("/api/events", { cache: "no-store" }).then(async (response) => { if (!response.ok || !active) return; const payload = await response.json() as { events?: ApiEventRow[] }; if (active && payload.events?.length) setEvents(payload.events.map(eventFromApi)); }).catch(() => undefined).finally(() => { if (active) setEventsLoading(false); }); return () => { active = false; }; }, []);

  useEffect(() => { let active = true; void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => { const payload = await response.json().catch(() => ({ user: null })); if (active) setSessionUser(payload.user ?? null); }).catch(() => { if (active) setSessionUser(null); }); return () => { active = false; }; }, []);

  useEffect(() => { const sharedEventId = new URLSearchParams(window.location.search).get("event"); if (!sharedEventId) return; const sharedEvent = events.find((event) => String(event.id) === sharedEventId); if (sharedEvent) { setActiveTab("explore"); setActiveEvent(sharedEvent); } }, [events]);

  useEffect(() => { const syncDeepLink = () => { const tab = new URLSearchParams(window.location.search).get("tab"); if (tab === "my-events") setShowMyEvents(true); }; window.addEventListener("dine-link:navigate", syncDeepLink); return () => window.removeEventListener("dine-link:navigate", syncDeepLink); }, []);

  const handleEventCreated = (event: DiningEvent) => {
    setEvents((current) => [event, ...current]);
    setCreationNotice(`「${event.title}」已建立，現在已顯示在探索清單中。`);
    setActiveTab("explore");
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { setSessionUser(null); setActiveTab("explore"); }
  };

  const userName = sessionUser?.displayName || sessionUser?.name || null;
  const isAdmin = sessionUser?.role === "admin";
  const handleAvatarUpdated = (updated: AvatarUser) => {
    setSessionUser((current) => current ? { ...current, avatarUrl: updated.avatarUrl ?? null, displayName: updated.displayName ?? current.displayName } : current);
    void fetch("/api/events", { cache: "no-store" }).then(async (response) => { if (!response.ok) return; const payload = await response.json() as { events?: ApiEventRow[] }; if (payload.events) setEvents(payload.events.map(eventFromApi)); }).catch(() => undefined);
  };
  const openAdmin = () => { setShowAdmin(true); window.history.replaceState({}, "", "?tab=admin"); };
  const openNotifications = () => { setMyEventsInitialView("notifications"); setShowMyEvents(true); window.history.replaceState({}, "", "?tab=my-events&view=notifications"); };
  const content = showAdmin ? <AdminDashboard onBack={() => { setShowAdmin(false); window.history.replaceState({}, "", "?tab=profile"); }} /> : showPrd ? <PrdPage onBack={() => setShowPrd(false)} /> : showMyEvents ? <MyEventsManagement initialView={myEventsInitialView} onBack={() => { setShowMyEvents(false); setMyEventsInitialView("list"); }} onOpenChat={(target) => { setChatTarget(target); setShowMyEvents(false); setMyEventsInitialView("list"); setActiveTab("messages"); window.history.replaceState({}, "", `?tab=messages&eventId=${encodeURIComponent(target.eventId)}&eventTitle=${encodeURIComponent(target.eventTitle)}&member=${encodeURIComponent(target.memberName)}`); }} /> : activeTab === "explore" ? <ExplorePage events={events} notice={creationNotice} onOpen={setActiveEvent} userName={userName} userAvatarUrl={sessionUser?.avatarUrl} onAccountClick={() => setActiveTab("profile")} loading={eventsLoading} /> : activeTab === "create" ? <CreatePage onCreated={handleEventCreated} /> : activeTab === "messages" ? <MessagesPage chatTarget={chatTarget} currentUserId={sessionUser?.id} onOpenNotifications={openNotifications} /> : <ProfileV2 onOpenPrd={() => setShowPrd(true)} onOpenMyEvents={() => setShowMyEvents(true)} userName={userName} avatarUrl={sessionUser?.avatarUrl} onAvatarUpdated={handleAvatarUpdated} onLogout={handleLogout} isAdmin={isAdmin} onOpenAdmin={openAdmin} verificationStatus={sessionUser?.verificationStatus} />;
  return <main className="min-h-screen bg-[#17152a] p-0 font-sans text-slate-900 sm:p-5"><div className={`phone-shell relative mx-auto min-h-screen overflow-hidden bg-[#f7f5ff] ${showAdmin ? "max-w-5xl" : "max-w-md"} sm:min-h-[calc(100vh-40px)] sm:rounded-[34px] sm:shadow-[0_30px_100px_rgba(1,3,30,0.55)]`}><div className="ambient-glow ambient-one" /><div className="ambient-glow ambient-two" /> <div className="relative min-h-screen">{content}</div>{!showPrd && !showMyEvents && !showAdmin && <nav aria-label="主要導覽" className="absolute bottom-0 left-0 right-0 z-40 border-t border-white/70 bg-white/85 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl"><div className="grid grid-cols-4">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? "page" : undefined} className="pressable flex flex-col items-center gap-1.5 px-1 py-1.5"><span className={`grid h-9 w-11 place-items-center rounded-xl transition ${activeTab === id ? "bg-slate-950 text-white shadow-lg" : "text-slate-400"}`}><Icon className={`h-[18px] w-[18px] ${id === "create" && activeTab !== id ? "text-fuchsia-500" : ""}`} /></span><span className={`text-[10px] font-bold ${activeTab === id ? "text-slate-950" : "text-slate-400"}`}>{label}</span></button>)}</div></nav>}{activeEvent && <EventDetail event={activeEvent} onClose={() => setActiveEvent(null)} shareActions={<EventShareActions event={activeEvent} />} />}</div></main>;
}
