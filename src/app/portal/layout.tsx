"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut,
  Loader2,
  User,
  X,
  Menu,
  LayoutDashboard,
  ClipboardList,
  Users,
  FolderKanban,
  FolderOpen,
  CalendarDays,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Portal from "@/components/Portal";

const REMARK_OPTIONS = [
  "Going to Lunch",
  "End of Day",
  "Team Meeting",
  "Short Break",
  "Other",
];

// Portal nav items gated by permissions
const allNavItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/portal/tasks", label: "Tasks", icon: ClipboardList, permission: "tasks.view" },
  { href: "/portal/users", label: "Users", icon: Users, permission: "users.view" },
  { href: "/portal/projects", label: "Projects", icon: FolderKanban, permission: "projects.view" },
  { href: "/portal/folders", label: "Folders", icon: FolderOpen, permission: "folders.view" },
  { href: "/portal/attendance", label: "Attendance", icon: CalendarDays, permission: "attendance.view" },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, can, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [remarkOption, setRemarkOption] = useState(REMARK_OPTIONS[0]);
  const [customRemark, setCustomRemark] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) return null;

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter((item) => can(item.permission));

  const openLogoutModal = () => {
    setRemarkOption(REMARK_OPTIONS[0]);
    setCustomRemark("");
    setShowLogoutModal(true);
  };

  const handleLogout = async () => {
    if (!user._id) return;
    setLoggingOut(true);
    try {
      const remark = remarkOption === "Other"
        ? customRemark.trim() || "Other"
        : remarkOption;

      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developer: user._id, action: "logout", remark }),
      });
    } catch {
      // don't block logout if attendance fails
    }
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-sidebar text-gray-300 flex flex-col z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + Close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <img src="/logo.png" alt="LOBBI" className="h-10 object-contain brightness-0 invert" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand text-white shadow-lg shadow-brand/25"
                    : "text-gray-400 hover:text-white hover:bg-sidebar-hover"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer - User info + Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand-light">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-gray-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={openLogoutModal}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-sidebar-hover transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Top Nav */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="w-10 lg:hidden" />
            <div className="ml-auto flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Logout remark modal */}
      {showLogoutModal && (
        <Portal><div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">Log Out</h2>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Select a reason before logging out:
            </p>

            <div className="mb-3">
              <select
                value={remarkOption}
                onChange={(e) => setRemarkOption(e.target.value)}
                className="input-field w-full"
              >
                {REMARK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {remarkOption === "Other" && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Type your reason..."
                  value={customRemark}
                  onChange={(e) => setCustomRemark(e.target.value)}
                  className="input-field w-full"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary flex-1"
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut || (remarkOption === "Other" && !customRemark.trim())}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loggingOut && <Loader2 className="w-4 h-4 animate-spin" />}
                Log Out
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
}
