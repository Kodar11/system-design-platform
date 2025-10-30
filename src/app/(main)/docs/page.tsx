// src/app/(main)/docs/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma/userService';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import NavBar from '@/components/ui/NavBar';
import ThemeAwareIcon from '@/components/ui/ThemeAwareIcon';
import Footer from '@/components/ui/Footer';

export default async function DocsPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  const components = await prisma.component.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background p-8">
        <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Component Documentation</h1>
        </header>
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground mb-8">
            Explore detailed documentation for each system design component, including configuration options and usage guidelines.
          </p>

          {components.length === 0 ? (
            <div className="bg-card rounded-lg shadow p-12 text-center border border-border">
              <p className="text-muted-foreground text-lg">No components available yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {components.map((component) => (
                <Link
                  key={component.id}
                  href={`/docs/${component.name}`}
                  className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-border hover:bg-accent/50"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <ThemeAwareIcon
                      src={component.iconUrl || '/assets/icons/default.svg'}
                      alt={component.name}
                      width={48}
                      height={48}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-foreground">{component.name}</h2>
                      <p className="text-sm text-muted-foreground capitalize">{component.type}</p>
                    </div>
                  </div>
                  {component.documentationUrl && (
                    <a
                      href={component.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      External Docs →
                    </a>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}