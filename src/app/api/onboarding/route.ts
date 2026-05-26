import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getSession, requireSession } from "@/lib/auth/session";
import { completeOnboarding, getOnboardingStatus } from "@/lib/onboarding/service";

const completeSchema = z.object({
  displayName: z.string().min(2).max(32).optional(),
  symbols: z.array(z.string().min(1).max(12)).min(1).max(5),
});

export async function GET() {
  try {
    const session = await requireSession();
    const status = await getOnboardingStatus(session.userId);
    return NextResponse.json(status);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[onboarding GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.subscriptionStatus !== "active" && session.role !== "admin") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }

    const body = completeSchema.parse(await request.json());
    const result = await completeOnboarding({
      userId: session.userId,
      displayName: body.displayName,
      symbols: body.symbols,
    });

    if ("error" in result) {
      const status =
        result.error === "symbols_required" ? 400 : result.error === "watchlist_failed" ? 500 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    const displayName = body.displayName?.trim() || session.displayName;
    await createSession({
      ...session,
      displayName: displayName ?? session.displayName,
      onboardingCompleted: true,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[onboarding POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
