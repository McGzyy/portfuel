import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { parseInviteEmails, sendReferralInvites } from "@/lib/referrals/invites";

const schema = z.object({
  emails: z.string().min(3).max(2000),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    const list = parseInviteEmails(body.emails);

    if (list.length === 0) {
      return NextResponse.json({ error: "no_valid_emails" }, { status: 400 });
    }

    const result = await sendReferralInvites({
      referrerId: session.userId,
      referrerUsername: session.username,
      referrerDisplayName: session.displayName ?? session.username,
      emails: list,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[referrals/invite]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
