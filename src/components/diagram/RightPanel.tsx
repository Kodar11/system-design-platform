"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDiagramStore } from '@/store/diagramStore';

export const RightPanel = () => {
  const selectedNode = useDiagramStore(state => state.selectedNode);
  const updateNodeProperties = useDiagramStore(state => state.updateNodeProperties);

  const { register, handleSubmit, reset } = useForm();

  // Reset the form whenever a new node is selected
  useEffect(() => {
    if (selectedNode) {
      reset(selectedNode.data);
    }
  }, [selectedNode, reset]);

  if (!selectedNode) {
    return <aside className="right-panel w-80 p-4 bg-gray-100 border-l">
      Select a component to edit its properties.
    </aside>;
  }

  const onSubmit = (data: any) => {
    updateNodeProperties(selectedNode.id, data);
    alert('Properties updated!');
  };

  return (
    <aside className="right-panel w-80 p-4 bg-white border-l shadow-lg">
      <h3 className="text-xl font-bold mb-4">Edit {selectedNode.data.label}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input {...register("label")} className="w-full p-2 border rounded" />
        </div>
        
        {/* Dynamic fields based on component type */}
        {selectedNode.type === 'database' && (
          <div>
            <label className="block text-sm font-medium mb-1">Instance Type</label>
            <input {...register("instanceType")} className="w-full p-2 border rounded" />
          </div>
        )}
        
        <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded">
          Save Properties
        </button>
      </form>
    </aside>
  );
};
