"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDiagramStore } from '@/store/diagramStore';

const DynamicForm = ({ control, register, metadata, watch, prefix = '' }: any) => {
  if (!metadata) return null;

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(metadata).map(([key, config]: [string, any]) => {
        const fieldName = prefix ? `${prefix}.${key}` : key;

        // Handle dropdowns with options
        if (config.options) {
          return (
            <div key={fieldName} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">{config.label}</label>
              <Controller
                name={fieldName}
                control={control}
                defaultValue={config.options[0] || ''}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {config.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              />
              {/* Always render sub-options or configs if they exist, based on current selection */}
              {(config.sub_options || config.configs) && (
                <div className="ml-6 mt-4 border-l border-gray-200 pl-6">
                  {(config.sub_options?.[watch(fieldName)] || config.configs?.[watch(fieldName)]) && (
                    <DynamicForm
                      control={control}
                      register={register}
                      metadata={config.sub_options?.[watch(fieldName)] || config.configs?.[watch(fieldName)]}
                      watch={watch}
                      prefix={fieldName}
                    />
                  )}
                </div>
              )}
            </div>
          );
        }

        // Handle simple input fields (number, string, boolean)
        if (config.type) {
          return (
            <div key={fieldName} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">{config.label}</label>
              {config.type === 'boolean' ? (
                <Controller
                  name={fieldName}
                  control={control}
                  defaultValue={config.default || false}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  )}
                />
              ) : (
                <input
                  type={config.type}
                  {...register(fieldName, {
                    valueAsNumber: config.type === 'number',
                  })}
                  defaultValue={config.default || ''}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          );
        }

        // Handle nested configuration objects
        if (typeof config === 'object' && (config.configs || config.sub_options)) {
          return (
            <div key={fieldName} className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">{config.label}</p>
              <div className="ml-6 border-l border-gray-200 pl-6">
                <DynamicForm
                  control={control}
                  register={register}
                  metadata={config.configs || config.sub_options}
                  watch={watch}
                  prefix={fieldName}
                />
              </div>
            </div>
          );
        }

        // Handle top-level nested objects without specific type
        if (typeof config === 'object' && !config.type && !config.options) {
          return (
            <div key={fieldName} className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">{config.label || key}</p>
              <div className="ml-6 border-l border-gray-200 pl-6">
                <DynamicForm
                  control={control}
                  register={register}
                  metadata={config}
                  watch={watch}
                  prefix={fieldName}
                />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export const RightPanel = () => {
  const selectedNode = useDiagramStore((state) => state.selectedNode);
  const updateNodeProperties = useDiagramStore((state) => state.updateNodeProperties);

  const { register, handleSubmit, reset, control, watch } = useForm();

  useEffect(() => {
    if (selectedNode) {
      reset(selectedNode.data);
    }
  }, [selectedNode, reset]);

  if (!selectedNode) {
    return (
      <aside className="w-80 p-6 bg-gray-50 border-l border-gray-200">
        <p className="text-gray-500 italic">Select a component to edit its properties.</p>
      </aside>
    );
  }

  const onSubmit = (data: any) => {
    updateNodeProperties(selectedNode.id, data);
    alert('Properties updated!');
  };

  return (
    <aside className="w-80 p-6 bg-white border-l border-gray-200 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Edit {selectedNode.data.label}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            {...register('label')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {selectedNode.data.metadata && (
          <DynamicForm
            control={control}
            register={register}
            metadata={selectedNode.data.metadata}
            watch={watch}
          />
        )}

        <button
          type="submit"
          className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Properties
        </button>
      </form>
    </aside>
  );
};