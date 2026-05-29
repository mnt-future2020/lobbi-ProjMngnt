"use client";

import { Suspense } from "react";
import { Loader2, FolderKanban, Users, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { cn, formatDate } from "@/lib/utils";
import { IDeveloper } from "@/types";

function ProjectsContent() {
  const { can } = useAuth();
  const { projects, isLoading } = useProjects();
  const [search, setSearch] = useState("");

  const filtered = (projects || []).filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!can("projects.view")) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400 text-sm">You don&apos;t have permission to view projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          className="input-field pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const members = (project.members || []) as IDeveloper[];
            return (
              <div key={project._id} className={cn("card p-5 border-l-4", project.status === "archived" ? "border-l-gray-300 opacity-60" : "border-l-brand")}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.status === "archived" && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Archived</span>
                  )}
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                </div>
                {members.length > 0 && (
                  <div className="flex -space-x-2 mt-2">
                    {members.slice(0, 5).map((m) => (
                      <div
                        key={m._id}
                        className="w-7 h-7 rounded-full bg-brand/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-brand"
                        title={m.name}
                      >
                        {m.name?.charAt(0)?.toUpperCase()}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-500">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PortalProjectsPage() {
  return (
    <Suspense>
      <ProjectsContent />
    </Suspense>
  );
}
