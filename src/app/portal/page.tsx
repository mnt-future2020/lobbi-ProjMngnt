"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, useTaskStats } from "@/hooks/useTasks";
import { cn, formatDate } from "@/lib/utils";
import { ITask, IAttachment } from "@/types";

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

export default function PortalPage() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [attachmentModal, setAttachmentModal] = useState<ITask | null>(null);
  const [lightboxImage, setLightboxImage] = useState<IAttachment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [newTaskFiles, setNewTaskFiles] = useState<File[]>([]);

  // Build params for SWR
  const params: Record<string, string> = {
    page: String(page),
    limit: "10",
    sortBy: "date",
    sortOrder: "desc",
  };
  if (user?._id && !user?.isAdmin) params.assignee = user._id;
  if (search) params.search = search;
  if (filter) params.status = filter;
  if (filterDate) { params.dateFrom = filterDate; params.dateTo = filterDate; }

  const { tasks, total, totalPages, isLoading, mutate } = useTasks(params);

  // Stats from filtered tasks count (fetch all statuses separately would be overkill, use simple client count)
  // But we need total counts, so fetch stats for this assignee
  const myTotal = total;
  const myCompleted = tasks.filter((t) => t.status === "Completed").length;
  const myInProgress = tasks.filter((t) => t.status === "In Progress").length;
  const myPending = tasks.filter((t) => t.status === "Pending").length;

  const statCards = [
    { label: "My Tasks", value: myTotal, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Completed", value: myCompleted, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { label: "In Progress", value: myInProgress, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Pending", value: myPending, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  const uploadFiles = async (files: File[]): Promise<IAttachment[]> => {
    const uploaded: IAttachment[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
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

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: newTask.title,
        description: newTask.description,
        priority: "Medium",
        status: "Pending",
        assignee: user?._id,
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
      if (!res.ok) throw new Error();
      toast.success("Task created successfully");
      setShowCreateModal(false);
      setNewTask({ title: "", description: "" });
      setNewTaskFiles([]);
      mutate();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("");
    setFilterDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Welcome + Create Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-sm text-gray-500 mt-1">Here are your assigned tasks</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Task
        </button>
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

      {/* Search, Filters & Date - Always visible */}
      <div className="card p-4 lg:p-5 space-y-3 lg:space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {(search || filter || filterDate) && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Tabs */}
          {[
            { label: "All", value: "" },
            { label: "Pending", value: "Pending" },
            { label: "In Progress", value: "In Progress" },
            { label: "Completed", value: "Completed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === tab.value
                  ? "bg-brand text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}

          <div className="ml-auto">
            <input
              type="date"
              className="input-field w-auto text-sm"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
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
            {search || filter || filterDate ? "No tasks found for this filter" : "No tasks assigned to you yet"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Attachments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(task.date)}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[task.status])}>{task.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", priorityColors[task.priority])}>{task.priority}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(task.dueDate)}</td>
                  <td className="px-5 py-3">
                    {task.attachments && task.attachments.length > 0 ? (
                      <div>
                        <button onClick={() => setAttachmentModal(task)} className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-medium">
                          <Paperclip className="w-3 h-3" />
                          {task.attachments.length} image{task.attachments.length > 1 ? "s" : ""}
                        </button>
                        <div className="flex gap-1 mt-1">
                          {task.attachments.slice(0, 3).map((att, idx) => (
                            <img key={idx} src={att.path} alt={att.filename} className="w-7 h-7 rounded border border-gray-200 object-cover cursor-pointer hover:ring-2 hover:ring-brand/30" onClick={() => setLightboxImage(att)} />
                          ))}
                          {task.attachments.length > 3 && (
                            <div className="w-7 h-7 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => setAttachmentModal(task)}>
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
            <p className="text-xs sm:text-sm text-gray-500">Page {page} of {totalPages} ({total})</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={cn("w-8 h-8 rounded-lg text-sm font-medium", page === pageNum ? "bg-brand text-white" : "hover:bg-gray-100 text-gray-600")}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                <input type="text" className="input-field" placeholder="What needs to be done?" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} autoFocus required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input-field min-h-[80px] resize-none" placeholder="Add details..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <p className="text-xs text-yellow-700">Status, priority & due date are managed by admin.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setNewTaskFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }} />
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload images</span>
                </label>
                {newTaskFiles.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {newTaskFiles.map((f, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden group/thumb">
                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setNewTaskFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setAttachmentModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Attachments</h3>
                <p className="text-sm text-gray-500 mt-0.5">{attachmentModal.title} - {attachmentModal.attachments?.length || 0} image{(attachmentModal.attachments?.length || 0) !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setAttachmentModal(null)} className="p-1.5 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {attachmentModal.attachments?.map((att, idx) => (
                  <div key={idx} className="relative group/img rounded-lg overflow-hidden border border-gray-200 cursor-pointer" onClick={() => setLightboxImage(att)}>
                    <img src={att.path} alt={att.filename} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-2 bg-white rounded-full text-gray-700"><Images className="w-4 h-4" /></div>
                    </div>
                    <div className="p-2 bg-white"><p className="text-xs text-gray-600 truncate">{att.filename}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4" onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X className="w-6 h-6" /></button>
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage.path} alt={lightboxImage.filename} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            <p className="text-white/70 text-sm mt-3">{lightboxImage.filename}</p>
          </div>
        </div>
      )}
    </div>
  );
}
