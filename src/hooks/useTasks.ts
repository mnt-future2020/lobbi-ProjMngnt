"use client";

import useSWR from "swr";
import { ITask, PaginatedResponse, TaskStats } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTasks(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<ITask>>(
    `/api/tasks?${query}`,
    fetcher,
    {
      keepPreviousData: true,
      dedupingInterval: 3000,
      revalidateOnFocus: false,
    }
  );

  return {
    tasks: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate,
  };
}

export function useTaskStats(assignee?: string) {
  const url = assignee
    ? `/api/tasks/stats?assignee=${assignee}`
    : "/api/tasks/stats";
  const { data, error, isLoading, mutate } = useSWR<TaskStats>(
    url,
    fetcher,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data || { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 },
    isLoading,
    error,
    mutate,
  };
}
