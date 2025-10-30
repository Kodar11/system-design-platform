// src/app/(main)/docs/page.tsx
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';
import DocsSearch from '@/components/docs/DocsSearch';
import { getCachedComponents } from '@/lib/cache/componentCache';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export default async function DocsPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  // Use cached components
  const components = await getCachedComponents();

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background p-8">
        <header className="max-w-6xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Component Documentation</h1>
          <p className="text-muted-foreground">
            Explore detailed documentation for each system design component, including configuration options and usage guidelines.
          </p>
        </header>
        <div className="max-w-6xl mx-auto">
          {components.length === 0 ? (
            <div className="bg-card rounded-lg shadow p-12 text-center border border-border">
              <p className="text-muted-foreground text-lg">No components available yet.</p>
            </div>
          ) : (
            <DocsSearch components={components} />
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}