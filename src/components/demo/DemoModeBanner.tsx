import { isDemoMode } from "@/lib/demo/config";

export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300/80 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950"
    >
      <span className="font-semibold">Preview mode</span> — sample member &amp; PortFuel (Fueled)
      calls are shown. Set{" "}
      <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px]">
        NEXT_PUBLIC_DEMO_MODE=false
      </code>{" "}
      in <code className="font-mono text-[11px]">.env.local</code> to use live data only.
    </div>
  );
}
