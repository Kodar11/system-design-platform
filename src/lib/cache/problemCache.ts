// src/lib/cache/problemCache.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma/userService';

// Cache problems list for 1 hour (lightweight - only list data)
export const getCachedProblems = unstable_cache(
  async () => {
    return await prisma.problem.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        difficulty: true,
        requirements: true,
      },
      orderBy: { difficulty: 'asc' },
    });
  },
  ['problems-list'],
  {
    revalidate: 3600,
    tags: ['problems'],
  }
);

// Cache problems by difficulty (for filtered views)
export const getCachedProblemsByDifficulty = unstable_cache(
  async (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
    return await prisma.problem.findMany({
      where: { 
        isDeleted: false,
        difficulty: difficulty,
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        requirements: true,
      },
      orderBy: { title: 'asc' },
    });
  },
  ['problems-by-difficulty'],
  {
    revalidate: 3600,
    tags: ['problems'],
  }
);

// Cache single problem by ID (full data for problem page)
export const getCachedProblemById = unstable_cache(
  async (problemId: string) => {
    return await prisma.problem.findUnique({
      where: { 
        id: problemId,
        isDeleted: false 
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        requirements: true,
        initialRequirementsQa: true,
        interviewQuestions: true,
      },
    });
  },
  ['problem-by-id'],
  {
    revalidate: 3600,
    tags: ['problems'],
  }
);

// Cache problem with user submissions (for problem detail page)
export const getCachedProblemWithSubmissions = unstable_cache(
  async (problemId: string, userId: string) => {
    return await prisma.problem.findUnique({
      where: { 
        id: problemId,
        isDeleted: false 
      },
      include: {
        submissions: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            createdAt: true,
            evaluationResult: true,
          },
        },
      },
    });
  },
  ['problem-with-submissions'],
  {
    revalidate: 600, // 10 minutes (more frequent for user data)
    tags: ['problems', 'submissions'],
  }
);

// Cache problem IDs only (for static generation)
export const getCachedProblemIds = unstable_cache(
  async () => {
    const problems = await prisma.problem.findMany({
      where: { isDeleted: false },
      select: { id: true },
      orderBy: { difficulty: 'asc' },
    });
    return problems.map(p => p.id);
  },
  ['problem-ids'],
  {
    revalidate: 7200, // 2 hours (IDs change rarely)
    tags: ['problems'],
  }
);
