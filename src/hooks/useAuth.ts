"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Not authenticated");
    return r.json();
  });

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    await mutate();
    return result;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await mutate(null, { revalidate: false });
    router.push("/login");
  };

  const permissions: string[] = data?.user?.permissions || [];

  const can = (perm: string) => {
    if (data?.user?.isAdmin) return true; // admin can do everything
    if (permissions.includes(perm)) return true;
    // "xxx.view_all" implies "xxx.view"
    if (perm.endsWith(".view")) {
      const viewAllKey = perm.replace(".view", ".view_all");
      if (permissions.includes(viewAllKey)) return true;
    }
    return false;
  };

  return {
    user: data?.user || null,
    isLoading,
    isAuthenticated: !!data?.user,
    isAdmin: data?.user?.isAdmin === true,
    permissions,
    can,
    login,
    logout,
    mutate,
  };
}
