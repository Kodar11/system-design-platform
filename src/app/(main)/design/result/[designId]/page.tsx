import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';

interface DesignComponent {
  id: string;
  name: string;
  type: string;
  provider: string;
  service: string;
  purpose: string;
  estimated_cost_per_month: number;
}

interface DesignConnection {
  source: string;
  target: string;
  label: string;
}

interface DiagramData {
  design_rationale: string;
  components: DesignComponent[];
  connections: DesignConnection[];
  total_estimated_cost_per_month: number;
}

export default async function DesignResultPage({ params }: { params: { designId: string } }) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session) {
    redirect('/api/auth/login');
  }

  const design = await prisma.design.findUnique({
    where: { 
      id: params.designId,
      isDeleted: false,
    },
  });

  if (!design || design.userId !== session.user.id) {
    notFound();
  }
  //@ts-ignore
  const diagramData = design.diagramData as DiagramData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{design.name}</h1>
              <p className="text-gray-600">
                Created on {new Date(design.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Estimated Cost</div>
              <div className="text-3xl font-bold text-blue-600">
                ${diagramData.total_estimated_cost_per_month.toFixed(2)}<span className="text-lg">/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Design Rationale */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Design Rationale</h2>
          <p className="text-gray-700 leading-relaxed">{diagramData.design_rationale}</p>
        </div>

        {/* Components */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Architecture Components</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Component</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Month</th>
                </tr>
              </thead>
              <tbody>
                {diagramData.components.map((component) => (
                  <tr key={component.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{component.name}</td>
                    <td className="py-3 px-4 text-gray-700">{component.type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {component.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{component.service}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{component.purpose}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${component.estimated_cost_per_month.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-bold">
                  <td colSpan={5} className="py-3 px-4 text-right text-gray-900">Total:</td>
                  <td className="py-3 px-4 text-right text-blue-600">
                    ${diagramData.total_estimated_cost_per_month.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Connections */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Component Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagramData.connections.map((connection, index) => {
              const sourceComponent = diagramData.components.find(c => c.id === connection.source);
              const targetComponent = diagramData.components.find(c => c.id === connection.target);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{sourceComponent?.name}</div>
                      <div className="text-xs text-gray-500">{sourceComponent?.service}</div>
                    </div>
                    <div className="px-3">
                      <div className="text-xs text-center text-gray-600 mb-1">{connection.label}</div>
                      <div className="text-2xl text-gray-400">→</div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium text-gray-900">{targetComponent?.name}</div>
                      <div className="text-xs text-gray-500">{targetComponent?.service}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <a
            href="/design/create"
            className="flex-1 bg-blue-600 text-white text-center font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Create New Design
          </a>
          <a
            href="/design"
            className="flex-1 bg-gray-200 text-gray-800 text-center font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            View All Designs
          </a>
        </div>
      </div>
    </div>
  );
}