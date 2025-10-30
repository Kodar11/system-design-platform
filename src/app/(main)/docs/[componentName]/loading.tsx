// src/app/(main)/docs/[componentName]/loading.tsx
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';

export default function ComponentDetailsLoading() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background p-8">
        <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
          <Link 
            href="/docs" 
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Components
          </Link>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl shadow-md p-8 border border-border">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 bg-muted rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="h-7 bg-muted rounded w-56 mb-4 animate-pulse"></div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-border rounded-md p-4 mb-4">
                    <div className="h-5 bg-muted rounded w-40 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
