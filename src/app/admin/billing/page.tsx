// src/app/admin/billing/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import {prisma} from '@/lib/prisma/userService';

export default async function BillingPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const payments = await prisma.payment.findMany({
    include: {
      user: { select: { email: true } },
      plan: { select: { name: true } },
    },
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Billing Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">User Email</th>
              <th className="p-2 border">Plan</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="p-2 border">{payment.user.email}</td>
                <td className="p-2 border">{payment.plan.name}</td>
                <td className="p-2 border">{payment.status}</td>
                <td className="p-2 border">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Refund
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}