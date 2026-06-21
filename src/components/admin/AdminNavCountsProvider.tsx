"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type AdminNavCounts = {
  discoveryPending: number;
  discoveryActionable: number;
  supportAttention: number;
};

const DEFAULT_COUNTS: AdminNavCounts = {
  discoveryPending: 0,
  discoveryActionable: 0,
  supportAttention: 0,
};

const AdminNavCountsContext = createContext<{
  counts: AdminNavCounts;
  refresh: () => Promise<void>;
}>({
  counts: DEFAULT_COUNTS,
  refresh: async () => {},
});

export function AdminNavCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<AdminNavCounts>(DEFAULT_COUNTS);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/nav-counts");
      if (!res.ok) return;
      const json = await res.json();
      setCounts({
        discoveryPending: json.discoveryPending ?? 0,
        discoveryActionable: json.discoveryActionable ?? 0,
        supportAttention: json.supportAttention ?? 0,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminNavCountsContext.Provider value={{ counts, refresh }}>
      {children}
    </AdminNavCountsContext.Provider>
  );
}

export function useAdminNavCounts() {
  return useContext(AdminNavCountsContext);
}
