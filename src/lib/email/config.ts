export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim() &&
      process.env.NEXT_PUBLIC_APP_URL?.trim()
  );
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() ?? "PortFuel <notifications@portfuel.pro>";
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
