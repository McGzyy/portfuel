export function dmThreadKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}
