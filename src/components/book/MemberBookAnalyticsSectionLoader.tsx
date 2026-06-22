import type { UserCallRow } from "@/lib/calls/call-fields";
import type { MemberOpenBook } from "@/lib/calls/member-book";
import { buildPerformanceSeries } from "@/lib/charts/cumulative-return-mtm";
import {
  buildBookAnalyticsSnapshot,
  emptyBookAnalyticsSnapshot,
  exposureFromBookSummary,
} from "@/lib/charts/book-analytics";
import { toChartMemberAvatar } from "@/lib/charts/member-avatar";
import type { PublicMemberProfile } from "@/lib/users/public-profile";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { MemberBookAnalyticsSection } from "@/components/book/MemberBookAnalyticsSection";

export async function MemberBookAnalyticsSectionLoader({
  memberCalls,
  book,
  member,
  username,
  profileHref,
  proLocked,
  proGateCta,
}: {
  memberCalls: UserCallRow[];
  book: MemberOpenBook;
  member: PublicMemberProfile | null;
  username: string;
  profileHref: string;
  proLocked: boolean;
  proGateCta: ProGateCta;
}) {
  let performanceSeries: Awaited<ReturnType<typeof buildPerformanceSeries>> = [];
  try {
    performanceSeries =
      memberCalls.length > 0 ? await buildPerformanceSeries(memberCalls) : [];
  } catch (e) {
    console.error("[book/performance]", e);
  }

  let bookAnalytics = emptyBookAnalyticsSnapshot(performanceSeries);
  try {
    bookAnalytics = await buildBookAnalyticsSnapshot({
      performancePoints: performanceSeries,
      exposureSummary: book.summary.openCount > 0 ? book.summary : null,
      benchmarkCalls: book.openCalls.length > 0 ? book.openCalls : memberCalls,
      includeBenchmark: true,
    });
  } catch (e) {
    console.error("[book/analytics]", e);
    bookAnalytics = {
      ...emptyBookAnalyticsSnapshot(performanceSeries),
      exposure: exposureFromBookSummary(book.summary.openCount > 0 ? book.summary : null),
    };
  }

  return (
    <MemberBookAnalyticsSection
      analytics={bookAnalytics}
      performancePoints={performanceSeries}
      memberAvatar={toChartMemberAvatar(member)}
      profileHref={profileHref}
      username={username}
      proLocked={proLocked}
      proGateCta={proGateCta}
    />
  );
}
