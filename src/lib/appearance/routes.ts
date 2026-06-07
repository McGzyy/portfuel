/** Marketing, auth, and demo surfaces — always light regardless of login. */
const PUBLIC_LIGHT_PREFIXES = [
  "/demo",
  "/join",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/pricing",
  "/terms",
  "/privacy",
  "/legal",
] as const;

const PUBLIC_LIGHT_EXACT = new Set(["/"]);

export function isPublicLightRoute(pathname: string): boolean {
  if (PUBLIC_LIGHT_EXACT.has(pathname)) return true;
  return PUBLIC_LIGHT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Apply saved appearance when the user has a session and the route is not public-only. */
export function shouldApplyMemberAppearance(pathname: string, hasSession: boolean): boolean {
  if (!hasSession) return false;
  return !isPublicLightRoute(pathname);
}
