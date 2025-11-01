import { NextResponse } from 'next/server';
import resetDailyCreditsForUser from '@/lib/prisma/credits';

/**
 * Internal endpoint: GET /api/credits/reset?userId=...
 * This endpoint is intentionally simple and is only intended to be called
 * by internal middleware via a server-side fetch. It resets daily credits
 * for the provided userId and returns 200 on success.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 });

    // Call the Prisma-backed helper (this runs in Node server runtime)
    const updated = await resetDailyCreditsForUser(String(userId));
    if (!updated) return NextResponse.json({ ok: false, message: 'user not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/credits/reset:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
