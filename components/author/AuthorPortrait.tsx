import { cn } from "@/lib/utils";

const PALETTES = [
  ["#e9b8a6", "#b9604a"],
  ["#8fa9c4", "#2f4a6b"],
  ["#9db39a", "#3a5a40"],
  ["#c9a24a", "#6b4a12"],
  ["#b7a1d8", "#4a3a7a"],
  ["#7ac7c4", "#1f5a63"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Monogram portrait: a consistent, designed stand-in until real portraits are added. */
export function AuthorPortrait({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  const [a, b] = PALETTES[hash(slug) % PALETTES.length];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      aria-hidden
      className={cn(
        "font-display relative grid aspect-square place-items-center overflow-hidden rounded-full text-[#1b1722]",
        className,
      )}
      style={{ background: `radial-gradient(circle at 30% 25%, ${a}, ${b})` }}
    >
      <span className="text-[2.6em] leading-none italic opacity-85">{initials}</span>
      <span className="absolute inset-[7%] rounded-full border border-current opacity-25" />
    </div>
  );
}
