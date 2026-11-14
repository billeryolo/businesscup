import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2f6f62" }}>
        <div style={{ display: "flex", position: "relative", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", left: -8, right: -8, bottom: 6, height: 26, background: "#f6c453", borderRadius: 4 }} />
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: "#ffffff", letterSpacing: -2 }}>Rc</div>
        </div>
      </div>
    ),
    size,
  );
}
