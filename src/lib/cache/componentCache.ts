// src/lib/cache/componentCache.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma/userService';

// Cache components list for 1 hour (3600 seconds)
export const getCachedComponents = unstable_cache(
  async () => {
    return await prisma.component.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        type: true,
        iconUrl: true,
        documentationUrl: true,
        metadata: true,
      },
      orderBy: { name: 'asc' },
    });
  },
  ['components-list'],
  {
    revalidate: 3600, // 1 hour
    tags: ['components'],
  }
);

// Cache single component by name
export const getCachedComponentByName = unstable_cache(
  async (componentName: string) => {
    return await prisma.component.findFirst({
      where: { 
        name: componentName,
        isDeleted: false 
      },
      select: {
        id: true,
        name: true,
        type: true,
        iconUrl: true,
        documentationUrl: true,
        metadata: true,
      },
    });
  },
  ['component-by-name'],
  {
    revalidate: 3600,
    tags: ['components'],
  }
);
