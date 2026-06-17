import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  DEMO_MEMBER_WIN_CALL_ID,
  demoMilestoneTweetCopy,
  loadDemoFueledNewCallChartPayload,
  loadDemoMemberWinChartPayload,
  loadDemoSocialChartPayload,
} from "@/lib/charts/social-chart-demo";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { renderSocialChartSvg } from "@/lib/charts/social-chart";

const milestoneSchema = z.enum(["return_10", "return_25", "return_50", "target_reached"]);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "png";
    const memberWin = url.searchParams.get("memberWin") === "1";
    const milestoneRaw = url.searchParams.get("milestone");
    const parsed = milestoneRaw ? milestoneSchema.safeParse(milestoneRaw) : null;
    if (milestoneRaw && !parsed?.success) {
      return NextResponse.json({ error: "invalid_milestone" }, { status: 400 });
    }

    const payload = memberWin
      ? await loadDemoMemberWinChartPayload(DEMO_MEMBER_WIN_CALL_ID)
      : milestoneRaw
        ? await loadDemoSocialChartPayload(parsed!.data)
        : await loadDemoFueledNewCallChartPayload();

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
    const download = url.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="portfuel-${payload.symbol}-demo${parsed?.data ? `-${parsed.data}` : memberWin ? "-member" : ""}.png"`,
            }
          : {}),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/demo-chart]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = z
      .object({ milestone: milestoneSchema.optional() })
      .parse(await request.json().catch(() => ({})));
    const milestone = body.milestone ?? "return_25";

    return NextResponse.json({
      milestone,
      chartUrl: `/api/admin/social/demo-chart?milestone=${milestone}&format=png`,
      chartSvgUrl: `/api/admin/social/demo-chart?milestone=${milestone}&format=svg`,
      tweetCopy: await demoMilestoneTweetCopy(milestone),
      note: "Design preview only — uses demo NVDA data until live Fueled calls hit milestones.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/demo-chart POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
