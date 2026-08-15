import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DineLink 約飯｜好好吃飯，認識新朋友";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #110a2b 0%, #3d146b 50%, #e95092 100%)", color: "white", padding: "72px", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 9999, background: "rgba(255, 151, 75, .45)", right: -150, top: -180 }} />
      <div style={{ position: "absolute", width: 360, height: 360, borderRadius: 9999, background: "rgba(109, 86, 255, .52)", right: 180, bottom: -190 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", width: "100%" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, fontWeight: 700, color: "#f3d7ff" }}>DINE DIFFERENT</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, letterSpacing: -3 }}>DineLink</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 36, color: "#f6eaff" }}>Dining • Social • Taipei</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#f8d6e8" }}>Make your next meal a new connection.</div>
      </div>
    </div>,
    size,
  );
}
