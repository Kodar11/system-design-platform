// app/(main)/design/page.tsx
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { prisma } from '@/lib/prisma/userService';
import { redirect } from 'next/navigation';
import NavBar from '@/components/ui/NavBar';

export default async function DesignListPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session) {
    redirect('/api/auth/login');
  }

  // Fetch designs for the current user
  const designs = await prisma.design.findMany({
    where: {
      userId: session.user.id,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <>
    <NavBar/>
    <div className="min-h-screen bg-background py-8">
      <header className="container mx-auto max-w-6xl px-4 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Designs</h1>
        <div className="flex items-center gap-4">
          {/* Link for creating new design */}
          <Link
            href="/design/create"
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
          >
            Create New Design
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4">
        {designs.length === 0 ? (
          <div className="bg-card rounded-xl shadow-2xl border border-border p-12 text-center mt-10">
            <div className="text-muted-foreground mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No designs yet</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first system design</p>
            <Link
              href="/design/create"
              className="inline-block bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
            >
              Create Your First Design
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => {
              // Safely cast diagramData to a usable structure
              const diagramData = design.diagramData as {
                components?: Array<{
                  id: string;
                }>;
                total_estimated_cost_per_month?: number;
              } | undefined;

              return (
                <Link
                  key={design.id}
                  href={`/design/result/${design.id}`}
                  className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-accent/50"
                >
                  <h3 className="font-extrabold text-lg text-foreground mb-2 truncate">{design.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Created: {new Date(design.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <div className="border-t border-border pt-3 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">
                      {diagramData?.components?.length || 0} components
                    </span>
                    <span className="font-extrabold text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
                      ${diagramData?.total_estimated_cost_per_month?.toFixed(2) || '0.00'}/mo
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}