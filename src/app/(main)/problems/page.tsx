import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';
import ProblemsSearch from '@/components/problems/ProblemsSearch';
import { getCachedProblems } from '@/lib/cache/problemCache';

// Enable ISR
export const revalidate = 3600;

export default async function ProblemsPage() {
  // Parallel data fetching optimization
  const [session, problems] = await Promise.all([
    getServerSession(NEXT_AUTH_CONFIG),
    getCachedProblems()
  ]);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  return (
    <>
    <NavBar/>
    <div className="min-h-screen bg-background p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-foreground">
          System Design Problems
        </h1>
        <p className="text-muted-foreground mt-2">
          Practice system design with real-world scenarios. Build your diagram and get AI-powered feedback.
        </p>
      </header>
      <div className="max-w-6xl mx-auto">
        {problems.length === 0 ? (
          <div className="bg-card rounded-lg shadow-lg p-12 text-center border-2 border-border">
            <p className="text-muted-foreground text-lg">No problems available yet.</p>
          </div>
        ) : (
          <ProblemsSearch problems={problems} />
        )}
      </div>
    </div>
    <Footer/>
    </>
  );
}
