import { NextResponse } from "next/server";
import { z } from "zod";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "@/lib/member-lifecycle/password-reset";

const requestSchema = z.object({
  email: z.string().email().max(254),
});

const confirmSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    await requestPasswordReset(body.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = confirmSchema.parse(await request.json());
    const result = await confirmPasswordReset(body.token, body.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
