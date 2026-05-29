"use client";

import { Suspense, useState } from "react";
import { Loader2, LogIn, LogOut, Search, CalendarDays } from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatDate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function AttendanceContent() {
  const { user, can } = useAuth();
  const [search, setSearch] = useState("");

  // Fetch attendance for this developer only (unless they can view all)
  const queryParam = user?._id && !user?.isAdmin ? `?developer=${user._id}` : "";
  const { data, isLoading } = useSWR(`/api/attendance${queryParam}`, fetcher);
  const logs = data?.data || data || [];

  const filtered = logs.filter((log: any) => {
    if (!search) return true;
    const dev = typeof log.developer === "object" ? log.developer : null;
    return dev?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.remark?.toLowerCase().includes(search.toLowerCase());
  });

  if (!can("attendance.view")) {
    return (
      <div className="card p-16 text-center">
        <p className="text-gray-400 text-sm">You don&apos;t have permission to view attendance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Your login/logout history</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
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
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No attendance records found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((log: any) => (
                <tr key={log._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {formatDate(log.timestamp || log.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      log.action === "login"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {log.action === "login" ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                      {log.action === "login" ? "Login" : "Logout"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {log.remark || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PortalAttendancePage() {
  return (
    <Suspense>
      <AttendanceContent />
    </Suspense>
  );
}
