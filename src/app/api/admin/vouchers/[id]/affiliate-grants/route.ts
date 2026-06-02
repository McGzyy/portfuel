import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getVoucherById, grantVoucherToAffiliate } from "@/lib/vouchers/service";

const schema = z.object({
  affiliateUserId: z.string().uuid(),
  maxUses: z.number().int().min(1).nullable().optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());

    const voucher = await getVoucherById(id);
    if (!voucher) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (voucher.audience !== "affiliate") {
      return NextResponse.json({ error: "not_affiliate_audience" }, { status: 400 });
    }

    await grantVoucherToAffiliate(id, body.affiliateUserId, body.maxUses);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/vouchers/affiliate-grants]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
