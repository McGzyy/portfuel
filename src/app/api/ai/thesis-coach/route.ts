import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { runThesisCoachReview } from "@/lib/ai/coach";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { fetchAiCoachUsage } from "@/lib/ai/usage";
import { thesisCoachInputSchema } from "@/lib/ai/types";
import type { MembershipTier } from "@/lib/stripe/config";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const usage = await fetchAiCoachUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: isAiCoachConfigured(),
    });
    return NextResponse.json(usage);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "totp_required") {
      return NextResponse.json({ error: "totp_required" }, { status: 403 });
    }
    console.error("[ai/thesis-coach GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const tier = (session.membershipTier ?? "member") as MembershipTier;
    const body = thesisCoachInputSchema.parse(await request.json());

    if (body.includeHistory && tier !== "pro" && session.role !== "admin") {
      return NextResponse.json(
        { error: "history_pro_only", message: "Track-record context is a Pro Intelligence feature." },
        { status: 403 }
      );
    }

    const usage = await fetchAiCoachUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: isAiCoachConfigured(),
    });

    if (usage.remaining <= 0) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          usage: { used: usage.used, limit: usage.limit, remaining: 0, periodMonth: usage.periodMonth },
        },
        { status: 429 }
      );
    }

    const result = await runThesisCoachReview({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      input: body,
      usageBefore: {
        used: usage.used,
        limit: usage.limit,
        periodMonth: usage.periodMonth,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "totp_required") {
      return NextResponse.json({ error: "totp_required" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "ai_empty_response") {
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    }
    console.error("[ai/thesis-coach POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
