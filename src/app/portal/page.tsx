"use client";

import { useState, useEffect, Suspense } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Paperclip,
  X,
  Images,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Search,
  Folder,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, useTaskStats } from "@/hooks/useTasks";
import { useFolders } from "@/hooks/useFolders";
import { useFilterParams } from "@/hooks/useFilterParams";
import { cn, formatDate, apiError } from "@/lib/utils";
import { getFolderColorStyle, FOLDER_COLORS } from "@/lib/folderColors";
import { ITask, IFolder, IAttachment } from "@/types";
import MultiDatePicker from "@/components/MultiDatePicker";
import ProjectSelector from "@/components/ProjectSelector";
import { useProjectContext } from "@/contexts/ProjectContext";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

const priorityColors: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-orange-100 text-orange-700",
  High: "bg-red-100 text-red-700",
};

function PortalPageContent() {
  const { user } = useAuth();
  const { selectedProject } = useProjectContext();
  const filters = useFilterParams();

  const page = parseInt(filters.get("page")) || 1;
  const search = filters.get("search");
  const filter = filters.get("status");
  const filterDates = filters.get("dates");

  const [searchInput, setSearchInput] = useState(search);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [attachmentModal, setAttachmentModal] = useState<ITask | null>(null);
  const [lightboxImage, setLightboxImage] = useState<IAttachment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [newTaskFiles, setNewTaskFiles] = useState<File[]>([]);

  const setPage = (p: number) => filters.set({ page: String(p) }, false);

  // Folders for selected project
  const { folders } = useFolders(selectedProject?._id);

  // Reset folder when project changes
  useEffect(() => {
    setActiveFolder(null);
    setSearchInput("");
    filters.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?._id]);

  // Build params — folder list needs all tasks for counting; task view is paginated
  const baseParams: Record<string, string> = { sortBy: "date", sortOrder: "desc" };
  if (selectedProject) baseParams.project = selectedProject._id;
  if (user?._id && !user?.isAdmin) baseParams.assignee = user._id;

  const params: Record<string, string> = { ...baseParams };
  if (activeFolder) {
    params.page = String(page);
    params.limit = "10";
    params.folder = activeFolder;
    if (search) params.search = search;
    if (filter) params.status = filter;
    if (filterDates) params.dates = filterDates;
  } else {
    params.limit = "500";
  }

  const { tasks, total, totalPages, isLoading, mutate } = useTasks(params);

  // Stats (scoped to this developer + project)
  const assigneeId = user?._id && !user?.isAdmin ? user._id : undefined;
  const { stats } = useTaskStats(assigneeId, selectedProject?._id);

  const statCards = [
    { label: "My Tasks", value: stats.total, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Pending", value: stats.pending, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  // Count tasks per folder (client-side, from the 500-task fetch in folder list view)
  const taskCountForFolder = (folderId: string) =>
    tasks.filter((t) => {
      const tf = t.folder;
      if (!tf) return false;
      return typeof tf === "object"
        ? (tf as IFolder)._id === folderId
        : tf === folderId;
    }).length;

  const uploadFiles = async (files: File[]): Promise<IAttachment[]> => {
    const uploaded: IAttachment[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await apiError(res, "Upload failed"));
      const { path, filename } = await res.json();
      uploaded.push({ filename, path, uploadedAt: new Date().toISOString() });
    }
    return uploaded;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error("Task name is required");
      return;
    }
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: newTask.title,
        description: newTask.description,
        priority: "Medium",
        status: "Pending",
        assignee: user?._id,
        project: selectedProject._id,
        folder: activeFolder || undefined,
        date: new Date().toISOString(),
      };
      if (newTaskFiles.length > 0) {
        body.attachments = await uploadFiles(newTaskFiles);
      }
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to create task"));
      toast.success("Task created successfully");
      setShowCreateModal(false);
      setNewTask({ title: "", description: "" });
      setNewTaskFiles([]);
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const hasFilters = search || filter || filterDates;
  const clearFilters = () => {
    setSearchInput("");
    filters.clear();
  };

  const activeFolderName = folders.find((f) => f._id === activeFolder)?.name || "Folder";

  return (
    <div className="space-y-6">
      {/* Welcome + Project Selector + Create Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeFolder ? (
              <span className="flex items-center gap-1">
                <span
                  className="cursor-pointer hover:text-brand"
                  onClick={() => { setActiveFolder(null); clearFilters(); }}
                >
                  My Tasks
                </span>
                <span>/</span>
                <span className="text-gray-700 font-medium">{activeFolderName}</span>
              </span>
            ) : (
              "Here are your assigned tasks"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSelector />
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bg)}>
                <card.icon className={cn("w-5 h-5", card.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Folder list view ── */}
      {!activeFolder ? (
        isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : folders.length === 0 ? (
          <div className="card p-12 text-center">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {selectedProject ? "No folders in this project" : "Select a project to see your tasks"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => {
              const count = taskCountForFolder(folder._id);
              const cs = getFolderColorStyle(folder.color);
              return (
                <div
                  key={folder._id}
                  onClick={() => { setActiveFolder(folder._id); filters.clear(); setSearchInput(""); }}
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
        )
      ) : (
        /* ── Task table view (inside a folder) ── */
        <>
          {/* Back + folder header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setActiveFolder(null); clearFilters(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-brand" />
                <h2 className="text-xl font-bold text-gray-900">{activeFolderName}</h2>
              </div>
              <p className="text-sm text-gray-400">{total} task{total !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="card p-4 lg:p-5 space-y-3 lg:space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="input-field pl-9"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    filters.setDebounced({ search: e.target.value });
                  }}
                />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: "All", value: "" },
                { label: "Pending", value: "Pending" },
                { label: "In Progress", value: "In Progress" },
                { label: "Completed", value: "Completed" },
              ].map((tab) => {
                const selected = filter ? filter.split(",") : [];
                const isAll = tab.value === "";
                const isActive = isAll ? selected.length === 0 : selected.includes(tab.value);
                return (
                  <button
                    key={tab.value}
                    onClick={() => {
                      if (isAll) {
                        filters.set({ status: "" });
                      } else {
                        const next = isActive
                          ? selected.filter((s) => s !== tab.value)
                          : [...selected, tab.value];
                        filters.set({ status: next.join(",") });
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <div className="ml-auto">
                <MultiDatePicker
                  selectedDates={filterDates ? filterDates.split(",") : []}
                  onChange={(dates) => filters.set({ dates: dates.join(",") })}
                />
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                {hasFilters ? "No tasks found for this filter" : "No tasks in this folder"}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date / Within</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Attachments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(task.date)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[task.status])}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", priorityColors[task.priority])}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
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
                      <td className="px-5 py-3">
                        {task.attachments && task.attachments.length > 0 ? (
                          <div>
                            <button
                              onClick={() => setAttachmentModal(task)}
                              className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-medium"
                            >
                              <Paperclip className="w-3 h-3" />
                              {task.attachments.length} image{task.attachments.length > 1 ? "s" : ""}
                            </button>
                            <div className="flex gap-1 mt-1">
                              {task.attachments.slice(0, 3).map((att, idx) => (
                                <img
                                  key={idx}
                                  src={att.path}
                                  alt={att.filename}
                                  className="w-7 h-7 rounded border border-gray-200 object-cover cursor-pointer hover:ring-2 hover:ring-brand/30"
                                  onClick={() => setLightboxImage(att)}
                                />
                              ))}
                              {task.attachments.length > 3 && (
                                <div
                                  className="w-7 h-7 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 cursor-pointer hover:bg-gray-100"
                                  onClick={() => setAttachmentModal(task)}
                                >
                                  +{task.attachments.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-wrap gap-2">
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
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
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
          </div>
        </>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Add details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              {activeFolder && (
                <div className="bg-brand/5 border border-brand/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-brand">
                    Task will be created in folder: <strong>{activeFolderName}</strong>
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <p className="text-xs text-yellow-700">Status, priority &amp; due date are managed by admin.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files)
                        setNewTaskFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }}
                  />
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload images</span>
                </label>
                {newTaskFiles.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {newTaskFiles.map((f, i) => (
                      <div
                        key={i}
                        className="relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden group/thumb"
                      >
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewTaskFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Modal */}
      {attachmentModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setAttachmentModal(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Attachments</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {attachmentModal.title} —{" "}
                  {attachmentModal.attachments?.length || 0} image
                  {(attachmentModal.attachments?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setAttachmentModal(null)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {attachmentModal.attachments?.map((att, idx) => (
                  <div
                    key={idx}
                    className="relative group/img rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                    onClick={() => setLightboxImage(att)}
                  >
                    <img
                      src={att.path}
                      alt={att.filename}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-2 bg-white rounded-full text-gray-700">
                        <Images className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate">{att.filename}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.path}
              alt={lightboxImage.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white/70 text-sm mt-3">{lightboxImage.filename}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense>
      <PortalPageContent />
    </Suspense>
  );
}
