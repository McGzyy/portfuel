export function isSmsConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  return Boolean(sid && token && from);
}

export function getTwilioFromNumber(): string | null {
  return process.env.TWILIO_FROM_NUMBER?.trim() || null;
}
