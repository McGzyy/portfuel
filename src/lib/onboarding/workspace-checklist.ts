import type { LucideIcon } from "lucide-react";
import { Bookmark, Flame, PenLine, Trophy } from "lucide-react";
import { COPY } from "@/lib/copy";

export const CHECKLIST_DESK_VISITED_KEY = "pf_checklist_desk_visited";
export const CHECKLIST_DISMISSED_KEY = "pf_checklist_dismissed";

export type WorkspaceChecklistStepId =
  | "publish_call"
  | "watchlist"
  | "follow"
  | "fueled_desk";

export type WorkspaceChecklistStepDef = {
  id: WorkspaceChecklistStepId;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const WORKSPACE_CHECKLIST_STEPS: WorkspaceChecklistStepDef[] = [
  {
    id: "publish_call",
    label: COPY.publishCallCta,
    description: "Entry, target, and stop on record — unlocks your track record.",
    href: COPY.newCallHref,
    icon: PenLine,
  },
  {
    id: "watchlist",
    label: "Seed your watchlist",
    description: "Track symbols you care about; get alerts when members call them.",
    href: "/dashboard/watchlist",
    icon: Bookmark,
  },
  {
    id: "follow",
    label: "Follow trusted callers",
    description: "Personalize the feed with traders you want to watch.",
    href: "/dashboard/rankings",
    icon: Trophy,
  },
  {
    id: "fueled_desk",
    label: "Open Fueled desk",
    description: "House research, model portfolio, and the weekly desk note.",
    href: "/dashboard/desk",
    icon: Flame,
  },
];

export function computeWorkspaceChecklistProgress(input: {
  publishedCall: boolean;
  watchlistCount: number;
  followingCount: number;
  deskVisited: boolean;
}): { steps: { id: WorkspaceChecklistStepId; done: boolean }[]; completed: number; total: number } {
  const doneMap: Record<WorkspaceChecklistStepId, boolean> = {
    publish_call: input.publishedCall,
    watchlist: input.watchlistCount > 0,
    follow: input.followingCount > 0,
    fueled_desk: input.deskVisited,
  };

  const steps = WORKSPACE_CHECKLIST_STEPS.map((s) => ({
    id: s.id,
    done: doneMap[s.id],
  }));
  const completed = steps.filter((s) => s.done).length;

  return { steps, completed, total: WORKSPACE_CHECKLIST_STEPS.length };
}
