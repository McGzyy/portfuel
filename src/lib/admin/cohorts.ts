export type SignupCohortWeek = {
  weekStart: string;
  signups: number;
  activeNow: number;
  activeRate: number | null;
};

type CohortUser = {
  created_at: string;
  subscription_status: string;
};

function weekStartKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function buildSignupCohorts(users: CohortUser[], weeks = 8): SignupCohortWeek[] {
  const keys: string[] = [];
  const buckets = new Map<string, { signups: number; activeNow: number }>();
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const key = weekStartKey(d.toISOString());
    if (!buckets.has(key)) {
      keys.push(key);
      buckets.set(key, { signups: 0, activeNow: 0 });
    }
  }

  for (const user of users) {
    const key = weekStartKey(user.created_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.signups += 1;
    if (user.subscription_status === "active") bucket.activeNow += 1;
  }

  return keys.map((weekStart) => {
    const bucket = buckets.get(weekStart)!;
    return {
      weekStart,
      signups: bucket.signups,
      activeNow: bucket.activeNow,
      activeRate: bucket.signups > 0 ? bucket.activeNow / bucket.signups : null,
    };
  });
}
