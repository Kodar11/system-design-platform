import prisma from './client';

/**
 * Reset daily credits for a user if their last reset was more than 24 hours ago.
 * - PRO users get 2 mock (dailyDesignCredits) and 10 practice (dailyProblemCredits)
 * - FREE users will be topped up to the signup defaults (1 each) if they have less
 *   than the default value.
 *
 * Returns the updated user record or null if the user wasn't found.
 */
export async function resetDailyCreditsForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const now = new Date();
  const lastReset = user.lastCreditReset ?? new Date(0);
  const hoursSince = (now.getTime() - new Date(lastReset).getTime()) / (1000 * 60 * 60);

  // Only reset if it's been at least 24 hours since last reset
  if (hoursSince < 24) return user;

  // Compute midnight (start of current day) and use that as the canonical reset timestamp
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.subscriptionStatus === 'PRO') {
    // PRO daily allowances — set lastCreditReset to today's midnight so next reset
    // happens at the next midnight boundary.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        dailyDesignCredits: 2,
        dailyProblemCredits: 10,
        lastCreditReset: startOfToday,
      },
    });
    return updated;
  }

  // FREE or other tiers: top-up to signup defaults but don't reduce credits
  const defaultDesign = 1;
  const defaultProblem = 1;
  const updateData: Record<string, unknown> = {};
  if ((user.dailyDesignCredits ?? 0) < defaultDesign) updateData.dailyDesignCredits = defaultDesign;
  if ((user.dailyProblemCredits ?? 0) < defaultProblem) updateData.dailyProblemCredits = defaultProblem;

  // Set lastCreditReset to today's midnight so the next reset aligns to midnight
  updateData.lastCreditReset = startOfToday;

  // If there's nothing to change except lastCreditReset, still persist that timestamp
  const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
  return updated;
}

export default resetDailyCreditsForUser;
