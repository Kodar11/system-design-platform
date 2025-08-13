// src/app/content/problems/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import {prisma} from '@/lib/prisma/userService';

export default async function ProblemsPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session || session.user.role !== 'CONTENT_ADDER') {
    redirect('/login');
  }

  const problems = await prisma.problem.findMany({ where: { isDeleted: false } });

  async function handleCreateProblem(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const requirements = JSON.parse(formData.get('requirements') as string || '{}');
    const difficulty = formData.get('difficulty') as 'EASY' | 'MEDIUM' | 'HARD';
    await prisma.problem.create({
      data: { title, requirements, difficulty, isDeleted: false },
    });
    redirect('/content/problems');
  }

  async function handleUpdateProblem(formData: FormData) {
    'use server';
    const problemId = formData.get('problemId') as string;
    const title = formData.get('title') as string;
    await prisma.problem.update({
      where: { id: problemId },
      data: { title },
    });
    redirect('/content/problems');
  }

  async function handleSoftDeleteProblem(problemId: string) {
    'use server';
    await prisma.problem.update({
      where: { id: problemId },
      data: { isDeleted: true },
    });
    redirect('/content/problems');
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Problems</h1>
      <form action={handleCreateProblem} className="mb-6 space-y-2">
        <input name="title" placeholder="Title" className="border p-2 rounded w-full" required />
        <input name="requirements" placeholder="Requirements (JSON)" className="border p-2 rounded w-full" />
        <input name="difficulty" placeholder="Difficulty (EASY/MEDIUM/HARD)" className="border p-2 rounded w-full" required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Problem
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Difficulty</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem.id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  <form action={handleUpdateProblem}>
                    <input type="hidden" name="problemId" value={problem.id} />
                    <input name="title" defaultValue={problem.title} className="border p-1 rounded w-full" required />
                    <button type="submit" className="ml-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Update
                    </button>
                  </form>
                </td>
                <td className="p-2 border">{problem.difficulty}</td>
                <td className="p-2 border">
                  <form action={handleSoftDeleteProblem.bind(null, problem.id)}>
                    <button type="submit" className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                      Soft Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}