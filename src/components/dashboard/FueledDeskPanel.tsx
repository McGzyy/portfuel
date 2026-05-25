import Link from "next/link";
import { CallPreviewRow, type CallPreviewData } from "@/components/dashboard/CallPreviewRow";

export function FueledDeskPanel({
  calls,
  href = "/dashboard/desk",
}: {
  calls: CallPreviewData[];
  href?: string;
}) {
  return (
    <section className="pf-fueled-panel overflow-hidden">
      <div className="pf-fueled-panel-header">
        <div>
          <p className="pf-fueled-panel-eyebrow">PortFuel research</p>
          <h2 className="text-sm font-bold text-white">Fueled desk</h2>
        </div>
        <Link href={href} className="pf-fueled-panel-link">
          Open desk →
        </Link>
      </div>
      <div className="p-1">
        {calls.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-500">No desk calls yet.</p>
        ) : (
          calls.map((call) => (
            <CallPreviewRow key={call.id} call={call} variant="on-dark" />
          ))
        )}
      </div>
    </section>
  );
}
