import { generateSecret, verify, generateURI } from "otplib";
import QRCode from "qrcode";

export function generateTotpSecret(): string {
  return generateSecret();
}

export async function verifyTotpToken(secret: string, token: string): Promise<boolean> {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  /** ±2 steps (30s each) for phone clock drift */
  const result = await verify({ secret, token: clean, epochTolerance: 2 });
  return result.valid;
}

export function getTotpUri(secret: string, accountLabel: string): string {
  return generateURI({
    issuer: "PortFuel.pro",
    label: accountLabel,
    secret,
  });
}

export async function getTotpQrDataUrl(secret: string, accountLabel: string): Promise<string> {
  const uri = getTotpUri(secret, accountLabel);
  return QRCode.toDataURL(uri, { margin: 2, width: 220 });
}
