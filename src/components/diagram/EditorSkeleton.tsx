// src/components/diagram/EditorSkeleton.tsx
export default function EditorSkeleton() {
  return (
    <div className="w-full h-full bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground animate-pulse">Loading diagram editor...</p>
      </div>
    </div>
  );
}
