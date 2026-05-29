"use client";

import { Suspense } from "react";
import { Loader2, User, Mail, Phone, Search } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/ProjectContext";
import { IDeveloper } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function UsersContent() {
  const { can } = useAuth();
  const { selectedProject } = useProjectContext();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR("/api/developers", fetcher);
  const developers: IDeveloper[] = data?.data || data || [];

  // Filter by project members if a project is selected
  const projectMembers = selectedProject?.members?.map((m: any) =>
    typeof m === "object" ? m._id : m
  ) || [];

  const filtered = developers.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchesProject = !selectedProject || projectMembers.includes(d._id);
    return matchesSearch && matchesProject;
  });

  if (!can("users.view")) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400 text-sm">You don&apos;t have permission to view users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
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
          <p className="text-gray-500 text-sm">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dev) => (
            <div key={dev._id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                {dev.avatar ? (
                  <img src={dev.avatar} alt={dev.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-brand" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{dev.name}</p>
                  <p className="text-xs text-gray-500">{dev.role}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{dev.email}</span>
                </div>
                {dev.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{dev.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortalUsersPage() {
  return (
    <Suspense>
      <UsersContent />
    </Suspense>
  );
}
