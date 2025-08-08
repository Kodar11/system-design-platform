// src/app/(main)/design/[designId]/edit/page.tsx
    import { Suspense } from 'react';
    import { TopBar } from '@/components/diagram/TopBar';
    import { BottomBar } from '@/components/diagram/BottomBar';
    import ComponentPalette from '@/components/diagram/ComponentPalette';
    import { RightPanel } from '@/components/diagram/RightPanel';
    import FlowProvider from '@/components/diagram/FlowProvider';
    import { prisma } from '@/lib/prisma/userService';
import { Editor } from '@/components/diagram/Editor';

    export default async function EditorPage({ params }: { params: { designId: string } }) {
      const components = await prisma.component.findMany({
        orderBy: { name: "asc" },
      });

      return (
        <div className="flex flex-col h-screen">
          {/* We now wrap the entire editor in the provider component */}
          <FlowProvider>
            <TopBar />
            <div className="flex flex-1">
              <Suspense fallback={<div>Loading components...</div>}>
                <ComponentPalette components={components} />
              </Suspense>
              <main className="flex-1">
                <Editor />
              </main>
              <RightPanel />
            </div>
            <BottomBar />
          </FlowProvider>
        </div>
      );
    }