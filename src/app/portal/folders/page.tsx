"use client";

import { Suspense } from "react";
import { Loader2, FolderOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFolders } from "@/hooks/useFolders";
import { cn } from "@/lib/utils";
import { getFolderColorStyle, FOLDER_COLORS } from "@/lib/folderColors";
import ProjectSelector from "@/components/ProjectSelector";
import { useProjectContext } from "@/contexts/ProjectContext";
import Link from "next/link";

function FoldersContent() {
  const { can } = useAuth();
  const { selectedProject } = useProjectContext();
  const { folders, isLoading } = useFolders(selectedProject?._id);

  if (!can("folders.view")) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400 text-sm">You don&apos;t have permission to view folders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Folders</h1>
          <p className="text-sm text-gray-500 mt-1">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
        </div>
        {can("projects.switch") && <ProjectSelector />}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : !selectedProject ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 text-sm">Select a project to see folders</p>
        </div>
      ) : folders.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No folders in this project</p>
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
  );
}

export default function PortalFoldersPage() {
  return (
    <Suspense>
      <FoldersContent />
    </Suspense>
  );
}
