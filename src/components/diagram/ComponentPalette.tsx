// src/components/diagram/ComponentPalette.tsx
"use client";

import React from "react";

interface Component {
  id: string;
  name: string;
  type: string;
  iconUrl?: string | null;
  documentationUrl?: string | null;
  metadata: any; // Using any for Json type
}

interface ComponentPaletteProps {
  components: Component[];
}

export default function ComponentPalette({ components }: ComponentPaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, componentId: string) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ nodeType, componentId }));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 p-4 bg-gray-900 text-white flex flex-col gap-4">
      <h2 className="text-lg font-bold">Components</h2>
      {components.map((comp) => (
        <div
          key={comp.id}
          className="p-3 bg-gray-800 rounded-lg flex items-center gap-3 cursor-grab hover:bg-gray-700 transition-colors"
          onDragStart={(event) => onDragStart(event, comp.type, comp.id)}
          draggable
        >
          <img src={comp.iconUrl || "/assets/icons/default.svg"} alt={comp.name} className="w-6 h-6" />
          <span>{comp.name}</span>
        </div>
      ))}
    </aside>
  );
}