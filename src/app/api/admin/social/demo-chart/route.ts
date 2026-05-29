import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  demoMilestoneTweetCopy,
  loadDemoSocialChartPayload,
} from "@/lib/charts/social-chart-demo";
import { renderSocialChartPng, renderSocialChartSvg } from "@/lib/charts/social-chart";

const milestoneSchema = z.enum(["return_10", "return_25", "target_reached"]);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "png";
    const milestoneRaw = url.searchParams.get("milestone") ?? "return_25";
    const parsed = milestoneSchema.safeParse(milestoneRaw);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_milestone" }, { status: 400 });
    }

    const payload = await loadDemoSocialChartPayload(parsed.data);

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
      tweetCopy: demoMilestoneTweetCopy(milestone),
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
