/** When true, feeds and engagement use fixtures in src/lib/demo/fixtures.ts */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isDemoCallId(callId: string): boolean {
  return callId.startsWith("demo-call-");
}
