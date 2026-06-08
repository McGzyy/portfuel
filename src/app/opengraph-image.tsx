import {
  MARKETING_OG_HEIGHT,
  MARKETING_OG_WIDTH,
  renderMarketingOgPng,
} from "@/lib/charts/marketing-og";
import { loadMarketingCallContext } from "@/lib/marketing/marketing-call-data";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "PortFuel — intelligence for serious traders";
export const size = { width: MARKETING_OG_WIDTH, height: MARKETING_OG_HEIGHT };
export const contentType = "image/png";

export default async function Image() {
  const ctx = await loadMarketingCallContext();
  const png = await renderMarketingOgPng("home", ctx);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
