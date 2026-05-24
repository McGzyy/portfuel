"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DashboardFeedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function applyQuery(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/dashboard?${qs}` : "/dashboard");
    });
  }

  return (
    <div className="relative max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pf-gray-400)]"
        strokeWidth={2}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyQuery(value);
        }}
        onBlur={() => applyQuery(value)}
        placeholder="Search symbol, thesis, or caller…"
        className="pl-9 font-medium"
        aria-label="Search feed"
        disabled={pending}
      />
    </div>
  );
}
