import { createServiceClient } from "@/lib/db/supabase";
import { fetchDeskBrief } from "@/lib/desk/brief";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";
import { buildJournalDigestSection } from "@/lib/journal/digest-section";

export type DigestSection = { heading: string; lines: string[] };

export type WeeklyDigestSnapshot = {
  fueledPortfolio: {
    symbol: string;
    direction: string;
    return_pct: number | null;
    conviction: number;
  }[];
  deskNote: string | null;
  topMovers30d: {
    symbol: string;
    direction: string;
    return_pct: number;
    username: string;
    is_fueled: boolean;
  }[];
  newThisWeek: {
    symbol: string;
    direction: string;
    return_pct: number | null;
    username: string;
    vote_score: number;
  }[];
};

function formatReturn(n: number | null): string {
  if (n == null) return "mark pending";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function formatTargetProgress(n: number | null): string {
  if (n == null) return "";
  return ` · target ${Math.round(n)}%`;
}

function snippet(text: string, max = 140): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function buildWeeklyDigestSnapshot(): Promise<WeeklyDigestSnapshot> {
  const db = createServiceClient();
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const portfolio = await fetchDeskPortfolio();
  const brief = await fetchDeskBrief();

  const fueledPortfolio = portfolio
    .filter((e) => e.status === "open")
    .slice(0, 6)
    .map((e) => ({
      symbol: e.symbol,
      direction: e.direction,
      return_pct: e.return_pct,
      conviction: e.conviction,
    }));

  const { data: topRows } = await db
    .from("calls")
    .select("symbol, direction, return_pct, is_fueled, users!inner(username)")
    .not("return_pct", "is", null)
    .gte("called_at", since30d)
    .order("return_pct", { ascending: false })
    .limit(5);

  const topMovers30d = (topRows ?? []).map((c) => {
    const row = c as {
      symbol: string;
      direction: string;
      return_pct: number;
      is_fueled: boolean;
      users: { username: string } | { username: string }[];
    };
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      symbol: row.symbol,
      direction: row.direction,
      return_pct: Number(row.return_pct),
      username: u?.username ?? "member",
      is_fueled: Boolean(row.is_fueled),
    };
  });

  const { data: weekRows } = await db
    .from("calls")
    .select("symbol, direction, return_pct, vote_score, users!inner(username)")
    .gte("called_at", since7d)
    .order("vote_score", { ascending: false })
    .limit(5);

  const newThisWeek = (weekRows ?? []).map((c) => {
    const row = c as {
      symbol: string;
      direction: string;
      return_pct: number | null;
      vote_score: number;
      users: { username: string } | { username: string }[];
    };
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      symbol: row.symbol,
      direction: row.direction,
      return_pct: row.return_pct != null ? Number(row.return_pct) : null,
      username: u?.username ?? "member",
      vote_score: row.vote_score ?? 0,
    };
  });

  return {
    fueledPortfolio,
    deskNote: brief.weeklyNote,
    topMovers30d,
    newThisWeek,
  };
}

export async function buildWeeklyDigestSections(
  userId: string,
  userStats: {
    calls_count: number;
    win_rate: number | null;
    avg_return_pct: number | null;
  },
  snapshot: WeeklyDigestSnapshot
): Promise<DigestSection[]> {
  const db = createServiceClient();
  const sections: DigestSection[] = [];

  if (snapshot.deskNote) {
    sections.push({
      heading: "Desk note · this week",
      lines: [snippet(snapshot.deskNote)],
    });
  }

  const portfolioLines =
    snapshot.fueledPortfolio.length > 0
      ? snapshot.fueledPortfolio.map(
          (e) =>
            `${e.symbol} ${e.direction} · conviction ${e.conviction}/5 · ${formatReturn(e.return_pct)} since entry`
        )
      : [
          "No open desk positions yet — the Fueled model portfolio will list house theses with live marks here.",
        ];

  sections.push({
    heading: "Fueled model portfolio",
    lines: portfolioLines,
  });

  const { data: myCalls } = await db
    .from("calls")
    .select("symbol, direction, return_pct, target_progress, called_at")
    .eq("user_id", userId)
    .order("called_at", { ascending: false })
    .limit(6);

  const yourCallLines = (myCalls ?? []).map((c) => {
    const row = c as {
      symbol: string;
      direction: string;
      return_pct: number | null;
      target_progress: number | null;
    };
    return `${row.symbol} ${row.direction} · ${formatReturn(
      row.return_pct != null ? Number(row.return_pct) : null
    )}${formatTargetProgress(
      row.target_progress != null ? Number(row.target_progress) : null
    )}`;
  });

  if (yourCallLines.length > 0) {
    const summary: string[] = [];
    if (userStats.win_rate != null) {
      summary.push(`Track record: ${Math.round(userStats.win_rate)}% win rate`);
    }
    if (userStats.avg_return_pct != null) {
      summary.push(`Avg return ${Number(userStats.avg_return_pct).toFixed(1)}%`);
    }
    sections.push({
      heading: "Your calls · marked",
      lines: [...summary, ...yourCallLines].filter(Boolean),
    });
  } else {
    sections.push({
      heading: "Your calls · marked",
      lines: [
        "You have not published a thesis yet — when you do, this section shows live return % and target progress on each call.",
        "The workspace still includes Fueled desk research, watchlist tools, and market intel on every ticker.",
      ],
    });
  }

  const journalSection = await buildJournalDigestSection(userId);
  if (journalSection) {
    sections.push(journalSection);
  }

  const moverLines = snapshot.topMovers30d.map((c) => {
    const who = c.is_fueled ? "Fueled desk" : `@${c.username}`;
    return `${c.symbol} ${c.direction} · ${formatReturn(c.return_pct)} (30d) · ${who}`;
  });

  sections.push({
    heading: "Community top movers · 30 days",
    lines: moverLines.length
      ? moverLines
      : ["No marked community calls in the last 30 days yet — rankings and feed fill in as members publish."],
  });

  const weekLines = snapshot.newThisWeek.map((c) => {
    const ret =
      c.return_pct != null ? ` · ${formatReturn(c.return_pct)}` : "";
    return `${c.symbol} ${c.direction} by @${c.username}${ret}`;
  });

  sections.push({
    heading: "New this week",
    lines: weekLines.length
      ? weekLines
      : ["Quiet week on the member feed — check Fueled desk for house research."],
  });

  const { count: unread } = await db
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  sections.push({
    heading: "In-app",
    lines: [
      unread && unread > 0
        ? `${unread} unread notification${unread === 1 ? "" : "s"}`
        : "You're caught up on notifications",
    ],
  });

  return sections;
}
