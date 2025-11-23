// src/components/diagram/RightPanel.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, Control, UseFormRegister, UseFormWatch, FieldValues } from 'react-hook-form';
import { useDiagramStore } from '@/store/diagramStore';
import { AlertCircle } from 'lucide-react';
import { calculateNodeCostAndErrors } from '@/store/diagramStore';

interface MetadataConfig {
  label?: string;
  type?: string;
  options?: string[];
  sub_options?: Record<string, unknown>;
  configs?: Record<string, unknown>;
  default?: string | number | boolean;
  required?: boolean;
  cost_factor?: number;
  [key: string]: unknown;
}

interface ErrorItem {
  field: string;
  message: string;
}

interface DynamicFormProps {
  control: Control<FieldValues>;
  register: UseFormRegister<FieldValues>;
  metadata: Record<string, unknown>;
  watch: UseFormWatch<FieldValues>;
  prefix?: string;
  errors?: ErrorItem[];
}

const DynamicForm = ({ control, register, metadata, watch, prefix = '', errors = [] }: DynamicFormProps) => {
  if (!metadata) return null;

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(metadata).map(([key, config]: [string, unknown]) => {
        const configData = config as MetadataConfig;
        const fieldName = prefix ? `${prefix}.${key}` : key;
        const fieldHasError = errors.some(e => e.field === fieldName);
        const inputClass = `w-full p-3 border rounded-md focus:outline-none bg-background text-foreground shadow-sm ${
          fieldHasError 
            ? 'border-destructive focus:ring-2 focus:ring-destructive' 
            : 'border-input focus:outline-none focus:ring-2 focus:ring-primary'
        }`;

        // Handle dropdowns with options
        if (configData.options) {
          return (
            <div key={fieldName} className="flex flex-col">
              <label className={`text-sm font-medium mb-2 ${fieldHasError ? 'text-destructive' : 'text-foreground'}`}>
                {String(configData.label || key)}
              </label>
              <Controller
                name={fieldName}
                control={control}
                defaultValue={Array.isArray(configData.options) ? configData.options[0] || '' : ''}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`${inputClass} cursor-pointer appearance-none bg-right pr-10 bg-no-repeat [&>option]:bg-background [&>option]:text-foreground dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    {Array.isArray(configData.options) && configData.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              />
              {/* Render sub-options or configs if they exist, based on current selection */}
              {(configData.sub_options || configData.configs) ? (
                <div className="mt-2">
                  {(() => {
                    const watchedValue = String(watch(fieldName));
                    const subOptions = configData.sub_options as Record<string, unknown>;
                    const configs = configData.configs as Record<string, unknown>;
                    const selectedConfig = subOptions?.[watchedValue] || configs?.[watchedValue];
                    
                    return selectedConfig ? (
                      <DynamicForm
                        control={control}
                        register={register}
                        metadata={selectedConfig as Record<string, unknown>}
                        watch={watch}
                        prefix={fieldName}
                        errors={errors}
                      />
                    ) : null;
                  })()}
                </div>
              ) : null}
            </div>
          );
        }

        // Handle simple input fields (number, string, boolean)
        if (configData.type) {
          return (
            <div key={fieldName} className="flex flex-col">
              <label className={`text-sm font-medium mb-2 ${fieldHasError ? 'text-destructive' : 'text-foreground'}`}>
                {String(configData.label || key)}
              </label>
              {configData.type === 'boolean' ? (
                <Controller
                  name={fieldName}
                  control={control}
                  defaultValue={configData.default || false}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value as boolean}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className={`h-5 w-5 text-primary rounded border-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer ${fieldHasError ? 'border-destructive' : 'border-input'}`}
                      />
                    </div>
                  )}
                />
              ) : (
                <input
                  type={configData.type as string}
                  {...register(fieldName, {
                    valueAsNumber: configData.type === 'number',
                  })}
                  defaultValue={String(configData.default || '')}
                  placeholder={configData.type === 'number' ? 'Enter a number' : 'Enter value'}
                  className={inputClass}
                />
              )}
            </div>
          );
        }

        // Handle nested configuration objects
        if (typeof configData === 'object' && (configData.configs || configData.sub_options)) {
          return (
            <>
              {configData.label && (
                <p className="text-sm font-semibold text-foreground mb-2">{String(configData.label || '')}</p>
              )}
              <DynamicForm
                control={control}
                register={register}
                metadata={(configData.configs || configData.sub_options) as Record<string, unknown>}
                watch={watch}
                prefix={fieldName}
                errors={errors}
              />
            </>
          );
        }

        // Handle top-level nested objects without specific type
        if (typeof configData === 'object' && !configData.type && !configData.options) {
          return (
            <>
              {configData.label && (
                <p className="text-sm font-semibold text-foreground mb-2">{String(configData.label || key)}</p>
              )}
              <DynamicForm
                control={control}
                register={register}
                metadata={configData as Record<string, unknown>}
                watch={watch}
                prefix={fieldName}
                errors={errors}
              />
            </>
          );
        }

        return null;
      })}
    </div>
  );
};

export const RightPanel = () => {
  // ✅ Optimized: Selective subscriptions - only re-render when these specific values change
  const selectedNode = useDiagramStore((state) => state.selectedNode);
  const updateNodeProperties = useDiagramStore((state) => state.updateNodeProperties);
  const nodeErrors = useDiagramStore((state) => state.nodeErrors);
  
  // ✅ Optimized: Memoize errors to avoid re-computation
  const currentErrors = useMemo(() => {
    if (!selectedNode) return [];
    return nodeErrors[selectedNode.id] || [];
  }, [selectedNode, nodeErrors]);

  const { register, reset, control, watch } = useForm<FieldValues>();

  const nodeCost = useMemo(() => {
    if (!selectedNode?.data?.metadata) return 0;
    const { cost } = calculateNodeCostAndErrors(selectedNode.data, selectedNode.data.metadata);
    return cost;
  }, [selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      reset(selectedNode.data);
    }
  }, [selectedNode, reset]);

  useEffect(() => {
    if (!selectedNode) return;

    const subscription = watch((value) => {
      if (value) {
        updateNodeProperties(selectedNode.id, value);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, selectedNode, updateNodeProperties]);

  if (!selectedNode) {
    return (
      <aside className="w-80 bg-card border-l border-border shadow-lg flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Properties</h3>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-muted-foreground italic text-center">Select a component to edit its properties.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-card border-l border-border shadow-lg flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-bold text-foreground">Edit {selectedNode.data.label}</h3>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              {...register('label')}
              className="w-full p-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground shadow-sm"
            />
          </div>
          <div className="p-3 bg-muted rounded-lg border border-border/50">
            <p className="text-sm font-medium text-foreground">Estimated Monthly Cost: <span className="text-primary font-semibold">${nodeCost.toFixed(2)}</span></p>
          </div>

          {selectedNode.data.metadata && (
            <DynamicForm
              control={control}
              register={register}
              metadata={selectedNode.data.metadata}
              watch={watch}
              errors={currentErrors}
            />
          )}

          {currentErrors.length > 0 && (
            <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-md p-4 shadow-sm">
              <h4 className="font-semibold text-destructive dark:text-red-400 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> Configuration Issues
              </h4>
              <ul className="space-y-2 text-sm">
                {currentErrors.map((err, index) => (
                  <li key={index} className="flex items-start text-destructive dark:text-red-400">
                    <AlertCircle className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
                    <span>{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};