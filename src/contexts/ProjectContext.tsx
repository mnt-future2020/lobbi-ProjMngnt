"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { IProject } from "@/types";
import { useProjects } from "@/hooks/useProjects";

interface ProjectContextType {
  projects: IProject[];
  selectedProject: IProject | null;
  setSelectedProject: (project: IProject | null) => void;
  isLoading: boolean;
  mutateProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  selectedProject: null,
  setSelectedProject: () => {},
  isLoading: false,
  mutateProjects: () => {},
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projects, isLoading, mutate } = useProjects("active");
  const [selectedProject, setSelectedProjectState] = useState<IProject | null>(null);

  // On first load, restore selected project from localStorage
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const savedId = localStorage.getItem("selectedProjectId");
      const found = projects.find((p) => p._id === savedId);
      setSelectedProjectState(found || projects[0]);
    }
  }, [projects, selectedProject]);

  const setSelectedProject = (project: IProject | null) => {
    setSelectedProjectState(project);
    if (project) {
      localStorage.setItem("selectedProjectId", project._id);
    } else {
      localStorage.removeItem("selectedProjectId");
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject,
        isLoading,
        mutateProjects: mutate,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
