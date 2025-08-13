// src/app/content/components/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import {prisma} from '@/lib/prisma/userService';

export default async function ComponentsPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session || session.user.role !== 'CONTENT_ADDER') {
    redirect('/login');
  }

  const components = await prisma.component.findMany({ where: { isDeleted: false } });

  async function handleCreateComponent(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const iconUrl = formData.get('iconUrl') as string || undefined;
    const documentationUrl = formData.get('documentationUrl') as string || undefined;
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    await prisma.component.create({
      data: { name, type, iconUrl, documentationUrl, metadata, isDeleted: false },
    });
    redirect('/content/components');
  }

  async function handleUpdateComponent(formData: FormData) {
    'use server';
    const componentId = formData.get('componentId') as string;
    const name = formData.get('name') as string;
    await prisma.component.update({
      where: { id: componentId },
      data: { name },
    });
    redirect('/content/components');
  }

  async function handleSoftDeleteComponent(componentId: string) {
    'use server';
    await prisma.component.update({
      where: { id: componentId },
      data: { isDeleted: true },
    });
    redirect('/content/components');
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Components</h1>
      <form action={handleCreateComponent} className="mb-6 space-y-2">
        <input name="name" placeholder="Name" className="border p-2 rounded w-full" required />
        <input name="type" placeholder="Type" className="border p-2 rounded w-full" required />
        <input name="iconUrl" placeholder="Icon URL" className="border p-2 rounded w-full" />
        <input name="documentationUrl" placeholder="Documentation URL" className="border p-2 rounded w-full" />
        <input name="metadata" placeholder="Metadata (JSON)" className="border p-2 rounded w-full" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Component
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => (
              <tr key={component.id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  <form action={handleUpdateComponent}>
                    <input type="hidden" name="componentId" value={component.id} />
                    <input name="name" defaultValue={component.name} className="border p-1 rounded w-full" required />
                    <button type="submit" className="ml-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Update
                    </button>
                  </form>
                </td>
                <td className="p-2 border">{component.type}</td>
                <td className="p-2 border">
                  <form action={handleSoftDeleteComponent.bind(null, component.id)}>
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