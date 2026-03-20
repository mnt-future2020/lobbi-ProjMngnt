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

  return {
    user: data?.user || null,
    isLoading,
    isAuthenticated: !!data?.user,
    isAdmin: data?.user?.isAdmin === true,
    login,
    logout,
    mutate,
  };
}
