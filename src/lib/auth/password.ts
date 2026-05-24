import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SALT_LEN = 16;
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt.toString("hex")}.${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(".");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export const passwordSchema = {
  min: 8,
  max: 128,
  pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
};

export function validatePassword(password: string): string | null {
  if (password.length < passwordSchema.min || password.length > passwordSchema.max) {
    return "Password must be 8–128 characters.";
  }
  if (!passwordSchema.pattern.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
