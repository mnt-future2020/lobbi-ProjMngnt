"use client";

import { useState, Suspense } from "react";
import {
  Plus,
  Search,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Upload,
  Paperclip,
  Loader2,
  Images,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { useDevelopers } from "@/hooks/useDevelopers";
import { useFilterParams } from "@/hooks/useFilterParams";
import { cn, formatDate, apiError } from "@/lib/utils";
import { ITask, IAttachment, STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/types";
import MultiDatePicker from "@/components/MultiDatePicker";
import MultiSelect from "@/components/MultiSelect";

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

function TasksPageContent() {
  const filters = useFilterParams({ sortBy: "date", sortOrder: "desc" });

  const page = parseInt(filters.get("page")) || 1;
  const search = filters.get("search");
  const filterStatus = filters.get("status");
  const filterPriority = filters.get("priority");
  const filterAssignee = filters.get("assignee");
  const sortBy = filters.get("sortBy") || "date";
  const sortOrder = filters.get("sortOrder") || "desc";
  const filterDates = filters.get("dates");

  const [searchInput, setSearchInput] = useState(search);
  const setPage = (p: number) => filters.set({ page: String(p) }, false);

  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    status: "Pending",
    priority: "Medium",
    assignee: "",
    dueDate: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [newTaskFiles, setNewTaskFiles] = useState<File[]>([]);
  const [attachmentModal, setAttachmentModal] = useState<ITask | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ path: string; filename: string } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const params: Record<string, string> = {
    page: String(page),
    limit: "10",
    sortBy,
    sortOrder,
  };
  if (search) params.search = search;
  if (filterStatus) params.status = filterStatus;
  if (filterPriority) params.priority = filterPriority;
  if (filterAssignee) params.assignee = filterAssignee;
  if (filterDates) params.dates = filterDates;

  const { tasks, total, totalPages, isLoading, mutate } = useTasks(params);
  const { developers } = useDevelopers();

  const handleSort = (field: string) => {
    if (sortBy === field) {
      filters.set({ sortOrder: sortOrder === "asc" ? "desc" : "asc" }, false);
    } else {
      filters.set({ sortBy: field, sortOrder: "asc" }, false);
    }
  };

  const startEditing = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async (id: string, field: string, value: string) => {
    try {
      const body: Record<string, unknown> = { [field]: value || null };
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to update task"));
      toast.success("Task updated");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update task");
    }
    cancelEditing();
  };

  const handleInlineSelect = async (
    id: string,
    field: string,
    value: string
  ) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value || null }),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to update task"));
      toast.success("Task updated");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update task");
    }
  };

  // Upload multiple files to Cloudinary and return attachment objects
  const uploadFiles = async (files: File[]): Promise<IAttachment[]> => {
    const uploaded: IAttachment[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await apiError(res, "Upload failed"));
      const { path, filename } = await res.json();
      uploaded.push({
        filename,
        path,
        uploadedAt: new Date().toISOString(),
      });
    }
    return uploaded;
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Task name is required");
      return;
    }
    try {
      setUploading("new");
      const body: Record<string, unknown> = {
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        date: newTask.date,
      };
      if (newTask.assignee) body.assignee = newTask.assignee;
      if (newTask.dueDate) body.dueDate = newTask.dueDate;

      // Upload attachments if any
      if (newTaskFiles.length > 0) {
        body.attachments = await uploadFiles(newTaskFiles);
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to create task"));
      toast.success("Task created");
      setShowAddRow(false);
      setNewTask({
        title: "",
        status: "Pending",
        priority: "Medium",
        assignee: "",
        dueDate: "",
        date: new Date().toISOString().split("T")[0],
      });
      setNewTaskFiles([]);
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create task");
    } finally {
      setUploading(null);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await apiError(res, "Failed to delete task"));
      toast.success("Task deleted");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete task");
    }
  };

  // Upload multiple attachments to an existing task
  const handleAttachmentUpload = async (taskId: string, files: FileList) => {
    try {
      setUploading(taskId);
      const newAttachments = await uploadFiles(Array.from(files));

      const task = tasks.find((t) => t._id === taskId);
      const allAttachments = [...(task?.attachments || []), ...newAttachments];

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments: allAttachments }),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to upload"));
      toast.success(
        `${newAttachments.length} image${newAttachments.length > 1 ? "s" : ""} uploaded`
      );
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload attachments");
    } finally {
      setUploading(null);
    }
  };

  // Remove a single attachment from a task
  const removeAttachment = async (taskId: string, index: number) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const attachments = task.attachments.filter((_, i) => i !== index);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments }),
      });
      if (!res.ok) throw new Error(await apiError(res, "Failed to remove attachment"));
      toast.success("Attachment removed");
      setAttachmentModal((prev) =>
        prev && prev._id === taskId ? { ...prev, attachments } : prev
      );
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove attachment");
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file");
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await fetch("/api/tasks/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      if (data.errors?.length) {
        data.errors.forEach((e: string) => toast.warning(e));
      }
      setShowImportModal(false);
      setImportFile(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const hasFilters = filterStatus || filterPriority || filterAssignee || filterDates || search;

  const clearFilters = () => {
    setSearchInput("");
    filters.clear();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2 text-xs sm:text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowAddRow(true)}
            className="btn-primary flex items-center gap-2 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Search & Filters Bar - Always visible */}
      <div className="card p-4 lg:p-5 space-y-3 lg:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[150px]">
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
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear filters
            </button>
          )}
        </div>

          <div className="flex items-center gap-3 flex-wrap">
            <MultiSelect
              placeholder="All Status"
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              selected={filterStatus ? filterStatus.split(",") : []}
              onChange={(v) => filters.set({ status: v.join(",") })}
            />
            <MultiSelect
              placeholder="All Priority"
              options={PRIORITY_OPTIONS.map((p) => ({ value: p, label: p }))}
              selected={filterPriority ? filterPriority.split(",") : []}
              onChange={(v) => filters.set({ priority: v.join(",") })}
            />
            <MultiSelect
              placeholder="All Developers"
              options={[
                { value: "unassigned", label: "Unassigned" },
                ...developers.map((d) => ({ value: d._id, label: d.name })),
              ]}
              selected={filterAssignee ? filterAssignee.split(",") : []}
              onChange={(v) => filters.set({ assignee: v.join(",") })}
            />

            <MultiDatePicker
              selectedDates={filterDates ? filterDates.split(",") : []}
              onChange={(dates) => filters.set({ dates: dates.join(",") })}
            />
          </div>
      </div>

      {/* Task Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  { key: "date", label: "Date" },
                  { key: "title", label: "Task Name" },
                  { key: "assignee", label: "Developer" },
                  { key: "status", label: "Status" },
                  { key: "priority", label: "Priority" },
                  { key: "dueDate", label: "Due Date" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Attachments
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Add New Task Row */}
              {showAddRow && (
                <tr className="bg-brand/5">
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="input-field text-xs"
                      value={newTask.date}
                      onChange={(e) =>
                        setNewTask({ ...newTask, date: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Task name..."
                      className="input-field text-sm"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="select-field text-sm"
                      value={newTask.assignee}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assignee: e.target.value })
                      }
                    >
                      <option value="">Select Developer</option>
                      {developers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="select-field text-sm"
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask({ ...newTask, status: e.target.value })
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="select-field text-sm"
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="input-field text-xs"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </td>
                  {/* Attachment in Add Row */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer p-1.5 text-gray-400 hover:text-brand hover:bg-gray-100 rounded transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setNewTaskFiles((prev) => [
                                ...prev,
                                ...Array.from(e.target.files!),
                              ]);
                            }
                          }}
                        />
                        <Images className="w-4 h-4" />
                      </label>
                      {newTaskFiles.length > 0 && (
                        <span className="text-xs text-brand font-medium">
                          {newTaskFiles.length} file
                          {newTaskFiles.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Preview thumbnails */}
                    {newTaskFiles.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {newTaskFiles.map((f, i) => (
                          <div
                            key={i}
                            className="relative w-8 h-8 rounded border border-gray-200 overflow-hidden group/thumb"
                          >
                            <img
                              src={URL.createObjectURL(f)}
                              alt={f.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setNewTaskFiles((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                )
                              }
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={addTask}
                        disabled={uploading === "new"}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                      >
                        {uploading === "new" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddRow(false);
                          setNewTaskFiles([]);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Loading */}
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-500 text-sm"
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                tasks.map((task: ITask) => (
                  <tr
                    key={task._id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    {/* Date */}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {editingCell?.id === task._id &&
                      editingCell?.field === "date" ? (
                        <input
                          type="date"
                          className="input-field text-xs"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() =>
                            saveEdit(task._id, "date", editValue)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              saveEdit(task._id, "date", editValue);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-brand"
                          onClick={() =>
                            startEditing(
                              task._id,
                              "date",
                              task.date
                                ? new Date(task.date)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            )
                          }
                        >
                          {formatDate(task.date)}
                        </span>
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      {editingCell?.id === task._id &&
                      editingCell?.field === "title" ? (
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() =>
                            saveEdit(task._id, "title", editValue)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              saveEdit(task._id, "title", editValue);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-brand"
                          onClick={() =>
                            startEditing(task._id, "title", task.title)
                          }
                        >
                          {task.title}
                        </span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3">
                      <select
                        className="text-sm bg-transparent border-0 text-gray-600 cursor-pointer hover:text-brand focus:outline-none focus:ring-0 p-0"
                        value={
                          typeof task.assignee === "object" && task.assignee
                            ? task.assignee._id
                            : ""
                        }
                        onChange={(e) =>
                          handleInlineSelect(
                            task._id,
                            "assignee",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Unassigned</option>
                        {developers.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-0",
                          statusColors[task.status]
                        )}
                        value={task.status}
                        onChange={(e) =>
                          handleInlineSelect(
                            task._id,
                            "status",
                            e.target.value
                          )
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <select
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-0",
                          priorityColors[task.priority]
                        )}
                        value={task.priority}
                        onChange={(e) =>
                          handleInlineSelect(
                            task._id,
                            "priority",
                            e.target.value
                          )
                        }
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {editingCell?.id === task._id &&
                      editingCell?.field === "dueDate" ? (
                        <input
                          type="date"
                          className="input-field text-xs"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() =>
                            saveEdit(task._id, "dueDate", editValue)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              saveEdit(task._id, "dueDate", editValue);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-brand"
                          onClick={() =>
                            startEditing(
                              task._id,
                              "dueDate",
                              task.dueDate
                                ? new Date(task.dueDate)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            )
                          }
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </td>

                    {/* Attachments */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Upload button - multiple files */}
                        <label className="cursor-pointer p-1.5 text-gray-400 hover:text-brand hover:bg-gray-100 rounded transition-colors">
                          {uploading === task._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleAttachmentUpload(
                                      task._id,
                                      e.target.files
                                    );
                                  }
                                  e.target.value = "";
                                }}
                              />
                              <Upload className="w-3.5 h-3.5" />
                            </>
                          )}
                        </label>

                        {/* Show count + preview link */}
                        {task.attachments && task.attachments.length > 0 && (
                          <button
                            onClick={() => setAttachmentModal(task)}
                            className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium"
                          >
                            <Paperclip className="w-3 h-3" />
                            {task.attachments.length} image
                            {task.attachments.length > 1 ? "s" : ""}
                          </button>
                        )}
                      </div>

                      {/* Inline thumbnail strip */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {task.attachments.slice(0, 4).map((att, idx) => (
                            <img
                              key={idx}
                              src={att.path}
                              alt={att.filename}
                              className="w-7 h-7 rounded border border-gray-200 object-cover cursor-pointer hover:ring-2 hover:ring-brand/30"
                              onClick={() => setAttachmentModal(task)}
                            />
                          ))}
                          {task.attachments.length > 4 && (
                            <div
                              className="w-7 h-7 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 cursor-pointer hover:bg-gray-100"
                              onClick={() => setAttachmentModal(task)}
                            >
                              +{task.attachments.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
      </div>

      {/* Attachment Preview Modal */}
      {attachmentModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setAttachmentModal(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Attachments
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {attachmentModal.title} -{" "}
                  {attachmentModal.attachments?.length || 0} image
                  {(attachmentModal.attachments?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Upload more button */}
                <label className="btn-secondary flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleAttachmentUpload(
                          attachmentModal._id,
                          e.target.files
                        );
                        // Refresh modal data after upload
                        setTimeout(() => {
                          const updated = tasks.find(
                            (t) => t._id === attachmentModal._id
                          );
                          if (updated) setAttachmentModal(updated);
                        }, 2000);
                      }
                      e.target.value = "";
                    }}
                  />
                  <Upload className="w-4 h-4" />
                  Add More
                </label>
                <button
                  onClick={() => setAttachmentModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Image Grid */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {attachmentModal.attachments?.map((att, idx) => (
                  <div
                    key={idx}
                    className="relative group/img rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={att.path}
                      alt={att.filename}
                      className="w-full h-40 object-cover cursor-pointer"
                      onClick={() => setLightboxImage(att)}
                    />
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setLightboxImage(att)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="View full size"
                      >
                        <Images className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          removeAttachment(attachmentModal._id, idx)
                        }
                        className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Filename */}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate">
                        {att.filename}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox - Full Image Preview */}
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
            <p className="text-white/70 text-sm mt-3">
              {lightboxImage.filename}
            </p>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Import Tasks from Excel/CSV
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expected format */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Expected columns:
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                <span>Date</span>
                <span className="text-gray-400">e.g. 05-03-2026</span>
                <span>Task <span className="text-red-500">*</span></span>
                <span className="text-gray-400">Task name (required)</span>
                <span>Assigned Developer</span>
                <span className="text-gray-400">Developer name</span>
                <span>Status</span>
                <span className="text-gray-400">Completed / Pending / In Progress</span>
                <span>Priority</span>
                <span className="text-gray-400">Low / Medium / High</span>
                <span>Due Date</span>
                <span className="text-gray-400">e.g. 05-03-2026</span>
              </div>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-6 cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <FileSpreadsheet className="w-8 h-8 text-gray-400 mb-2" />
                {importFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {importFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Click to select .xlsx, .xls, or .csv file
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageContent />
    </Suspense>
  );
}
