// src/app/(main)/problems/result/[submissionId]/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function SubmissionResultPage({ 
  params 
}: { 
  params: { submissionId: string } 
}) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  const submission = await prisma.submission.findUnique({
    where: { 
      id: params.submissionId,
      userId: session.user.id // Ensure user can only view their own submissions
    },
    include: {
      problem: true,
      user: {
        select: {
          username: true,
          email: true
        }
      }
    }
  });

  if (!submission) {
    notFound();
  }

  const evaluation = submission.evaluationResult as {
    score?: number;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    component_analysis?: string;
    scalability_assessment?: string;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href={`/problems/${submission.problemId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Problem
          </Link>
          
          <Link
            href={`/problems/solve/${submission.problemId}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Submission Evaluation</h1>
            <p className="text-blue-100">{submission.problem.title}</p>
            <p className="text-sm text-blue-200 mt-2">
              Submitted on {new Date(submission.createdAt).toLocaleDateString()} at{' '}
              {new Date(submission.createdAt).toLocaleTimeString()}
            </p>
          </div>

          {evaluation.score !== undefined && (
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
                  <p className="text-gray-600">{getScoreLabel(evaluation.score)}</p>
                </div>
                <div className={`text-6xl font-bold ${getScoreColor(evaluation.score)}`}>
                  {evaluation.score}
                  <span className="text-3xl">/100</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 ${getScoreBgColor(evaluation.score)} transition-all duration-500 ease-out`}
                  style={{ width: `${evaluation.score}%` }}
                />
              </div>
            </div>
          )}

          <div className="p-8">
            {evaluation.feedback && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detailed Feedback
                </h2>
                <div className="bg-gray-50 rounded-lg p-6 prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {evaluation.feedback}
                  </p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {evaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start text-green-800">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.improvements && evaluation.improvements.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {evaluation.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start text-orange-800">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {evaluation.component_analysis && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Component Analysis
                </h2>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {evaluation.component_analysis}
                  </p>
                </div>
              </div>
            )}

            {evaluation.scalability_assessment && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Scalability Assessment
                </h2>
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {evaluation.scalability_assessment}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
            <Link
              href="/problems"
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to All Problems
            </Link>
            <div className="flex space-x-4">
              <Link
                href={`/problems/${submission.problemId}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
              >
                View Problem
              </Link>
              <Link
                href={`/problems/solve/${submission.problemId}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Solve Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}