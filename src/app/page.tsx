"use client";

import { useState, useEffect, Suspense } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Paperclip,
  X,
  Images,
  Folder,
  FolderOpen,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { useTaskStats, useTasks } from "@/hooks/useTasks";
import { useFolders } from "@/hooks/useFolders";
import { useDevelopers } from "@/hooks/useDevelopers";
import { useAuth } from "@/hooks/useAuth";
import { useFilterParams } from "@/hooks/useFilterParams";
import { cn, formatDate } from "@/lib/utils";
import { getFolderColorStyle, FOLDER_COLORS } from "@/lib/folderColors";
import { ITask, IFolder, IAttachment, STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import MultiDatePicker from "@/components/MultiDatePicker";
import MultiSelect from "@/components/MultiSelect";
import ProjectSelector from "@/components/ProjectSelector";
import { useProjectContext } from "@/contexts/ProjectContext";

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

function HomePageContent() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { selectedProject } = useProjectContext();
  const { stats, isLoading: statsLoading } = useTaskStats(undefined, selectedProject?._id);
  const { developers: allDevelopers } = useDevelopers();

  const projectMembers = selectedProject?.members;
  const developers = projectMembers && projectMembers.length > 0
    ? (projectMembers as import("@/types").IDeveloper[])
    : allDevelopers;

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
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [attachmentModal, setAttachmentModal] = useState<ITask | null>(null);
  const [lightboxImage, setLightboxImage] = useState<IAttachment | null>(null);

  const setPage = (p: number) => filters.set({ page: String(p) }, false);

  // Folders for the selected project
  const { folders, isLoading: foldersLoading } = useFolders(selectedProject?._id);

  // Reset folder when project changes
  useEffect(() => {
    setActiveFolder(null);
    setSearchInput("");
    filters.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?._id]);

  // Folder list view: fetch all tasks to count per folder
  // Task view: fetch paginated tasks for that folder
  const params: Record<string, string> = { sortBy, sortOrder };
  if (selectedProject) params.project = selectedProject._id;

  if (activeFolder) {
    params.page = String(page);
    params.limit = "15";
    params.folder = activeFolder;
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterPriority) params.priority = filterPriority;
    if (filterAssignee) params.assignee = filterAssignee;
    if (filterDates) params.dates = filterDates;
  } else {
    params.limit = "500";
  }

  const { tasks, total, totalPages, isLoading } = useTasks(params);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      filters.set({ sortOrder: sortOrder === "asc" ? "desc" : "asc" }, false);
    } else {
      filters.set({ sortBy: field, sortOrder: "asc" }, false);
    }
  };

  const hasFilters = filterStatus || filterPriority || filterAssignee || filterDates || search;

  const clearFilters = () => {
    setSearchInput("");
    filters.clear();
  };

  // Count tasks per folder (client-side from the 500-task fetch)
  const taskCountForFolder = (folderId: string) =>
    tasks.filter((t) => {
      const tf = t.folder;
      if (!tf) return false;
      return typeof tf === "object"
        ? (tf as IFolder)._id === folderId
        : tf === folderId;
    }).length;

  const activeFolderName = folders.find((f) => f._id === activeFolder)?.name || "Folder";

  const isAdminView = isAuthenticated && isAdmin;

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: ClipboardList, color: "bg-blue-500", lightColor: "bg-blue-50" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "bg-green-500", lightColor: "bg-green-50" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "bg-indigo-500", lightColor: "bg-indigo-50" },
    { label: "Pending", value: stats.pending, icon: AlertTriangle, color: "bg-yellow-500", lightColor: "bg-yellow-50" },
  ];

  const content = (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="card p-3 lg:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                )}
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", card.lightColor)}>
                <card.icon className={cn("w-6 h-6", card.color.replace("bg-", "text-"))} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Folder list view ── */}
      {!activeFolder ? (
        foldersLoading || isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : folders.length === 0 ? (
          <div className="card p-12 text-center">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {selectedProject ? "No folders in this project" : "Select a project to view tasks"}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveFolder(null); clearFilters(); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-gray-900">{activeFolderName}</h2>
            </div>
            <span className="text-sm text-gray-400">{total} task{total !== 1 ? "s" : ""}</span>
          </div>

          {/* Search & Filters */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="input-field pl-9"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); filters.setDebounced({ search: e.target.value }); }}
                />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700">
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

          {/* Tasks Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Tasks</h2>
              <span className="text-xs text-gray-500">{total} tasks</span>
            </div>

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
                      { key: "dueDate", label: "Due Date / Within" },
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500 text-sm">
                        {hasFilters ? "No tasks found for this filter" : "No tasks in this folder"}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task: ITask) => (
                      <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(task.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {typeof task.assignee === "object" && task.assignee ? (
                            <div className="flex items-center gap-2">
                              {task.assignee.avatar ? (
                                <img src={task.assignee.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">
                                  <span className="text-[10px] font-semibold text-brand">
                                    {task.assignee.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-700">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", statusColors[task.status])}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", priorityColors[task.priority])}>
                            {task.priority}
                          </span>
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
                        <td className="px-4 py-3">
                          {task.attachments && task.attachments.length > 0 ? (
                            <div>
                              <button
                                onClick={() => setAttachmentModal(task)}
                                className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium"
                              >
                                <Paperclip className="w-3 h-3" />
                                {task.attachments.length} file{task.attachments.length > 1 ? "s" : ""}
                              </button>
                              <div className="flex gap-1 mt-1">
                                {task.attachments.slice(0, 3).map((att, idx) => {
                                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.filename);
                                  return isImage ? (
                                    <img
                                      key={idx}
                                      src={att.path}
                                      alt={att.filename}
                                      className="w-6 h-6 rounded border border-gray-200 object-cover cursor-pointer hover:ring-2 hover:ring-brand/30"
                                      onClick={() => setAttachmentModal(task)}
                                    />
                                  ) : (
                                    <div
                                      key={idx}
                                      className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-brand/30"
                                      onClick={() => setAttachmentModal(task)}
                                      title={att.filename}
                                    >
                                      <FileSpreadsheet className="w-3 h-3 text-gray-400" />
                                    </div>
                                  );
                                })}
                                {task.attachments.length > 3 && (
                                  <div
                                    className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-[9px] text-gray-500 cursor-pointer"
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
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium",
                          page === pageNum ? "bg-brand text-white" : "hover:bg-gray-100 text-gray-600"
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
                  {attachmentModal.title} - {attachmentModal.attachments?.length || 0} file
                  {(attachmentModal.attachments?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setAttachmentModal(null)} className="p-1.5 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {attachmentModal.attachments?.map((att, idx) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.filename);
                  return (
                  <div
                    key={idx}
                    className="relative group/img rounded-lg overflow-hidden border border-gray-200"
                  >
                    {isImage ? (
                      <img
                        src={att.path}
                        alt={att.filename}
                        className="w-full h-40 object-cover cursor-pointer"
                        onClick={() => setLightboxImage(att)}
                      />
                    ) : (
                      <a
                        href={`/api/download?url=${encodeURIComponent(att.path)}&filename=${encodeURIComponent(att.filename)}`}
                        className="w-full h-40 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100"
                      >
                        <FileSpreadsheet className="w-10 h-10 text-gray-300" />
                        <span className="text-[10px] text-gray-400 uppercase font-bold">
                          {att.filename.split(".").pop()}
                        </span>
                      </a>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {isImage ? (
                        <button
                          onClick={() => setLightboxImage(att)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        >
                          <Images className="w-4 h-4" />
                        </button>
                      ) : (
                        <a
                          href={`/api/download?url=${encodeURIComponent(att.path)}&filename=${encodeURIComponent(att.filename)}`}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="p-2 bg-white flex items-center gap-1.5">
                      <p className="text-xs text-gray-600 truncate flex-1">{att.filename}</p>
                      <a
                        href={`/api/download?url=${encodeURIComponent(att.path)}&filename=${encodeURIComponent(att.filename)}`}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand flex-shrink-0"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  );
                })}
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

  // Admin view: sidebar + topnav + content
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-64">
          <TopNav />
          <main className="p-4 lg:p-6">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Overview of all project tasks</p>
              </div>
            </div>
            {content}
          </main>
        </div>
      </div>
    );
  }

  // Public view: simple header + content
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <img src="/logo2.png" alt="LOBBI" className="h-8 sm:h-10 object-contain" />
          <ProjectSelector />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
        {content}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}
