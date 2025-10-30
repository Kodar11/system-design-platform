// src/components/docs/DocsSearch.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ThemeAwareIcon from '@/components/ui/ThemeAwareIcon';

interface Component {
  id: string;
  name: string;
  type: string;
  iconUrl: string | null;
  documentationUrl: string | null;
}

interface DocsSearchProps {
  components: Component[];
}

export default function DocsSearch({ components }: DocsSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Get unique types
  const types = useMemo(() => {
    const uniqueTypes = new Set(components.map(c => c.type));
    return Array.from(uniqueTypes).sort();
  }, [components]);

  // Filter components
  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || component.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [components, searchTerm, filterType]);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
        >
          <option value="all">All Types</option>
          {types.map((type) => (
            <option key={type} value={type} className="capitalize">
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredComponents.length} of {components.length} components
      </p>

      {/* Component Grid */}
      {filteredComponents.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center border border-border">
          <p className="text-muted-foreground text-lg">No components found matching your search.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-border hover:bg-accent/50"
            >
              <Link href={`/docs/${component.name}`} className="block">
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
              </Link>
              {component.documentationUrl && (
                <a
                  href={component.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-block mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  External Docs →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
