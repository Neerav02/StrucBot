import { create } from 'zustand';

export const useProjectStore = create((set) => ({
  projects: [],
  activeProject: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
}));
