// src/app/(main)/docs/[componentName]/page.tsx
import { getServerSession } from 'next-auth';
import { NEXT_AUTH_CONFIG } from '@/lib/nextAuthConfig';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import NavBar from '@/components/ui/NavBar';
import ThemeAwareIcon from '@/components/ui/ThemeAwareIcon';
import Footer from '@/components/ui/Footer';
import { getCachedComponents, getCachedComponentByName } from '@/lib/cache/componentCache';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

// Generate static params for all components
export async function generateStaticParams() {
  const components = await getCachedComponents();
  
  return components.map((component) => ({
    componentName: component.name,
  }));
}

interface ComponentDetailsProps {
  params: Promise<{ componentName: string }>;
}

interface MetadataConfig {
  label?: string;
  type?: string;
  options?: string[];
  configs?: Record<string, unknown>;
  default?: string | number | boolean;
  required?: boolean;
  cost_factor?: number;
  [key: string]: unknown;
}

const ReadOnlyDynamicForm = ({ metadata, prefix = '' }: { metadata: Record<string, unknown>; prefix?: string }) => {
  if (!metadata) return null;

  return (
    <div className="space-y-6">
      {Object.entries(metadata).map(([key, config]: [string, unknown]) => {
        const configData = config as MetadataConfig;
        const fieldName = prefix ? `${prefix}.${key}` : key;

        // Handle dropdowns with options
        if (configData.options) {
          return (
            <div key={fieldName} className="border border-border rounded-md p-4">
              <h4 className="font-medium text-foreground mb-2">{String(configData.label || key)}</h4>
              <p className="text-sm text-muted-foreground mb-2">Options: {configData.options.join(', ')}</p>
              {configData.configs && (
                <div className="ml-4 mt-2 space-y-2">
                  {Object.entries(configData.configs).map(([option, subConfig]) => (
                    <div key={option} className="text-sm bg-muted/50 rounded p-2">
                      <strong>{option}:</strong> {JSON.stringify(subConfig, null, 2)}
                    </div>
                  ))}
                </div>
              )}
              {configData.required && <span className="text-xs text-destructive inline-block ml-2">Required</span>}
              {configData.cost_factor && <span className="text-xs text-green-600 inline-block ml-2">Cost Factor: ${configData.cost_factor}</span>}
            </div>
          );
        }

        // Handle simple fields
        if (configData.type) {
          return (
            <div key={fieldName} className="border border-border rounded-md p-4">
              <h4 className="font-medium text-foreground mb-2">{String(configData.label || key)}</h4>
              <p className="text-sm text-muted-foreground">Type: {configData.type}</p>
              {configData.default !== undefined && (
                <p className="text-sm text-muted-foreground">Default: {String(configData.default)}</p>
              )}
              {configData.required && <span className="text-xs text-destructive inline-block ml-2">Required</span>}
              {configData.cost_factor && <span className="text-xs text-green-600 inline-block ml-2">Cost Factor: ${configData.cost_factor}</span>}
            </div>
          );
        }

        // Handle nested objects
        if (typeof configData === 'object' && configData !== null && !configData.type && !configData.options) {
          return (
            <div key={fieldName} className="border border-border rounded-md p-4">
              {configData.label && <h4 className="font-medium text-foreground mb-2">{String(configData.label || key)}</h4>}
              <ReadOnlyDynamicForm metadata={configData as Record<string, unknown>} prefix={fieldName} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default async function ComponentDetailsPage({ params }: ComponentDetailsProps) {
  const { componentName } = await params;
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  
  if (!session?.user?.id) {
    redirect('/api/auth/login');
  }

  // Use cached component lookup
  const component = await getCachedComponentByName(componentName);

  if (!component) {
    notFound();
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background p-8">

        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl shadow-md p-8 border border-border">
            <div className="flex items-start gap-6 mb-8">
              <ThemeAwareIcon
                src={component.iconUrl || '/assets/icons/default.svg'}
                alt={component.name}
                width={80}
                height={80}
                className="flex-shrink-0 rounded-lg bg-muted p-2"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{component.name}</h1>
                <p className="text-xl text-muted-foreground capitalize mb-4">Type: {component.type}</p>
                {component.documentationUrl && (
                  <a
                    href={component.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Official Documentation →
                  </a>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Configuration Options</h2>
                <ReadOnlyDynamicForm metadata={component.metadata as Record<string, unknown>} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}