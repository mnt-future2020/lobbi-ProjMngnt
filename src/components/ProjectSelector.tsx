"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { useProjectContext } from "@/contexts/ProjectContext";
import { cn } from "@/lib/utils";

export default function ProjectSelector() {
  const { projects, selectedProject, setSelectedProject, isLoading } =
    useProjectContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="h-9 w-44 bg-gray-100 rounded-lg animate-pulse" />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <FolderOpen className="w-4 h-4" />
        No projects
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-w-[180px]"
      >
        <FolderOpen className="w-4 h-4 text-brand" />
        <span className="text-sm font-medium text-gray-700 truncate flex-1 text-left">
          {selectedProject?.name || "Select Project"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project._id}
              onClick={() => {
                setSelectedProject(project);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2",
                selectedProject?._id === project._id &&
                  "bg-brand/5 text-brand font-medium"
              )}
            >
              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{project.name}</span>
              {selectedProject?._id === project._id && (
                <span className="ml-auto text-brand text-xs">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
