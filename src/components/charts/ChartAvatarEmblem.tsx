import { cn } from "@/lib/utils";

function memberInitials(displayName: string | null | undefined, username: string): string {
  const source = (displayName?.trim() || username).replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function avatarHue(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash + username.charCodeAt(i) * (i + 1)) % 360;
  }
  return hash;
}

export type ChartAvatarEmblemKind = "long" | "short" | "fueled" | "journal" | "win" | "loss" | "flat";

const RING: Record<ChartAvatarEmblemKind, string> = {
  long: "ring-2 ring-emerald-500 shadow-[0_0_0_1px_rgba(5,150,105,0.25)]",
  short: "ring-2 ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,0.2)]",
  fueled: "ring-[2.5px] ring-[var(--pf-red)] shadow-[0_0_0_1px_rgba(227,27,35,0.35)]",
  journal: "ring-2 ring-indigo-500",
  win: "ring-2 ring-emerald-500",
  loss: "ring-2 ring-rose-500",
  flat: "ring-2 ring-slate-400",
};

const SIZES = {
  sm: { box: "h-[22px] w-[22px]", text: "text-[8px]", badge: "h-3.5 min-w-3.5 text-[8px]" },
  md: { box: "h-[26px] w-[26px]", text: "text-[9px]", badge: "h-4 min-w-4 text-[9px]" },
} as const;

export function ChartAvatarEmblem({
  username,
  displayName,
  avatarUrl,
  kind = "long",
  size = "md",
  clusterCount,
  title,
  className,
}: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  kind?: ChartAvatarEmblemKind;
  size?: keyof typeof SIZES;
  clusterCount?: number;
  title?: string;
  className?: string;
}) {
  const initials = memberInitials(displayName, username);
  const hue = avatarHue(username);
  const label = title ?? (displayName?.trim() || `@${username}`);
  const sz = SIZES[size];

  const face = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      className={cn("h-full w-full rounded-full object-cover", sz.text)}
    />
  ) : (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full font-bold tracking-tight text-white",
        sz.text
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 52% 46%) 0%, hsl(${hue} 48% 34%) 100%)`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );

  return (
    <span
      className={cn(
        "pf-chart-avatar-emblem relative inline-flex shrink-0 rounded-full bg-[var(--pf-surface)]",
        RING[kind],
        sz.box,
        className
      )}
      title={label}
    >
      {face}
      {kind === "fueled" ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--pf-red)] text-[7px] font-extrabold leading-none text-white ring-1 ring-[var(--pf-surface)]"
          aria-hidden
        >
          F
        </span>
      ) : null}
      {(clusterCount ?? 0) > 1 ? (
        <span
          className={cn(
            "absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-indigo-600 px-0.5 font-bold leading-none text-white ring-1 ring-[var(--pf-surface)]",
            sz.badge
          )}
        >
          +{(clusterCount ?? 0) - 1}
        </span>
      ) : null}
    </span>
  );
}
