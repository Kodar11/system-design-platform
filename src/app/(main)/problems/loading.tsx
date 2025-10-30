// src/app/(main)/problems/loading.tsx
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

export default function ProblemsLoading() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background p-8">
        <header className="max-w-6xl mx-auto mb-8">
          <div className="h-10 bg-muted rounded w-96 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-full max-w-2xl animate-pulse"></div>
        </header>
        <div className="max-w-6xl mx-auto">
          {/* Search Bar Skeleton */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-48 h-10 bg-muted rounded-lg animate-pulse"></div>
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-lg p-6 border-2 border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                  <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-4/6 animate-pulse"></div>
                </div>
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
