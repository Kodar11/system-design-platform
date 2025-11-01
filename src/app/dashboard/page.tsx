import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import prisma from '@/lib/prisma/client';
import Link from 'next/link';
import NavBar from '@/components/ui/NavBar';

function formatTimeRemaining(ms: number) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${hh}h ${mm}m ${ss}s`;
}

export default async function DashboardPage() {
  const session = (await getServerSession(NEXT_AUTH_CONFIG as any)) as any;

  if (!session?.user?.id) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p className="text-sm text-muted-foreground">You need to <Link href="/login" className="text-blue-400">sign in</Link> to view your dashboard.</p>
      </div>
    );
  }

  const userId = session.user.id as string;

  // Fetch user credit & account info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      subscriptionStatus: true,
      dailyDesignCredits: true,
      dailyProblemCredits: true,
      purchasedMockCredits: true,
      purchasedPracticeCredits: true,
      purchasedCreditsExpiresAt: true,
      lastCreditReset: true,
      createdAt: true,
    },
  });

  // Submissions for aggregations (include problem title + difficulty)
  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: { problem: { select: { difficulty: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Total unique problems solved
  const uniqueProblems = new Set(submissions.map((s) => s.problemId));

  // Total problems in DB (for progress gauge)
  const totalProblemsCount = await prisma.problem.count();

  // Difficulty breakdown (count of submissions by problem difficulty)
  const difficultyCounts: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const s of submissions) {
    const diff = s.problem?.difficulty ?? 'MEDIUM';
    difficultyCounts[diff] = (difficultyCounts[diff] ?? 0) + 1;
  }

  // Score aggregations
  const scores: { value: number; date: Date }[] = [];
  for (const s of submissions) {
    try {
      const evalRes = (s.evaluationResult as any) || {};
      const score = typeof evalRes === 'object' ? (evalRes.score ?? evalRes?.scoreValue ?? null) : null;
      if (typeof score === 'number' && !Number.isNaN(score)) {
        scores.push({ value: score, date: s.createdAt });
      }
    } catch (err) {
      // ignore malformed JSON entries
    }
  }

  const avgScore = scores.length ? (scores.reduce((a, b) => a + b.value, 0) / scores.length).toFixed(1) : '—';
  const maxScore = scores.length ? Math.max(...scores.map((s) => s.value)) : '—';
  const latestScore = scores.length ? scores[0] : null;

  // Recent submissions (show first 8)
  const recent = submissions.slice(0, 8).map((s) => ({ id: s.id, title: s.problem?.title ?? 'Unknown', date: s.createdAt }));

  // Heatmap data: last 126 days (18 cols x 7 rows)
  const days = 126;
  const today = new Date();
  const dayCounts: Record<string, number> = {};
  for (const s of submissions) {
    const d = new Date(s.createdAt).toISOString().slice(0, 10);
    dayCounts[d] = (dayCounts[d] || 0) + 1;
  }

  const heatmap: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    heatmap.push({ date: key, count: dayCounts[key] || 0 });
  }

  // Compute streaks (consecutive days with at least one submission)
  const activeDaysSet = new Set(Object.keys(dayCounts));
  // compute max streak and current streak looking back from today
  let maxStreak = 0;
  let curStreak = 0;
  let tempStreak = 0;
  // iterate days from oldest to newest
  for (let i = 0; i < heatmap.length; i++) {
    const c = heatmap[i].count;
    if (c > 0) {
      tempStreak += 1;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }
  // current streak: count back from last day
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].count > 0) curStreak += 1; else break;
  }

  // Credit reset time (assume lastCreditReset + 24h)
  const now = new Date();
  const lastReset = user?.lastCreditReset ?? now;
  const nextReset = new Date(new Date(lastReset).getTime() + 24 * 60 * 60 * 1000);
  const timeRemainingMs = nextReset.getTime() - now.getTime();

  return (
    <>
      <NavBar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Profile Card */}
          <aside className="lg:col-span-3 bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl text-white">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-lg font-semibold">{user?.username ?? 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <div>Total submissions: <span className="font-medium">{submissions.length}</span></div>
              <div>Problems solved: <span className="font-medium">{uniqueProblems.size}</span></div>
              <div>Badges: <span className="font-medium">0</span></div>
            </div>

            <div>
              <Link href="/profile" className="block w-full text-center bg-green-600 text-white py-2 rounded-lg">Edit Profile</Link>
            </div>
          </aside>

          {/* Middle: Progress / Stats */}
          <section className="lg:col-span-5 bg-card border border-border rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Donut using conic-gradient for predictable layout */}
              <div className="w-40 h-40 rounded-full relative" style={{background: `conic-gradient(#10b981 ${Math.min(100, Math.round((uniqueProblems.size / Math.max(100, totalProblemsCount)) * 100))}%, rgba(255,255,255,0.03) 0%)`}}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center">
                    <div className="text-lg font-semibold">{uniqueProblems.size}</div>
                    <div className="text-xs text-muted-foreground">Solved</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-sm text-muted-foreground">
                <div className="text-lg font-semibold">Progress</div>
                <div className="mt-2">{uniqueProblems.size} problems solved out of {totalProblemsCount} total</div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="p-3 bg-background/50 rounded-md text-center"><div className="text-xs">Easy</div><div className="font-medium">{difficultyCounts.EASY}</div></div>
                  <div className="p-3 bg-background/50 rounded-md text-center"><div className="text-xs">Medium</div><div className="font-medium">{difficultyCounts.MEDIUM}</div></div>
                  <div className="p-3 bg-background/50 rounded-md text-center"><div className="text-xs">Hard</div><div className="font-medium">{difficultyCounts.HARD}</div></div>
                </div>

                <div className="mt-4 flex gap-4">
                  <div className="flex-1 p-3 bg-background/50 rounded-md text-center"><div className="text-xs">Avg Score</div><div className="font-medium">{avgScore}</div></div>
                  <div className="flex-1 p-3 bg-background/50 rounded-md text-center"><div className="text-xs">Max Score</div><div className="font-medium">{maxScore}</div></div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Heatmap + Recent */}
          <aside className="lg:col-span-4 bg-card border border-border rounded-lg p-6">
            <h3 className="text-md font-semibold mb-3">Activity (last 126 days)</h3>
            <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 12px)', gap: '6px' }}>
              {heatmap.map((h) => {
                const level = Math.min(4, h.count);
                const bg = ['transparent', 'bg-green-900', 'bg-green-800', 'bg-green-700', 'bg-green-600'][level];
                return (
                  <div key={h.date} title={`${h.date}: ${h.count || 0}`} className={`w-3 h-3 rounded ${bg}`} />
                );
              })}
            </div>

            <h3 className="text-md font-semibold mb-3">Recent Submissions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-background/50 rounded-md">
                  <div className="text-sm truncate max-w-[70%]">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</div>
                </div>
              ))}
              {recent.length === 0 && <div className="text-sm text-muted-foreground">No recent submissions</div>}
            </div>
          </aside>
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm text-muted-foreground">Back to home</Link>
        </div>
      </div>
    </>
  );
}
