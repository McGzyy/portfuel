"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type PublishIdentity = {
  userId: string;
  username: string;
  displayName: string | null;
  kind: "desk" | "personal";
  label: string;
};

export function usePublishIdentities() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [identities, setIdentities] = useState<PublishIdentity[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/switch-identity");
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const json = (await res.json()) as {
      activeUserId: string;
      identities: PublishIdentity[];
    };
    setActiveUserId(json.activeUserId);
    setIdentities(json.identities);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const switchTo = useCallback(
    async (userId: string) => {
      if (userId === activeUserId || busy) return false;
      setBusy(true);
      try {
        const res = await fetch("/api/admin/switch-identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          router.refresh();
          await load();
          return true;
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [activeUserId, busy, load, router]
  );

  const active = identities.find((i) => i.userId === activeUserId) ?? null;
  const hasMultiple = identities.length >= 2;

  return {
    active,
    activeUserId,
    identities,
    hasMultiple,
    loaded,
    busy,
    switchTo,
    reload: load,
  };
}
