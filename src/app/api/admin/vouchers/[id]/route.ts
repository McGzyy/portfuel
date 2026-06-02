import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getVoucherById, updateVoucher } from "@/lib/vouchers/service";

const patchSchema = z.object({
  label: z.string().max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const voucher = await getVoucherById(id);
    if (!voucher) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ voucher });
  } catch (e) {
    return adminError(e);
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());
    const voucher = await updateVoucher(id, {
      label: body.label,
      description: body.description,
      active: body.active,
      maxRedemptions: body.maxRedemptions,
      expiresAt: body.expiresAt,
    });
    if (!voucher) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ voucher });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
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
  console.error("[admin/vouchers/id]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
