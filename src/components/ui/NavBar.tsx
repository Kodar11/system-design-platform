// src/components/ui/NavBar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Ensure this import is present
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Exclude from editor routes
  const isEditorRoute = pathname.includes('/design/') || pathname.includes('/solve/');

  if (isEditorRoute) return null;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Website Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              System Design Platform
            </Link>
          </div>

          {/* Right Side: Auth & Toggle */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

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