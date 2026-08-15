import { ImageResponse } from "next/og";
import { getPublicEvent } from "@/lib/public-events";

export const runtime = "nodejs";
export const alt = "DineLink 公開飯局分享卡片";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ eventId: string }> };

export default async function EventOpenGraphImage({ params }: Props) {
  const { eventId } = await params;
  const publicEvent = await getPublicEvent(eventId);
  const event = publicEvent?.event;
  const time = event ? new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(event.eventStartAt) : "公開飯局";
  const status = event?.status === "cancelled" ? "已取消" : event?.previousStartAt ? "時間已更新" : "公開募集中";
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #110a2b 0%, #3d146b 52%, #e95092 100%)", color: "white", padding: "64px", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: 9999, background: "rgba(255, 151, 75, .38)", right: -160, top: -190 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 700, letterSpacing: 6, color: "#f3d7ff" }}><span>DINE LINK</span><span>{status}</span></div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.15, fontWeight: 800, letterSpacing: -2 }}>{event?.title || "一起吃飯，認識新朋友"}</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: "#f8d6e8" }}>{time}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 28, color: "#ffffff" }}>{event?.restaurantName || "餐廳待確認"}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 22, color: "#eadcff" }}>{event?.venueAddress || "在 DineLink 查看完整集合地點"}</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#f8d6e8" }}>DineLink 約飯｜好好吃飯，認識新朋友</div>
      </div>
    </div>,
    size,
  );
}
