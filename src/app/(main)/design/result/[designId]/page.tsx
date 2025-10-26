// app/(main)/design/result/[designId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import Link from 'next/link';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

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

export default async function DesignResultPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session) {
    redirect('/api/auth/login');
  }

  const design = await prisma.design.findUnique({
    where: { 
      id: designId,
      isDeleted: false,
    },
  });

  if (!design || design.userId !== session.user.id) {
    notFound();
  }
  //@ts-expect-error - Prisma JSON field requires specific type casting
  const diagramData = design.diagramData as DiagramData;

  return (
    <>
    <NavBar/>
    <div className="min-h-screen bg-background py-8">

      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{design.name}</h1>
              <p className="text-muted-foreground">
                Created on {new Date(design.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Estimated Cost</div>
              <div className="text-3xl font-bold text-primary">
                ${diagramData.total_estimated_cost_per_month.toFixed(2)}<span className="text-lg">/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Design Rationale */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-3">Design Rationale</h2>
          <p className="text-muted-foreground leading-relaxed">{diagramData.design_rationale}</p>
        </div>

        {/* Components */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Architecture Components</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Component</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Purpose</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Cost/Month</th>
                </tr>
              </thead>
              <tbody>
                {diagramData.components.map((component) => (
                  <tr key={component.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium text-foreground">{component.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{component.type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary">
                        {component.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{component.service}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{component.purpose}</td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">
                      ${component.estimated_cost_per_month.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td colSpan={5} className="py-3 px-4 text-right text-foreground">Total:</td>
                  <td className="py-3 px-4 text-right text-primary">
                    ${diagramData.total_estimated_cost_per_month.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Connections */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Component Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagramData.connections.map((connection, index) => {
              const sourceComponent = diagramData.components.find(c => c.id === connection.source);
              const targetComponent = diagramData.components.find(c => c.id === connection.target);
              
              return (
                <div key={index} className="border border-border rounded-lg p-4 hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{sourceComponent?.name}</div>
                      <div className="text-xs text-muted-foreground">{sourceComponent?.service}</div>
                    </div>
                    <div className="px-3">
                      <div className="text-xs text-center text-muted-foreground mb-1">{connection.label}</div>
                      <div className="text-2xl text-muted-foreground">→</div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium text-foreground">{targetComponent?.name}</div>
                      <div className="text-xs text-muted-foreground">{targetComponent?.service}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/design/create"
            className="flex-1 bg-primary text-primary-foreground text-center font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create New Design
          </Link>
          <Link
            href="/design"
            className="flex-1 bg-secondary text-secondary-foreground text-center font-semibold px-6 py-3 rounded-lg hover:bg-accent transition-colors"
          >
            View All Designs
          </Link>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
}