import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { fetchJournalResearchUsage } from "@/lib/ai/journal-research-usage";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const usage = await fetchJournalResearchUsage({
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
    console.error("[ai/journal-research GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
