import { getTwilioFromNumber, isSmsConfigured } from "@/lib/sms/config";

export async function sendPortfuelSms(opts: {
  to: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "not_configured" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = getTwilioFromNumber()!;

  const body = opts.body.trim().slice(0, 320);
  const params = new URLSearchParams({
    To: opts.to,
    From: from,
    Body: body,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[sms/send]", res.status, text.slice(0, 200));
      return { ok: false, error: "twilio_error" };
    }

    return { ok: true };
  } catch (e) {
    console.error("[sms/send]", e);
    return { ok: false, error: "network_error" };
  }
}
