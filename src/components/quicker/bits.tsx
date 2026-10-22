import { PLATFORMS, type Platform, type Tag } from "@/lib/quicker-data";
import { cn } from "@/lib/utils";

// Official brand glyphs (24x24, Simple Icons paths; iMessage drawn to match Apple's bubble mark).
const GLYPHS: Record<Platform, string> = {
  imessage:
    "M12 3C6.48 3 2 6.69 2 11.18c0 2.55 1.48 4.82 3.79 6.3-.09 1.06-.55 2.5-1.6 3.52 0 0 2.83-.36 4.72-1.66 1 .27 2.03.4 3.09.4 5.52 0 10-3.69 10-8.56S17.52 3 12 3z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  slack:
    "M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z",
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
};

export function PlatformBadge({ p, size = 16, className }: { p: Platform; size?: number; className?: string }) {
  const meta = PLATFORMS.find((x) => x.id === p);
  if (!meta) return null;
  const glyph = size * 0.62;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[5px] text-white ring-2 ring-card", className)}
      data-platform={p}
      style={{ width: size, height: size, background: meta.color }}
    >
      <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="currentColor" aria-hidden="true">
        <path d={GLYPHS[p]} />
      </svg>
    </span>
  );
}

export function Avatar({ name, hue, size = 36, platform }: { name: string; hue: number; size?: number; platform?: Platform }) {
  const initials = name.replace("#", "").split(/[\s·-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="contact-avatar flex h-full w-full items-center justify-center rounded-full font-semibold text-foreground"
        data-tone={hue % 3}
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </div>
      {platform && <PlatformBadge p={platform} size={size * 0.42} className="absolute -bottom-0.5 -right-0.5" />}
    </div>
  );
}

export function TagPill({ tag, suggested, onClick }: { tag: Tag; suggested?: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium", suggested && "border border-dashed cursor-pointer")}
      data-tag={tag}
    >
      <span className="tag-dot h-1.5 w-1.5 rounded-full" />
      {suggested ? `Suggested: ${tag}` : tag}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-card px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground shadow-sm">{children}</kbd>;
}
