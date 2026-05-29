import { getXConfig } from "@/lib/social/x-config";

export async function uploadXMedia(
  imageBuffer: Buffer,
  mimeType: "image/png" = "image/png"
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  const config = getXConfig();
  const token = config.bearerToken;
  if (!token) {
    return { ok: false, error: "no_token" };
  }

  const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      media_data: imageBuffer.toString("base64"),
      media_category: mimeType === "image/png" ? "tweet_image" : "tweet_image",
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    media_id_string?: string;
    errors?: { message?: string }[];
  };

  if (!res.ok) {
    const msg = json.errors?.[0]?.message ?? `http_${res.status}`;
    console.error("[x-media upload]", msg, json);
    return { ok: false, error: msg };
  }

  const mediaId = json.media_id_string;
  if (!mediaId) {
    return { ok: false, error: "no_media_id" };
  }

  return { ok: true, mediaId };
}
