export function normalizeVoucherCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
