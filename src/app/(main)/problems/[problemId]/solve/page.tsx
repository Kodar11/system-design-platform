import { Suspense } from 'react';
import { TopBar } from '@/components/diagram/TopBar';
import { BottomBar } from '@/components/diagram/BottomBar';
import ComponentPalette from '@/components/diagram/ComponentPalette';
import { RightPanel } from '@/components/diagram/RightPanel';
import FlowProvider from '@/components/diagram/FlowProvider';
import { ModeInitializer } from '@/components/diagram/ModeInitializer';
import Editor from '@/components/diagram/EditorWrapper';
import { getCachedComponents } from '@/lib/cache/componentCache';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { prisma } from '@/lib/prisma/userService';
import { redirect } from 'next/navigation';
import { getCachedProblems } from '@/lib/cache/problemCache';

// Enable ISR
export const revalidate = 3600;

// Generate static paths for the most popular problems
export async function generateStaticParams() {
  const problems = await getCachedProblems();
  
  // Pre-generate first 20 problems (most popular)
  return problems.slice(0, 20).map((problem) => ({
    problemId: problem.id,
  }));
}

export default async function EditorPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ problemId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  // Parallel data fetching optimization
  const [{ problemId: _problemId }, { mode }, components] = await Promise.all([
    params,
    searchParams,
    getCachedComponents()
  ]);
  
  console.log("Problem_id:", _problemId, "Mode:", mode);

  const interviewMode = mode === 'mock' ? 'mock' : mode === 'practice' ? 'practice' : 'practice';

  // Server-side access control: ensure user is logged in and has credits for the chosen mode.
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) {
    // No DB user — force login/recreate
    redirect('/api/auth/login');
  }

  // Check subscription and credits
  if (interviewMode === 'mock') {
    if (dbUser.subscriptionStatus !== 'PRO' || dbUser.dailyDesignCredits <= 0) {
      // Redirect to pricing/payment page
      redirect(`/payment`);
    }
  } else {
    if (dbUser.subscriptionStatus !== 'PRO' || dbUser.dailyProblemCredits <= 0) {
      redirect(`/payment`);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <FlowProvider>
        <ModeInitializer mode={interviewMode} problemId={_problemId} />
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Suspense fallback={<div className="w-64 bg-card border-r border-border flex items-center justify-center"><div className="text-muted-foreground">Loading components...</div></div>}>
            <ComponentPalette components={components} />
          </Suspense>
          <main className="flex-1 overflow-hidden">
            <Editor />
          </main>
          <RightPanel />
        </div>
        <BottomBar />
      </FlowProvider>
    </div>
  );
}