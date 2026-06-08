"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUpgradeProrationHint } from "@/lib/stripe/format-upgrade-preview";
import type { MemberToProUpgradePreview } from "@/lib/stripe/upgrade-preview";

export function useUpgradeProrationHint(fallback = "Prorated when you upgrade from Member.") {
  const [hint, setHint] = useState(fallback);

  const loadPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/upgrade-preview");
      const data = await res.json();
      if (!res.ok) return;
      setHint(formatUpgradeProrationHint(data as MemberToProUpgradePreview));
    } catch {
      // Keep fallback.
    }
  }, []);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  return hint;
}
