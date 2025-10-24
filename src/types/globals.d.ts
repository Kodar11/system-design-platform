// src/types/globals.d.ts (new file to fix CSS import TS error)
declare module '*.css' {
  const content: string;
  export default content;
}