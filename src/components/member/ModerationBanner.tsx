import { SupportContactLink } from "@/components/help/SupportContactLink";
import { cn } from "@/lib/utils";

export type ModerationBannerProps = {
  role: "member" | "admin";
  canPublishCalls: boolean;
  canDm: boolean;
  canComment: boolean;
  className?: string;
};

export function ModerationBanner({
  role,
  canPublishCalls,
  canDm,
  canComment,
  className,
}: ModerationBannerProps) {
  if (role === "admin") return null;
  if (canPublishCalls && canDm && canComment) return null;

  const blocked: string[] = [];
  if (!canPublishCalls) blocked.push("publish new calls");
  if (!canComment) blocked.push("comment on calls");
  if (!canDm) blocked.push("send direct messages");

  const list =
    blocked.length === 1
      ? blocked[0]
      : blocked.length === 2
        ? `${blocked[0]} or ${blocked[1]}`
        : `${blocked.slice(0, -1).join(", ")}, or ${blocked[blocked.length - 1]}`;

  return (
    <div
      role="status"
      className={cn(
        "border-b border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className
      )}
    >
      <p className="font-semibold">Account restrictions active</p>
      <p className="mt-0.5 text-amber-900/90">
        You can browse the workspace, but you cannot {list}. If this is unexpected,{" "}
        <SupportContactLink variant="ticket">contact support</SupportContactLink>.
      </p>
    </div>
  );
}
