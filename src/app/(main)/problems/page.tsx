// src/app/(main)/problems/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';

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
      case 'EASY': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HARD': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            System Design Problems
          </h1>
          <p className="text-gray-600">
            Practice system design with real-world scenarios. Build your diagram and get AI-powered feedback.
          </p>
        </div>

        {problems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No problems available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex-1">
                    {problem.title}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {typeof problem.requirements === 'object' && problem.requirements !== null && 
                   'description' in problem.requirements
                    ? String((problem.requirements as { description?: string }).description).slice(0, 150) + '...'
                    : 'Click to view problem details'}
                </div>

                <div className="flex items-center text-blue-600 font-medium text-sm">
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