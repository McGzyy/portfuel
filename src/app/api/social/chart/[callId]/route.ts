import { NextResponse } from "next/server";
import { z } from "zod";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { renderSocialChartSvg } from "@/lib/charts/social-chart";

const milestoneSchema = z.enum(["return_10", "return_25", "target_reached"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await context.params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "png";
    const milestoneRaw = url.searchParams.get("milestone");
    const milestone = milestoneRaw
      ? milestoneSchema.safeParse(milestoneRaw).data
      : undefined;

    const payload = await loadSocialChartPayload(callId, milestone as CallMilestoneKey | undefined);
    if ("error" in payload) {
      return NextResponse.json({ error: payload.error }, { status: 404 });
    }

    if (format === "svg") {
      const svg = renderSocialChartSvg(payload);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      });
    }

    const png = await renderSocialChartPng(payload);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[social/chart]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
