// src/app/(main)/docs/loading.tsx
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

export default function DocsLoading() {
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
            <div className="w-40 h-10 bg-muted rounded-lg animate-pulse"></div>
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow p-6 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-muted rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
