import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { isAiCoachConfigured, canUseHelpAssistant } from "@/lib/ai/config";
import { runHelpAssistant } from "@/lib/ai/help-assistant";
import { fetchHelpAssistantUsage } from "@/lib/ai/help-assistant-usage";

const bodySchema = z.object({
  question: z.string().trim().min(4).max(1000),
});

export async function GET() {
  try {
    const session = await requireActiveMember();
    const usage = await fetchHelpAssistantUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: isAiCoachConfigured(),
    });
    const unlocked =
      canUseHelpAssistant(session.membershipTier ?? null, session.role) &&
      canAccessProIntelligence(sessionToProContext(session));

    return NextResponse.json({ usage, unlocked });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[ai/help-assistant GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const proCtx = sessionToProContext(session);

    if (
      !canUseHelpAssistant(session.membershipTier ?? null, session.role) ||
      !canAccessProIntelligence(proCtx)
    ) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    if (!isAiCoachConfigured()) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }

    const body = bodySchema.parse(await request.json());
    const usage = await fetchHelpAssistantUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: true,
    });

    if (usage.remaining <= 0) {
      return NextResponse.json({ error: "limit_reached", usage }, { status: 429 });
    }

    const result = await runHelpAssistant({
      userId: session.userId,
      question: body.question,
      remainingBefore: usage.remaining,
    });

    return NextResponse.json({ ...result, usage: { ...usage, remaining: result.remaining } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[ai/help-assistant POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
