import { MemberReturnChart } from "@/components/charts/MemberReturnChart";
import { MemberTrackRecordStrip } from "@/components/member/MemberTrackRecordStrip";
import { MemberReturnDistribution } from "@/components/pro/MemberReturnDistribution";
import { ProfileAiCoachStrip } from "@/components/profile/ProfileAiCoachStrip";
import type { AiCoachUsageStatus } from "@/lib/ai/usage";
import type { ReturnBucket } from "@/lib/charts/return-distribution";
import type { ReturnChartPoint } from "@/lib/charts/types";
import type { MemberTrackRecord } from "@/lib/users/member-track-record";
import type { ProGateCta } from "@/lib/features/pro-intelligence";

export function ProfilePerformanceSection({
  trackRecord,
  returnSeries,
  returnBuckets,
  proLocked,
  proGateCta,
  aiUsage,
}: {
  trackRecord: MemberTrackRecord;
  returnSeries: ReturnChartPoint[];
  returnBuckets: ReturnBucket[];
  proLocked: boolean;
  proGateCta: ProGateCta;
  aiUsage: AiCoachUsageStatus;
}) {
  return (
    <section id="performance" className="scroll-mt-24 space-y-6">
      <div className="pf-workspace-panel px-5 py-4 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          On-record performance
        </p>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Every published call is timestamped with live marks — this is what members and the
          leaderboard use to score your book.
        </p>
      </div>

      <MemberTrackRecordStrip record={trackRecord} />

      {returnSeries.length > 1 ? (
        <MemberReturnChart points={returnSeries} />
      ) : (
        <div className="pf-workspace-panel px-6 py-10 text-center text-sm text-[var(--pf-gray-500)]">
          Publish a few calls to unlock your cumulative return chart.
        </div>
      )}

      <MemberReturnDistribution
        buckets={returnBuckets}
        locked={proLocked}
        proGateCta={proGateCta}
      />

      <ProfileAiCoachStrip usage={aiUsage} />
    </section>
  );
}
