// src/lib/cache/problemCache.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma/userService';

// Cache problems list for 1 hour
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

// Cache single problem by ID
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
      },
    });
  },
  ['problem-by-id'],
  {
    revalidate: 3600,
    tags: ['problems'],
  }
);
