"use client";

import { Suspense } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTaskStats } from "@/hooks/useTasks";
import { useFolders } from "@/hooks/useFolders";
import { cn } from "@/lib/utils";
import { getFolderColorStyle, FOLDER_COLORS } from "@/lib/folderColors";
import ProjectSelector from "@/components/ProjectSelector";
import { useProjectContext } from "@/contexts/ProjectContext";
import Link from "next/link";

function DashboardContent() {
  const { user, can } = useAuth();
  const { selectedProject } = useProjectContext();

  const { folders } = useFolders(selectedProject?._id);
  const assigneeId = user?._id && !user?.isAdmin && !can("tasks.view_all") ? user._id : undefined;
  const { stats, isLoading } = useTaskStats(assigneeId, selectedProject?._id);

  const statCards = [
    { label: "My Tasks", value: stats.total, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Pending", value: stats.pending, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s your overview</p>
        </div>
        <div className="flex items-center gap-3">
          {can("projects.switch") && <ProjectSelector />}
        </div>
      </div>

      {/* Stats */}
      {can("dashboard.view") && (
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
      )}

      {/* Quick access - Folders */}
      {can("tasks.view") && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Task Folders</h2>
            <Link href="/portal/tasks" className="text-sm text-brand hover:text-brand-dark font-medium">
              View all tasks →
            </Link>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : folders.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500 text-sm">
                {selectedProject ? "No folders in this project" : "Select a project to see your tasks"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {folders.map((folder) => {
                const cs = getFolderColorStyle(folder.color);
                return (
                  <Link
                    key={folder._id}
                    href={`/portal/tasks?folder=${folder._id}`}
                    className={cn(
                      "card p-5 hover:shadow-md transition-all group relative border",
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
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortalDashboard() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
