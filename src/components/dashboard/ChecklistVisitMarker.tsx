"use client";

import { useEffect } from "react";

/** Records a checklist milestone in localStorage (e.g. visited Fueled desk). */
export function ChecklistVisitMarker({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, "1");
      window.dispatchEvent(new Event("pf-checklist-update"));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return null;
}
