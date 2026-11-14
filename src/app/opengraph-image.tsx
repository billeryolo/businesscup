import { ImageResponse } from "next/og";

export const alt = "ReadCheck: is your child reading on track? A one-minute reading check for grades 1 to 4.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BAND = [
  { w: 22, c: "#f3d6d2" },
  { w: 18, c: "#fbe7c2" },
  { w: 30, c: "#dcefe7" },
  { w: 30, c: "#c4e3d6" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#fbf8f3", color: "#1f2933" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 14, background: "#2f6f62", color: "#fff", fontSize: 30, fontWeight: 700, alignItems: "center", justifyContent: "center" }}>
            Rc
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>ReadCheck</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>Is your child reading on track?</div>
          <div style={{ display: "flex", fontSize: 34, color: "#52606d" }}>A one-minute read-aloud check for grades 1–4, compared with national norms.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", position: "relative", height: 40, borderRadius: 20, overflow: "hidden" }}>
            {BAND.map((b, i) => (
              <div key={i} style={{ display: "flex", width: `${b.w}%`, height: "100%", background: b.c }} />
            ))}
            <div style={{ position: "absolute", left: "58%", top: 0, bottom: 0, width: 8, background: "#2f6f62", borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#52606d" }}>
            <div style={{ display: "flex" }}>Words correct per minute</div>
            <div style={{ display: "flex", color: "#2f6f62", fontWeight: 700 }}>Free · 1 minute · no sign-up</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
