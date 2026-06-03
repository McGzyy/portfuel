import {
  MARKETING_OG_HEIGHT,
  MARKETING_OG_WIDTH,
  renderMarketingOgPng,
} from "@/lib/charts/marketing-og";

export const runtime = "nodejs";
export const alt = "PortFuel — intelligence for serious traders";
export const size = { width: MARKETING_OG_WIDTH, height: MARKETING_OG_HEIGHT };
export const contentType = "image/png";

export default async function Image() {
  const png = await renderMarketingOgPng("home");
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
