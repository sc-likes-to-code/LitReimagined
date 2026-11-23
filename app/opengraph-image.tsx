import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background:
          "radial-gradient(ellipse at 75% 0%, rgba(255,90,54,0.35), transparent 60%), #0E0C14",
        color: "#F3EBDD",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="48" height="64" viewBox="0 0 48 64">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FF9A3C" />
              <stop offset="1" stopColor="#FF4B2E" />
            </linearGradient>
          </defs>
          <path
            d="M9 3h30a5 5 0 0 1 5 5v53.2a1 1 0 0 1-1.6.8L24 48.4 5.6 62a1 1 0 0 1-1.6-.8V8a5 5 0 0 1 5-5Z"
            fill="url(#g)"
          />
          <path
            d="M34.5 12C23 13.5 16.5 22.5 15.5 36c8.5-1.6 16.8-8 19-24Z"
            fill="#0E0C14"
          />
        </svg>
        <div style={{ fontSize: 40, letterSpacing: -1 }}>{siteConfig.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 120, lineHeight: 1, letterSpacing: -4 }}>Classics,</div>
        <div
          style={{ fontSize: 120, lineHeight: 1, letterSpacing: -4, color: "#FF7A3C" }}
        >
          reimagined.
        </div>
      </div>
      <div style={{ fontSize: 30, color: "#A79F92" }}>{siteConfig.tagline}</div>
    </div>,
    size,
  );
}
