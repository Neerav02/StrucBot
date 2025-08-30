import { create } from 'zustand';

export const useSchemaStore = create((set) => ({
  schemas: [],
  currentSchema: null,
  setSchemas: (schemas) => set({ schemas }),
  addSchema: (schema) => set((state) => ({ schemas: [schema, ...state.schemas] })),
  setCurrentSchema: (schema) => set({ currentSchema: schema }),
}));
