"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ThesisCoachPanel,
  type ThesisCoachDraft,
} from "@/components/ai/ThesisCoachPanel";

export function ThesisCoachInline({
  draft,
  isPro,
  showUpgrade,
}: {
  draft: ThesisCoachDraft;
  isPro: boolean;
  showUpgrade?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => setOpen(true)}
      >
        Thesis coach
      </Button>
    );
  }

  return (
    <div className="mt-3">
      <ThesisCoachPanel draft={() => draft} isPro={isPro} showUpgrade={showUpgrade} />
    </div>
  );
}
