import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
  chooseEmailForVerification,
  getEmailVerifyStatus,
  sendVerificationEmail,
} from "@/lib/member-lifecycle/email-verify";

const sendSchema = z.object({
  email: z.string().email().max(254).optional(),
});

const chooseSchema = z.object({
  source: z.enum(["stripe", "entered"]),
});

export async function GET() {
  try {
    const session = await requireSession();
    const status = await getEmailVerifyStatus(session.userId);
    if (!status) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(status);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = sendSchema.parse(await request.json());
    const status = await getEmailVerifyStatus(session.userId);
    const email = body.email ?? status?.email ?? status?.stripeCheckoutEmail;
    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }
    const result = await sendVerificationEmail(session.userId, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = chooseSchema.parse(await request.json());
    const email = await chooseEmailForVerification(session.userId, body.source);
    const result = await sendVerificationEmail(session.userId, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "email_missing") {
      return NextResponse.json({ error: "email_missing" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
