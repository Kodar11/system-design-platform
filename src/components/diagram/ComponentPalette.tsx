// src/components/diagram/ComponentPalette.tsx
"use client";

import React from "react";
import Image from "next/image";

interface Component {
  id: string;
  name: string;
  type: string;
  iconUrl: string | null;
  documentationUrl?: string | null;
  metadata: unknown;
}

interface ComponentPaletteProps {
  components: Component[];
}

export default function ComponentPalette({ components }: ComponentPaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, originalType: string, componentId: string, componentName: string, metadata: unknown, iconUrl: string | null) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ nodeType, originalType, componentId, componentName, metadata, iconUrl: iconUrl || `/assets/icons/${originalType}.svg` }));
    event.dataTransfer.effectAllowed = "move";
    console.log("onDragStart - Dragging component with metadata:", metadata);
  };

  return (
    <aside className="w-64 p-4 bg-gray-900 text-white flex flex-col gap-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
      <h2 className="text-lg font-bold">Components</h2>
      {components.map((comp) => (
        <div
          key={comp.id}
          className="p-3 bg-gray-800 rounded-lg flex items-center gap-3 cursor-grab hover:bg-gray-700 transition-colors"
          onDragStart={(event) => onDragStart(event, 'component', comp.type, comp.id, comp.name, comp.metadata, comp.iconUrl)}
          draggable
        >
          <Image src={comp.iconUrl || "/assets/icons/default.svg"} alt={comp.name} width={24} height={24} />
          <span>{comp.name}</span>
        </div>
      ))}
    </aside>
  );
}