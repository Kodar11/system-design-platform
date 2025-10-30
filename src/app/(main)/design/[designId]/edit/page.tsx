// app/(main)/design/[designId]/edit/page.tsx
import { Suspense } from 'react';
import { TopBar } from '@/components/diagram/TopBar';
import { BottomBar } from '@/components/diagram/BottomBar';
import ComponentPalette from '@/components/diagram/ComponentPalette';
import { RightPanel } from '@/components/diagram/RightPanel';
import FlowProvider from '@/components/diagram/FlowProvider';
import { Editor } from '@/components/diagram/Editor';
import { getCachedComponents } from '@/lib/cache/componentCache';

// Enable ISR
export const revalidate = 3600;

export default async function EditorPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId: _designId } = await params;
  console.log("Design_id : ",_designId);
  
  // Use cached components
  const components = await getCachedComponents();

  return (
    <div className="flex flex-col h-screen bg-background">
      <FlowProvider>
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Suspense fallback={<div className="w-64 bg-card border-r border-border flex items-center justify-center"><div className="text-muted-foreground">Loading components...</div></div>}>
            <ComponentPalette components={components} />
          </Suspense>
          <main className="flex-1 overflow-hidden">
            <Editor />
          </main>
          <RightPanel />
        </div>
        <BottomBar />
      </FlowProvider>
    </div>
  );
}