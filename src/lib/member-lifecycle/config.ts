import { isEmailConfigured } from "@/lib/email/config";

export function isEmailVerificationRequired(): boolean {
  if (process.env.REQUIRE_EMAIL_VERIFICATION === "false") return false;
  return isEmailConfigured();
}
