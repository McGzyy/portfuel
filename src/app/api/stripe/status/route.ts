import { NextResponse } from "next/server";
import { isAnnualBillingConfigured, isStripeConfigured } from "@/lib/stripe/config";

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured(),
    annualConfigured: isAnnualBillingConfigured(),
  });
}
