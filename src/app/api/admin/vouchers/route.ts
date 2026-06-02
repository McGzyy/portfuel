import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createVoucher, listVouchers } from "@/lib/vouchers/service";

const createSchema = z.object({
  code: z.string().min(3).max(64),
  label: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  kind: z.enum(["checkout_discount", "pro_trial"]),
  discountType: z.enum(["percent_off", "amount_off"]).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  discountAmountCents: z.number().int().min(1).optional(),
  applicableTier: z.enum(["member", "pro", "any"]).optional(),
  applicableInterval: z.enum(["monthly", "annual", "any"]).optional(),
  audience: z.enum(["public", "assigned", "affiliate"]).optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  maxRedemptionsPerUser: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  proTrialDays: z.number().int().min(1).max(365).optional(),
  syncStripe: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const vouchers = await listVouchers();
    return NextResponse.json({ vouchers });
  } catch (e) {
    return adminError(e);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = createSchema.parse(await request.json());

    if (body.kind === "checkout_discount" && !body.discountType) {
      return NextResponse.json({ error: "discount_required" }, { status: 400 });
    }
    if (body.kind === "pro_trial" && !body.proTrialDays) {
      return NextResponse.json({ error: "trial_days_required" }, { status: 400 });
    }

    const voucher = await createVoucher(
      {
        code: body.code,
        label: body.label,
        description: body.description,
        kind: body.kind,
        discountType: body.discountType,
        discountPercent: body.discountPercent,
        discountAmountCents: body.discountAmountCents,
        applicableTier: body.applicableTier,
        applicableInterval: body.applicableInterval,
        audience: body.audience,
        maxRedemptions: body.maxRedemptions,
        maxRedemptionsPerUser: body.maxRedemptionsPerUser,
        startsAt: body.startsAt,
        expiresAt: body.expiresAt,
        proTrialDays: body.proTrialDays,
        syncStripe: body.syncStripe,
      },
      session.userId
    );

    return NextResponse.json({ voucher }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "code_taken" }, { status: 409 });
    }
    return adminError(e);
  }
}

function adminError(e: unknown) {
  if (e instanceof Error && e.message === "unauthorized") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  console.error("[admin/vouchers]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
