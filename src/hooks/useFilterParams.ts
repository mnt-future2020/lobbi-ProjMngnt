"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

export function useFilterParams(defaults: Record<string, string> = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const get = useCallback(
    (key: string): string => {
      return searchParams?.get(key) || defaults[key] || "";
    },
    [searchParams, defaults]
  );

  const getAll = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams?.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  const set = useCallback(
    (updates: Record<string, string>, resetPage = true) => {
      const current = new URLSearchParams(searchParams?.toString() || "");
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      }
      if (resetPage && !("page" in updates)) {
        current.delete("page");
      }
      const query = current.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, router, pathname]
  );

  const setDebounced = useCallback(
    (updates: Record<string, string>, ms = 300) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => set(updates), ms);
    },
    [set]
  );

  const clear = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { get, getAll, set, setDebounced, clear };
}
