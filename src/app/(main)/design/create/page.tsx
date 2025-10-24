// app/(main)/design/create/page.tsx
import { redirect } from 'next/navigation';
import { createDesign } from '@/app/actions';
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import ThemeToggle from '@/components/ui/ThemeToggle';

async function handleCreateDesign(formData: FormData) {
  'use server';
  try {
    const designId = await createDesign(formData);
    redirect(`/design/result/${designId}`);
  } catch (error) {
    console.error('Error in handleCreateDesign:', error);
    // You might want to handle errors better here
    throw error;
  }
}

export default async function CreateDesignPage() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session) {
    redirect('/api/auth/login');
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <header className="flex justify-end mb-8 px-4">
        <ThemeToggle />
      </header>
      <div className="container mx-auto max-w-3xl px-4">
        <div className="bg-card rounded-lg shadow-md p-6 md:p-8 border border-border">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Create System Design</h1>
            <p className="mt-2 text-muted-foreground">
              Provide your requirements and our AI will generate an optimized system architecture
            </p>
          </div>

          <form action={handleCreateDesign} className="space-y-6">
            {/* Application Type */}
            <div>
              <label htmlFor="applicationType" className="block text-sm font-semibold text-foreground mb-2">
                Application Type *
              </label>
              <input
                id="applicationType"
                name="applicationType"
                type="text"
                required
                placeholder="e.g., E-commerce platform, Social media app, Real-time chat"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">What type of application are you building?</p>
            </div>

            {/* Target Scale */}
            <div>
              <label htmlFor="targetScale" className="block text-sm font-semibold text-foreground mb-2">
                Target Scale *
              </label>
              <select
                id="targetScale"
                name="targetScale"
                required
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="">Select scale...</option>
                <option value="Small (1-1,000 users)">Small (1-1,000 users)</option>
                <option value="Medium (1,000-100,000 users)">Medium (1,000-100,000 users)</option>
                <option value="Large (100,000-1M users)">Large (100,000-1M users)</option>
                <option value="Very Large (1M+ users)">Very Large (1M+ users)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Expected number of concurrent users</p>
            </div>

            {/* Key Features */}
            <div>
              <label htmlFor="keyFeatures" className="block text-sm font-semibold text-foreground mb-2">
                Key Features *
              </label>
              <textarea
                id="keyFeatures"
                name="keyFeatures"
                required
                rows={4}
                placeholder="e.g., User authentication, Product catalog, Shopping cart, Payment processing, Order tracking, Admin dashboard"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">List the main features your application needs (comma-separated)</p>
            </div>

            {/* Non-Functional Requirements */}
            <div>
              <label htmlFor="nonFunctionalRequirements" className="block text-sm font-semibold text-foreground mb-2">
                Non-Functional Requirements *
              </label>
              <textarea
                id="nonFunctionalRequirements"
                name="nonFunctionalRequirements"
                required
                rows={4}
                placeholder="e.g., High availability (99.9% uptime), Low latency (<100ms), Data encryption, GDPR compliance, Auto-scaling"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">Performance, security, compliance, and reliability requirements</p>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-semibold text-foreground mb-2">
                Monthly Budget (USD) *
              </label>
              <select
                id="budget"
                name="budget"
                required
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="">Select budget range...</option>
                <option value="$0-$100">$0 - $100 (Minimal/MVP)</option>
                <option value="$100-$500">$100 - $500 (Small Scale)</option>
                <option value="$500-$2000">$500 - $2,000 (Medium Scale)</option>
                <option value="$2000-$5000">$2,000 - $5,000 (Large Scale)</option>
                <option value="$5000+">$5,000+ (Enterprise)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Your estimated monthly infrastructure budget</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Generate Design
              </button>
            </div>
          </form>

          {/* Credit Info */}
          <div className="mt-6 p-4 bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary dark:text-primary-foreground">
              <span className="font-semibold">Credits:</span> You have {session.user.dailyDesignCredits} design credits remaining today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}