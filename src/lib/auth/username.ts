const RESERVED = new Set([
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "portfuel",
  "system",
  "api",
  "login",
  "join",
  "dashboard",
]);

export const usernamePattern = /^[a-z][a-z0-9_]{2,19}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  if (!usernamePattern.test(username)) {
    return "Username must be 3–20 characters: lowercase letters, numbers, underscore; must start with a letter.";
  }
  if (RESERVED.has(username)) {
    return "That username is not available.";
  }
  return null;
}
