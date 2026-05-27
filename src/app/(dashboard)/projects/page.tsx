"use client";

import { useState, Suspense } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  X,
  Loader2,
  FolderKanban,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useDevelopers } from "@/hooks/useDevelopers";
import { useProjectContext } from "@/contexts/ProjectContext";
import { cn, formatDate, apiError } from "@/lib/utils";
import { IProject, IDeveloper } from "@/types";

function ProjectsPageContent() {
  const { projects, isLoading, mutate } = useProjects();
  const { developers } = useDevelopers();
  const { mutateProjects } = useProjectContext();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<IProject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProject(null);
    setFormData({ name: "", description: "", members: [] });
    setShowModal(true);
  };

  const openEditModal = (project: IProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      members: (project.members as IDeveloper[]).map((m) =>
        typeof m === "object" ? m._id : m
      ),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingProject
        ? `/api/projects/${editingProject._id}`
        : "/api/projects";
      const method = editingProject ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to save project"));
      toast.success(editingProject ? "Project updated" : "Project created");
      setShowModal(false);
      mutate();
      mutateProjects();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (project: IProject) => {
    const newStatus = project.status === "active" ? "archived" : "active";
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to update project"));
      toast.success(
        newStatus === "archived" ? "Project archived" : "Project restored"
      );
      mutate();
      mutateProjects();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project");
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? All tasks in this project will lose their project association."))
      return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res, "Failed to delete project"));
      toast.success("Project deleted");
      mutate();
      mutateProjects();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project");
    }
  };

  const toggleMember = (devId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(devId)
        ? prev.members.filter((id) => id !== devId)
        : [...prev.members, devId],
    }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Projects
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Project Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search ? "No projects found" : "No projects yet"}
          </p>
          {!search && (
            <p className="text-sm text-gray-400 mt-1">
              Create your first project to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const members = (project.members || []) as IDeveloper[];
            return (
              <div
                key={project._id}
                className={cn(
                  "card p-5 hover:shadow-md transition-shadow group",
                  project.status === "archived" && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          project.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(project)}
                      className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleArchive(project)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                      title={
                        project.status === "active" ? "Archive" : "Restore"
                      }
                    >
                      {project.status === "active" ? (
                        <Archive className="w-4 h-4" />
                      ) : (
                        <ArchiveRestore className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteProject(project._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Members */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((m) => (
                      <div key={m._id} title={m.name}>
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-7 h-7 rounded-full border-2 border-white object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-brand/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-brand">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-500">
                          +{members.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Created {formatDate(project.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProject ? "Edit Project" : "Create Project"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Lobbi Management"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="What is this project about?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Members ({formData.members.length} selected)
                </label>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {developers.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">
                      No developers available
                    </p>
                  ) : (
                    developers.map((dev) => (
                      <label
                        key={dev._id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={formData.members.includes(dev._id)}
                          onChange={() => toggleMember(dev._id)}
                          className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {dev.avatar ? (
                            <img
                              src={dev.avatar}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-brand">
                                {dev.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {dev.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {dev.role}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProject ? "Update" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsPageContent />
    </Suspense>
  );
}
