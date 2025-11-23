// Schema types for DB design modal
export type ColumnProperty = 'Primary Key' | 'Foreign Key' | 'Unique' | 'Required' | 'Nullable' | 'Indexed';

export interface ColumnDefinition {
  id: string;
  name: string;
  dataType: string;
  property: ColumnProperty[];
  explanation?: string;
  isNew?: boolean;
}

export interface TableDefinition {
  id: string;
  name: string;
  columns: ColumnDefinition[];
  isPrimary?: boolean;
}

export interface DatabaseSchema {
  tables: TableDefinition[];
}

export const defaultDataTypes = [
  'String', 'Int', 'BigInt', 'Float', 'Boolean', 'UUID', 'DateTime', 'JSON', 'Text'
];
