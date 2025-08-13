// src/app/admin/users/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import {prisma} from '@/lib/prisma/userService';

export default async function UsersPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  async function handleUpdateUser(formData: FormData) {
    'use server';
    const userId = formData.get('userId') as string;
    const role = formData.get('role') as 'USER' | 'ADMIN' | 'CONTENT_ADDER';
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    redirect('/admin/users');
  }

  async function handleDeleteUser(userId: string) {
    'use server';
    await prisma.user.delete({ where: { id: userId } });
    redirect('/admin/users');
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Username</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-2 border">{user.username}</td>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">
                  <form action={handleUpdateUser}>
                    <input type="hidden" name="userId" value={user.id} />
                    <select name="role" defaultValue={user.role} className="border p-1 rounded">
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="CONTENT_ADDER">CONTENT_ADDER</option>
                    </select>
                    <button type="submit" className="ml-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Update Role
                    </button>
                  </form>
                </td>
                <td className="p-2 border">
                  <form action={handleDeleteUser.bind(null, user.id)}>
                    <button type="submit" className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                      Delete
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