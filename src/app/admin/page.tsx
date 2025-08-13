// src/app/admin/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import {prisma} from '@/lib/prisma/userService';

export default async function AdminDashboard() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const users = await prisma.user.count();
  const payments = await prisma.payment.findMany();
  const components = await prisma.component.count({ where: { isDeleted: false } });
  const problems = await prisma.problem.count({ where: { isDeleted: false } });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="text-3xl font-bold">{users}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold">Active Subscriptions</h2>
          <p className="text-3xl font-bold">{payments.filter(p => p.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total Components</h2>
          <p className="text-3xl font-bold">{components}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total Problems</h2>
          <p className="text-3xl font-bold">{problems}</p>
        </div>
      </div>
      <div className="flex space-x-4">
        <Link href="/admin/users" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Manage Users
        </Link>
        <Link href="/admin/billing" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Manage Billing
        </Link>
      </div>
    </div>
  );
}