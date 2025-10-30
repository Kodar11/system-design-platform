import { Suspense } from 'react';
import { TopBar } from '@/components/diagram/TopBar';
import { BottomBar } from '@/components/diagram/BottomBar';
import ComponentPalette from '@/components/diagram/ComponentPalette';
import { RightPanel } from '@/components/diagram/RightPanel';
import FlowProvider from '@/components/diagram/FlowProvider';
import { ModeInitializer } from '@/components/diagram/ModeInitializer';
import Editor from '@/components/diagram/EditorWrapper';
import { getCachedComponents } from '@/lib/cache/componentCache';

// Enable ISR
export const revalidate = 3600;

export default async function EditorPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ problemId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { problemId: _problemId } = await params;
  const { mode } = await searchParams;
  
  console.log("Problem_id:", _problemId, "Mode:", mode);
  
  // Use cached components
  const components = await getCachedComponents();

  const interviewMode = mode === 'mock' ? 'mock' : mode === 'practice' ? 'practice' : 'practice';

  return (
    <div className="flex flex-col h-screen bg-background">
      <FlowProvider>
        <ModeInitializer mode={interviewMode} problemId={_problemId} />
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