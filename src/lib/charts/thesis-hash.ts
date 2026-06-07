export const THESIS_HASH_PREFIX = "#thesis-";

export function parseThesisHashFromUrl(
  hash: string = typeof window !== "undefined" ? window.location.hash : ""
): string | null {
  if (!hash.startsWith(THESIS_HASH_PREFIX)) return null;
  const callId = decodeURIComponent(hash.slice(THESIS_HASH_PREFIX.length));
  return callId || null;
}

export function setThesisHash(callId: string): void {
  if (typeof window === "undefined") return;
  const next = `${THESIS_HASH_PREFIX}${encodeURIComponent(callId)}`;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${next}`);
}

export function clearThesisHash(): void {
  if (typeof window === "undefined") return;
  if (!window.location.hash.startsWith(THESIS_HASH_PREFIX)) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

export function scrollToThesisBlock(callId: string): void {
  const el = document.getElementById(`thesis-${callId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("pf-thesis-highlight");
  window.setTimeout(() => el.classList.remove("pf-thesis-highlight"), 2200);
}
