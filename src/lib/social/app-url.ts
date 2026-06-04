/** Canonical app origin for outbound links (email, X, etc.). */
export function getAppOrigin(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** Hostname for social cards and share copy (e.g. portfuel.pro). */
export function getPublicSiteHost(): string {
  try {
    const host = new URL(getAppOrigin()).hostname.replace(/^www\./, "");
    if (host === "localhost" || host.endsWith(".local")) return "portfuel.pro";
    return host;
  } catch {
    return "portfuel.pro";
  }
}

export function appPath(path: string, utm?: { source?: string; medium?: string; campaign?: string }): string {
  const base = getAppOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const u = new URL(normalized, base);
  if (utm?.source) u.searchParams.set("utm_source", utm.source);
  if (utm?.medium) u.searchParams.set("utm_medium", utm.medium);
  if (utm?.campaign) u.searchParams.set("utm_campaign", utm.campaign);
  return u.toString();
}
