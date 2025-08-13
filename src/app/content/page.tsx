// src/app/content/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 

import Link from 'next/link';

export default async function ContentDashboard() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session || session.user.role !== 'CONTENT_ADDER') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Content Management Dashboard</h1>
      <div className="flex space-x-4">
        <Link href="/content/components" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Manage Components
        </Link>
        <Link href="/content/problems" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Manage Problems
        </Link>
      </div>
    </div>
  );
}