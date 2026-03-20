"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const publicItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const adminItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/developers", label: "Developers", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuth();

  const navItems = isAuthenticated && isAdmin ? adminItems : publicItems;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar text-gray-300 flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <img src="/logo.png" alt="LOBBI" className="h-10 object-contain brightness-0 invert" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-sidebar-hover transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Login
          </Link>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand-light">
              A
            </div>
            <div>
              <p className="text-xs text-gray-400">Admin Panel</p>
              <p className="text-[11px] text-gray-600">v1.0.0</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
