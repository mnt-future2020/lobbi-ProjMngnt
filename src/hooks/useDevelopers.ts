"use client";

import useSWR from "swr";
import { IDeveloper, PaginatedResponse } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// For dropdowns - returns all developers (no pagination)
export function useDevelopers() {
  const { data, error, isLoading, mutate } = useSWR<IDeveloper[]>(
    "/api/developers",
    fetcher,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
    }
  );

  return {
    developers: data || [],
    isLoading,
    error,
    mutate,
  };
}

// For developer management page - with search, date filter, pagination
export function useDevelopersPaginated(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<IDeveloper>>(
    `/api/developers?${query}`,
    fetcher,
    {
      keepPreviousData: true,
      dedupingInterval: 3000,
      revalidateOnFocus: false,
    }
  );

  return {
    developers: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate,
  };
}
