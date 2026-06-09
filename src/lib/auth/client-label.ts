/** Friendly device/browser label from User-Agent. */
export function clientLabelFromUserAgent(userAgent: string | undefined | null): string {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return "Unknown device";

  const lower = ua.toLowerCase();

  let os = "Unknown OS";
  if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("mac os x") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("linux")) os = "Linux";

  let browser = "Browser";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/") && !lower.includes("edg/")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";

  return `${browser} on ${os}`;
}

export function ipHintFromAddress(ip: string | undefined | null): string | null {
  const value = ip?.trim();
  if (!value || value === "unknown") return null;
  const parts = value.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  if (value.includes(":")) return "IPv6 network";
  return null;
}
