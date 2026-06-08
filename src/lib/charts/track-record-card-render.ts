import type { TrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { compositeSocialChartLogo } from "@/lib/charts/social-chart-logo";
import { renderTrackRecordCardOgPng } from "@/lib/charts/track-record-card-og";

export async function renderTrackRecordCardPng(
  payload: TrackRecordCardPayload
): Promise<Buffer> {
  const png = await renderTrackRecordCardOgPng(payload);
  return compositeSocialChartLogo(png);
}
