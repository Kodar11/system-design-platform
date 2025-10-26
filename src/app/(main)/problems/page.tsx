import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import NavBar from '@/components/ui/NavBar';

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
      // Enhanced contrast for light theme
      case 'EASY': return 'text-green-900 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
      case 'MEDIUM': return 'text-yellow-900 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800';
      case 'HARD': return 'text-red-900 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800';
      default: return 'text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <>
    <NavBar/>
    <div className="min-h-screen bg-background p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-foreground">
          System Design Problems
        </h1>
      </header>
      <div className="max-w-6xl mx-auto">
        <p className="text-muted-foreground mb-8">
          Practice system design with real-world scenarios. Build your diagram and get AI-powered feedback.
        </p>

        {problems.length === 0 ? (
          <div className="bg-card rounded-lg shadow-lg p-12 text-center border-2 border-border">
            <p className="text-muted-foreground text-lg">No problems available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="bg-card rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 border-2 border-border hover:border-primary/30 hover:bg-accent/30"
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
    </>
  );
}
