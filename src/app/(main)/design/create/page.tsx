// src/app/(main)/design/create/page.tsx

import { prisma } from "@/lib/prisma/userService";
import ComponentPalette from "@/components/diagram/ComponentPalette";
import { Suspense } from "react";

// This is an async Server Component that fetches data
export default async function CreateDesignPage() {
  const components = await prisma.component.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex">
      {/* The ComponentPalette is a Client Component */}
      <Suspense fallback={<div>Loading components...</div>}>
        <ComponentPalette components={components} />
      </Suspense>

      {/* Placeholder for the main diagram canvas */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold p-4">Drag and drop components here</h1>
      </div>
    </div>
  );
}