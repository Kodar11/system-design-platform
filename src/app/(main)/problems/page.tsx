// src/app/(main)/problems/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default async function ProblemsPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  const problems = await prisma.problem.findMany({
    where: { isDeleted: false },
    orderBy: { difficulty: 'asc' },
    select: {
      id: true,
      title: true,
      difficulty: true,
      requirements: true,
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'HARD': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">
          System Design Problems
        </h1>
        <ThemeToggle />
      </header>
      <div className="max-w-6xl mx-auto">
        <p className="text-muted-foreground mb-8">
          Practice system design with real-world scenarios. Build your diagram and get AI-powered feedback.
        </p>

        {problems.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-12 text-center border border-border">
            <p className="text-muted-foreground text-lg">No problems available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-border hover:bg-accent/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground flex-1">
                    {problem.title}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground mb-4">
                  {typeof problem.requirements === 'object' && problem.requirements !== null && 
                   'description' in problem.requirements
                    ? String((problem.requirements as { description?: string }).description).slice(0, 150) + '...'
                    : 'Click to view problem details'}
                </div>

                <div className="flex items-center text-primary font-medium text-sm">
                  View Problem
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}