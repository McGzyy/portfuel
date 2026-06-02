import { NextResponse } from "next/server";
import {
  ensureFoundingProTrialVoucher,
  getFoundingAccessUrls,
  FOUNDING_PRO_VOUCHER_CODE,
} from "@/lib/admin/founding-access";
import { requireAdmin } from "@/lib/auth/session";
import { getVoucherByCode } from "@/lib/vouchers/service";

export async function GET() {
  try {
    await requireAdmin();
    const urls = getFoundingAccessUrls();
    const voucher = await getVoucherByCode(FOUNDING_PRO_VOUCHER_CODE);
    return NextResponse.json({
      urls,
      voucherCode: FOUNDING_PRO_VOUCHER_CODE,
      voucherReady: Boolean(voucher?.active),
      voucher,
    });
  } catch (e) {
    return adminError(e);
  }
}

export async function POST() {
  try {
    const session = await requireAdmin();
    const result = await ensureFoundingProTrialVoucher(session.userId);
    const urls = getFoundingAccessUrls();
    return NextResponse.json({
      ok: true,
      created: result.created,
      voucher: result.voucher,
      urls,
    });
  } catch (e) {
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
  console.error("[admin/launch/founding]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
