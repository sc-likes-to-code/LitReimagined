import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E0C14",
      }}
    >
      <svg width="84" height="112" viewBox="0 0 48 64">
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
    </div>,
    size,
  );
}
