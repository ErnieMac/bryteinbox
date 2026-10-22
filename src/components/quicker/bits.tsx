import { PLATFORMS, TAGS, type Platform, type Tag } from "@/lib/quicker-data";
import { cn } from "@/lib/utils";

export function PlatformBadge({ p, size = 16, className }: { p: Platform; size?: number; className?: string }) {
  const meta = PLATFORMS.find((x) => x.id === p)!;
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-[5px] font-bold text-primary-foreground ring-2 ring-card", className)}
      style={{ background: meta.color, width: size, height: size, fontSize: size * 0.5 }}
    >
      {meta.letter}
    </span>
  );
}

export function Avatar({ name, hue, size = 36, platform }: { name: string; hue: number; size?: number; platform?: Platform }) {
  const initials = name.replace("#", "").split(/[\s·-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-semibold text-foreground"
        style={{ background: `oklch(0.86 0.07 ${hue})`, fontSize: size * 0.36 }}
      >
        {initials}
      </div>
      {platform && <PlatformBadge p={platform} size={size * 0.42} className="absolute -bottom-0.5 -right-0.5" />}
    </div>
  );
}

export function TagPill({ tag, suggested, onClick }: { tag: Tag; suggested?: boolean; onClick?: () => void }) {
  const hue = TAGS.find((t) => t.id === tag)?.hue ?? 60;
  return (
    <span
      onClick={onClick}
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium", suggested && "border border-dashed cursor-pointer")}
      style={{
        background: suggested ? "transparent" : `oklch(0.93 0.05 ${hue})`,
        color: `oklch(0.42 0.12 ${hue})`,
        borderColor: `oklch(0.7 0.1 ${hue})`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `oklch(0.6 0.15 ${hue})` }} />
      {suggested ? `Suggested: ${tag}` : tag}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-card px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground shadow-sm">{children}</kbd>;
}
