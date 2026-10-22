import { PLATFORMS, type Platform, type Tag } from "@/lib/quicker-data";
import { cn } from "@/lib/utils";

export function PlatformBadge({ p, size = 16, className }: { p: Platform; size?: number; className?: string }) {
  const meta = PLATFORMS.find((x) => x.id === p);
  if (!meta) return null;
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-[5px] font-bold text-primary-foreground ring-2 ring-card", className)}
      data-platform={p}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
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
