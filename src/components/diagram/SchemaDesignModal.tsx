'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
const genId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
import { useDiagramStore } from '@/store/diagramStore';
import type { TableDefinition, ColumnDefinition } from '@/types/schema';
import { defaultDataTypes } from '@/types/schema';

interface FormTable {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

interface SchemaForm {
  tables: FormTable[];
}

export const SchemaDesignModal: React.FC<{ isOpen: boolean; onOpenChange: (open: boolean) => void }> = ({ isOpen, onOpenChange }) => {
  const databaseSchema = useDiagramStore((s) => s.databaseSchema);
  const setDatabaseSchema = useDiagramStore((s) => s.setDatabaseSchema);

  const { control, register, handleSubmit, reset } = useForm<SchemaForm>({
    defaultValues: { tables: databaseSchema.length ? databaseSchema : [] },
  });

  const { fields: tableFields, append: appendTable, remove: removeTable } = useFieldArray({ control, name: 'tables' });

  // Initialize form when opening
  React.useEffect(() => {
    if (isOpen) reset({ tables: databaseSchema.length ? databaseSchema : [] });
  }, [isOpen, databaseSchema, reset]);

  const onAddTable = () => {
    const newTable: FormTable = { id: genId(), name: 'NewTable', columns: [{ id: genId(), name: 'id', dataType: 'UUID', property: ['Primary Key'], explanation: '' }] };
    appendTable(newTable as any);
  };

  const onSubmit = (data: SchemaForm) => {
    // Persist into store
    setDatabaseSchema(data.tables as unknown as TableDefinition[]);
    onOpenChange(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[85vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Database Schema Designer</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => onOpenChange(false)} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
            </div>
          </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-300">Define tables and columns for your submission. Changes saved on Submit.</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onAddTable} className="px-3 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Add Table</button>
              <button type="submit" className="px-3 py-1 rounded text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">Save Schema</button>
            </div>
          </div>

          <div className="space-y-4">
            {tableFields.map((table, tIdx) => (
              <div key={table.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <input {...register(`tables.${tIdx}.name` as const)} defaultValue={table.name as any} className="px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => removeTable(tIdx)} className="px-2 py-1 text-sm text-red-600 border border-red-200 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/40">Remove Table</button>
                      </div>
                </div>

                <TableColumns control={control} tableIndex={tIdx} register={register} />

              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};

const TableColumns: React.FC<any> = ({ control, tableIndex, register }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `tables.${tableIndex}.columns` });

  return (
    <div className="space-y-2">
        <div className="flex items-center justify-between text-sm mb-1">
        <div className="font-medium text-gray-800 dark:text-gray-100">Columns</div>
        <button type="button" onClick={() => append({ id: genId(), name: 'col', dataType: 'String', property: [], explanation: '' })} className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Add Column</button>
      </div>
      <div className="space-y-2">
        {fields.map((f: any, idx: number) => (
          <div key={f.id} className="grid grid-cols-4 gap-2 items-center">
            <input {...register(`tables.${tableIndex}.columns.${idx}.name` as const)} defaultValue={f.name} className="px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" />
            <select {...register(`tables.${tableIndex}.columns.${idx}.dataType` as const)} defaultValue={f.dataType} className="px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded">
              {defaultDataTypes.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
            </select>
            <input {...register(`tables.${tableIndex}.columns.${idx}.explanation` as const)} defaultValue={f.explanation} placeholder="Explanation" className="px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => remove(idx)} className="px-2 py-1 text-sm text-red-600 border border-red-200 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/40">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemaDesignModal;
