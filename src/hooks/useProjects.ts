"use client";

import useSWR from "swr";
import { IProject } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects(status?: string) {
  const url = status
    ? `/api/projects?status=${status}`
    : "/api/projects";
  const { data, error, isLoading, mutate } = useSWR<IProject[]>(
    url,
    fetcher,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
    }
  );

  return {
    projects: data || [],
    isLoading,
    error,
    mutate,
  };
}
