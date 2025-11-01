// src/components/ui/NavBar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Ensure this import is present
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Exclude from editor routes
  const isEditorRoute = pathname.includes('/design/') || pathname.includes('/solve/');

  if (isEditorRoute) return null;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleBack = () => {
    router.back();
  };

  // Check if we can go back (not on home page)
  const canGoBack = pathname !== '/' && !pathname.includes('/login') && !pathname.includes('/signup');

  return (
    <nav className="bg-card/95 backdrop-blur-md border-b-2 border-border shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: Back Button + Logo */}
          <div className="flex items-center gap-4">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-accent transition-colors"
                title="Go Back"
              >
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              System Design Platform
            </Link>
          </div>

          {/* Right Side: Auth & Toggle */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            <Link href="/dashboard" className="hidden sm:inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/20 transition">
              Dashboard
            </Link>

            {/* Auth Button */}
            {status === 'loading' ? (
              <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
            ) : session ? (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}