import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

export default async function ProblemDetailPage({ 
  params 
}: { 
  params: Promise<{ problemId: string }> 
}) {
  const { problemId } = await params;
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  const problem = await prisma.problem.findUnique({
    where: { 
      id: problemId,
      isDeleted: false 
    },
    include: {
      submissions: {
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          evaluationResult: true
        }
      },
    },
  });

  if (!problem) {
    notFound();
  }

  const requirements = problem.requirements as {
    description?: string;
    functional_requirements?: string[];
    non_functional_requirements?: string[];
    constraints?: string[];
    scale?: string;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      // FIX: Changed text-X-900 to text-X-800 for better contrast on bg-X-100 in light theme
      case 'EASY': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-50 border-green-200 dark:border-green-800/50';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-50 border-yellow-200 dark:border-yellow-800/50';
      case 'HARD': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-50 border-red-200 dark:border-red-800/50';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800/50';
    }
  };

  const getScoreColor = (score: number) => {
    // FIX: Changed text-X-900 to text-X-800 for better contrast on bg-X-100 in light theme
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-50';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-50';
    return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-50';
  };

  return (
    <>
    <NavBar/>    
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {problem.title}
            </h1>
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {problem.difficulty}
              </span>
              {problem.submissions.length > 0 && (
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                  {problem.submissions.length} {problem.submissions.length === 1 ? 'attempt' : 'attempts'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link
              href={`/problems/${problem.id}/solve?mode=practice`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-base rounded-xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              📝 Practice Mode
            </Link>
            <Link
              href={`/problems/${problem.id}/solve?mode=mock`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              🎤 Mock Interview
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Problem Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {requirements.description && (
              <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Problem Description</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg">{requirements.description}</p>
              </div>
            )}

            {/* Functional Requirements */}
            {requirements.functional_requirements && requirements.functional_requirements.length > 0 && (
              <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Functional Requirements</h2>
                </div>
                <ul className="space-y-3">
                  {requirements.functional_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start text-foreground/90">
                      {/* FIX: Changed text-green-900 to text-green-800 for better light theme contrast on bg-green-100 */}
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-50 font-semibold text-sm mr-3 flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-base">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Non-Functional Requirements */}
            {requirements.non_functional_requirements && requirements.non_functional_requirements.length > 0 && (
              <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Non-Functional Requirements</h2>
                </div>
                <ul className="space-y-3">
                  {requirements.non_functional_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start text-foreground/90">
                      {/* FIX: Changed text-purple-900 to text-purple-800 for better light theme contrast on bg-purple-100 */}
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-50 font-semibold text-sm mr-3 flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-base">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scale Requirements */}
            {requirements.scale && (
              <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Expected Scale</h2>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-4">
                  <p className="text-foreground/90 font-medium text-base">{requirements.scale}</p>
                </div>
              </div>
            )}

            {/* Constraints */}
            {requirements.constraints && requirements.constraints.length > 0 && (
              <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Constraints</h2>
                </div>
                <ul className="space-y-3">
                  {requirements.constraints.map((constraint, idx) => (
                    <li key={idx} className="flex items-start text-foreground/90">
                      <svg className="w-5 h-5 text-orange-500 dark:text-orange-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base">{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Action Card & Previous Submissions */}
          <div className="space-y-6">
            {/* Quick Action Card */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg p-6 text-primary-foreground sticky top-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Solve?</h3>
              <p className="text-primary-foreground/80 mb-6 text-sm leading-relaxed">
                Choose your mode: Practice with pre-set questions or experience a realistic Mock Interview with AI.
              </p>
              <div className="space-y-3">
                <Link
                  href={`/problems/${problem.id}/solve?mode=practice`}
                  className="block w-full text-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  📝 Practice Mode
                </Link>
                <Link
                  href={`/problems/${problem.id}/solve?mode=mock`}
                  className="block w-full text-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  🎤 Mock Interview
                </Link>
              </div>
              
              <div className="mt-6 pt-6 border-t border-primary-foreground/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/80">Difficulty:</span>
                  <span className="font-semibold">{problem.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-primary-foreground/80">Your Attempts:</span>
                  <span className="font-semibold">{problem.submissions.length}</span>
                </div>
              </div>
            </div>

            {/* Previous Submissions */}
            {problem.submissions.length > 0 && (
              <div className="bg-card rounded-xl shadow-md p-6 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Attempts
                </h3>
                <div className="space-y-3">
                  {problem.submissions.map((submission) => {
                    const evaluation = submission.evaluationResult as { score?: number };
                    
                    return (
                      <Link
                        key={submission.id}
                        href={`/problems/result/${submission.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {evaluation.score !== undefined && (
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(evaluation.score)}`}>
                              {evaluation.score}/100
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(submission.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                
                <Link
                  href="/problems"
                  className="block mt-4 text-center text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View All Problems →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client-side script to set currentProblemId safely */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.setItem('currentProblemId', '${problem.id}');
              sessionStorage.setItem('currentProblemTitle', ${JSON.stringify(problem.title)});
            }
          `,
        }}
      />
    </div>
    <Footer/>
    </>
  );
}
