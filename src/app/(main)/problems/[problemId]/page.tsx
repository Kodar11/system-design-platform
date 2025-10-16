// src/app/(main)/problems/[problemId]/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function ProblemDetailPage({ 
  params 
}: { 
  params: { problemId: string } 
}) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  const problem = await prisma.problem.findUnique({
    where: { 
      id: params.problemId,
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
      case 'EASY': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HARD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <Link 
            href="/problems" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Problems
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
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
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    {problem.submissions.length} {problem.submissions.length === 1 ? 'attempt' : 'attempts'}
                  </span>
                )}
              </div>
            </div>
            
            <Link
              href={`/problems/${problem.id}/solve/`}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Solving
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Problem Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {requirements.description && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Problem Description</h2>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">{requirements.description}</p>
              </div>
            )}

            {/* Functional Requirements */}
            {requirements.functional_requirements && requirements.functional_requirements.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Functional Requirements</h2>
                </div>
                <ul className="space-y-3">
                  {requirements.functional_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start text-gray-700">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-semibold text-sm mr-3 flex-shrink-0 mt-0.5">
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
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Non-Functional Requirements</h2>
                </div>
                <ul className="space-y-3">
                  {requirements.non_functional_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start text-gray-700">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mr-3 flex-shrink-0 mt-0.5">
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
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Expected Scale</h2>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-gray-700 font-medium text-base">{requirements.scale}</p>
                </div>
              </div>
            )}

            {/* Constraints */}
            {requirements.constraints && requirements.constraints.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Constraints</h2>
                </div>
                <ul className="space-y-3">
                  {requirements.constraints.map((constraint, idx) => (
                    <li key={idx} className="flex items-start text-gray-700">
                      <svg className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white sticky top-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Solve?</h3>
              <p className="text-blue-100 mb-6 text-sm leading-relaxed">
                Design your system architecture using our interactive diagram editor. Get instant AI-powered feedback on your solution.
              </p>
              <Link
                href={`/problems/solve/${problem.id}`}
                className="block w-full text-center px-6 py-4 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Start Solving Now
                <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <div className="mt-6 pt-6 border-t border-blue-500">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Difficulty:</span>
                  <span className="font-semibold">{problem.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-blue-200">Your Attempts:</span>
                  <span className="font-semibold">{problem.submissions.length}</span>
                </div>
              </div>
            </div>

            {/* Previous Submissions */}
            {problem.submissions.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">
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
                        <div className="text-xs text-gray-400">
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
                  className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
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
  );
}