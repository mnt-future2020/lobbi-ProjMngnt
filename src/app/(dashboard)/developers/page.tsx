"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  User,
  Mail,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useDevelopersPaginated } from "@/hooks/useDevelopers";
import { useFolders } from "@/hooks/useFolders";
import { useFilterParams } from "@/hooks/useFilterParams";
import { useProjectContext } from "@/contexts/ProjectContext";
import { cn, formatDate, apiError } from "@/lib/utils";
import { getFolderColorStyle, FOLDER_COLORS } from "@/lib/folderColors";
import { IDeveloper, IFolder, ITask, PaginatedResponse, STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/types";
import MultiDatePicker from "@/components/MultiDatePicker";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

const priorityColors: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600 border-gray-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  High: "bg-red-100 text-red-700 border-red-200",
};

const roles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "DevOps Engineer",
  "Project Manager",
  "QA Engineer",
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useDeveloperTasks(params: Record<string, string> | null) {
  const query = params ? new URLSearchParams(params).toString() : null;
  const { data, isLoading, mutate } = useSWR<PaginatedResponse<ITask>>(
    query !== null ? `/api/tasks?${query}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3000 }
  );
  return {
    tasks: data?.data || [],
    total: data?.total || 0,
    isLoading,
    mutate,
  };
}

function DevelopersPageContent() {
  const { selectedProject } = useProjectContext();
  const filtersHook = useFilterParams();

  const page = parseInt(filtersHook.get("page")) || 1;
  const search = filtersHook.get("search");
  const filterDates = filtersHook.get("dates");

  const [searchInput, setSearchInput] = useState(search);
  const setPage = (p: number) => filtersHook.set({ page: String(p) }, false);

  const listParams: Record<string, string> = { page: String(page), limit: "12" };
  if (search) listParams.search = search;
  if (filterDates) listParams.dates = filterDates;

  const { developers, total, totalPages, isLoading, mutate } = useDevelopersPaginated(listParams);

  // ── Drill-down state ──
  const [activeDeveloper, setActiveDeveloper] = useState<IDeveloper | null>(null);
  const [activeDeveloperFolder, setActiveDeveloperFolder] = useState<string | null>(null);

  // Folders for selected project
  const { folders: devFolders } = useFolders(selectedProject?._id);

  // Fetch all tasks for the active developer (for counting + display)
  const devTaskParams: Record<string, string> | null = activeDeveloper
    ? {
        assignee: activeDeveloper._id,
        limit: "500",
        sortBy: "date",
        sortOrder: "desc",
        ...(selectedProject?._id ? { project: selectedProject._id } : {}),
      }
    : null;
  const { tasks: allDevTasks, isLoading: devTasksLoading, mutate: mutateDevTasks } =
    useDeveloperTasks(devTaskParams);

  // Client-side filter for the active folder
  const activeFolderTasks = activeDeveloperFolder
    ? allDevTasks.filter((t) => {
        const tf = t.folder;
        if (!tf) return false;
        return typeof tf === "object"
          ? (tf as IFolder)._id === activeDeveloperFolder
          : tf === activeDeveloperFolder;
      })
    : [];

  const taskCountForFolder = (folderId: string) =>
    allDevTasks.filter((t) => {
      const tf = t.folder;
      if (!tf) return false;
      return typeof tf === "object"
        ? (tf as IFolder)._id === folderId
        : tf === folderId;
    }).length;

  // Inline update helpers
  const updateTask = async (taskId: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${field === "status" ? "Status" : "Priority"} updated`);
      mutateDevTasks();
    } catch {
      toast.error("Failed to update");
    }
  };

  // ── Developer modal state ──
  const [showModal, setShowModal] = useState(false);
  const [editingDev, setEditingDev] = useState<IDeveloper | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    status: "active",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingDev(null);
    setFormData({ name: "", email: "", password: "", role: "", phone: "", status: "active" });
    setAvatarFile(null);
    setAvatarPreview("");
    setShowModal(true);
  };

  const openEditModal = (dev: IDeveloper) => {
    setEditingDev(dev);
    setFormData({
      name: dev.name,
      email: dev.email,
      password: "",
      role: dev.role,
      phone: dev.phone || "",
      status: dev.status,
    });
    setAvatarFile(null);
    setAvatarPreview(dev.avatar || "");
    setShowModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!editingDev && !formData.password) {
      toast.error("Password is required for new developers");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("email", formData.email);
      fd.append("role", formData.role);
      fd.append("phone", formData.phone);
      fd.append("status", formData.status);
      if (formData.password) fd.append("password", formData.password);
      if (avatarFile) fd.append("avatar", avatarFile);

      const url = editingDev ? `/api/developers/${editingDev._id}` : "/api/developers";
      const method = editingDev ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success(editingDev ? "Developer updated" : "Developer added");
      setShowModal(false);
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save developer");
    } finally {
      setSaving(false);
    }
  };

  const deleteDev = async (id: string) => {
    if (!confirm("Delete this developer?")) return;
    try {
      const res = await fetch(`/api/developers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res, "Failed to delete developer"));
      toast.success("Developer deleted");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete developer");
    }
  };

  const hasFilters = search || filterDates;
  const clearFilters = () => {
    setSearchInput("");
    filtersHook.clear();
  };

  const folderName = devFolders.find((f) => f._id === activeDeveloperFolder)?.name || "Folder";

  return (
    <div className="space-y-5">

      {/* ── Task table view (developer + folder selected) ── */}
      {activeDeveloper && activeDeveloperFolder ? (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveDeveloperFolder(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-0.5">
                <span
                  className="cursor-pointer hover:text-brand"
                  onClick={() => { setActiveDeveloper(null); setActiveDeveloperFolder(null); }}
                >
                  Developers
                </span>
                <span>/</span>
                <span
                  className="cursor-pointer hover:text-brand"
                  onClick={() => setActiveDeveloperFolder(null)}
                >
                  {activeDeveloper.name}
                </span>
                <span>/</span>
                <span className="text-gray-700 font-medium">{folderName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-brand" />
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{folderName}</h1>
              </div>
              <p className="text-sm text-gray-400 mt-0.5 ml-7">
                {activeFolderTasks.length} task{activeFolderTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Task table */}
          {devTasksLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : activeFolderTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tasks in this folder</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date / Within</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeFolderTasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(task.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-0",
                              statusColors[task.status]
                            )}
                            value={task.status}
                            onChange={(e) => updateTask(task._id, "status", e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-0",
                              priorityColors[task.priority]
                            )}
                            value={task.priority}
                            onChange={(e) => updateTask(task._id, "priority", e.target.value)}
                          >
                            {PRIORITY_OPTIONS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          <div className="space-y-1">
                            <span>{formatDate(task.dueDate)}</span>
                            {task.hours && (
                              <span className="block">
                                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  Within {task.hours}h
                                </span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>

      ) : activeDeveloper ? (
        /* ── Folder list view (developer selected) ── */
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveDeveloper(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-0.5">
                <span
                  className="cursor-pointer hover:text-brand"
                  onClick={() => setActiveDeveloper(null)}
                >
                  Developers
                </span>
                <span>/</span>
                <span className="text-gray-700 font-medium">{activeDeveloper.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {activeDeveloper.avatar ? (
                  <img
                    src={activeDeveloper.avatar}
                    alt={activeDeveloper.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand">
                      {activeDeveloper.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                    {activeDeveloper.name}
                  </h1>
                  <p className="text-sm text-brand font-medium">{activeDeveloper.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task summary */}
          {!devTasksLoading && (
            <p className="text-sm text-gray-500">
              {allDevTasks.length} task{allDevTasks.length !== 1 ? "s" : ""}
              {selectedProject ? ` in ${selectedProject.name}` : ""}
            </p>
          )}

          {/* Folder cards */}
          {devTasksLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : devFolders.length === 0 ? (
            <div className="card p-12 text-center">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {selectedProject ? "No folders in this project" : "Select a project to view folders"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {devFolders.map((folder) => {
                const count = taskCountForFolder(folder._id);
                const cs = getFolderColorStyle(folder.color);
                return (
                  <div
                    key={folder._id}
                    onClick={() => setActiveDeveloperFolder(folder._id)}
                    className={cn(
                      "card p-5 cursor-pointer hover:shadow-md transition-all group relative border",
                      cs.card.bg,
                      cs.card.border
                    )}
                  >
                    {folder.color && (
                      <span className={cn(
                        "absolute top-3 left-3 w-2.5 h-2.5 rounded-full",
                        FOLDER_COLORS.find(c => c.value === folder.color)?.dot
                      )} />
                    )}
                    <FolderOpen className={cn("w-9 h-9 transition-colors mb-3 mt-1", cs.card.icon)} />
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{folder.name}</h3>
                    <p className="text-xs text-gray-400">{count} task{count !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>

      ) : (
        /* ── Developer list view (default) ── */
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Developer Management</h1>
              <p className="text-sm text-gray-500 mt-1">{total} team members</p>
            </div>
            <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Developer
            </button>
          </div>

          {/* Search & Filters */}
          <div className="card p-4 lg:p-5 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  className="input-field pl-9"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    filtersHook.setDebounced({ search: e.target.value });
                  }}
                />
              </div>
              <MultiDatePicker
                selectedDates={filterDates ? filterDates.split(",") : []}
                onChange={(dates) => filtersHook.set({ dates: dates.join(",") })}
              />
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Developer Cards Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : developers.length === 0 ? (
            <div className="card p-12 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {hasFilters ? "No developers found" : "No developers yet"}
              </p>
              {!hasFilters && (
                <p className="text-sm text-gray-400 mt-1">
                  Add your first team member to get started
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {developers.map((dev) => (
                <div
                  key={dev._id}
                  className="card p-5 hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => {
                    setActiveDeveloper(dev);
                    setActiveDeveloperFolder(null);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    {dev.avatar ? (
                      <img
                        src={dev.avatar}
                        alt={dev.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-brand">
                          {dev.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(dev); }}
                        className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDev(dev._id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900">{dev.name}</h3>
                  <p className="text-sm text-brand font-medium mt-0.5">{dev.role}</p>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{dev.email}</span>
                    </div>
                    {dev.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{dev.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        dev.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {dev.status === "active" ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(dev.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-500">
                Page {page} of {totalPages} ({total})
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium",
                        page === pageNum
                          ? "bg-brand text-white"
                          : "hover:bg-gray-100 text-gray-600"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Developer Modal — always rendered so state persists */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDev ? "Edit Developer" : "Add Developer"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center">
                <label className="cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingDev ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder={editingDev ? "Leave blank to keep current" : "Enter password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingDev}
                  minLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  className="select-field"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {editingDev && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="select-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

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
                  {editingDev ? "Update" : "Add Developer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <Suspense>
      <DevelopersPageContent />
    </Suspense>
  );
}
