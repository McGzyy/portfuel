export function isMissingDiscoveryTable(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    (m.includes("desk_signal_candidates") ||
      m.includes("desk_discovery_scan_state") ||
      m.includes("desk_discovery_shadow_calls")) &&
    (m.includes("does not exist") || m.includes("relation"))
  );
}
