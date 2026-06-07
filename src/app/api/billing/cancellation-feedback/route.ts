import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { submitCancellationFeedback } from "@/lib/billing/cancellation-feedback";

const bodySchema = z.object({
  reason: z.enum([
    "too_expensive",
    "not_using_enough",
    "missing_features",
    "found_alternative",
    "technical_issues",
    "temporary_break",
    "other",
  ]),
  comment: z.string().max(2000).optional(),
  source: z.enum(["pre_portal", "post_portal"]).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const result = await submitCancellationFeedback({
      userId: session.userId,
      reason: body.reason,
      comment: body.comment,
      source: body.source,
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[billing/cancellation-feedback]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
