"use client";

import { User, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ProjectSelector from "@/components/ProjectSelector";

export default function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Spacer for mobile hamburger */}
        <div className="w-10 lg:hidden" />

        {/* Project Selector */}
        <ProjectSelector />

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Profile */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.isAdmin ? "Administrator" : user?.role}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
