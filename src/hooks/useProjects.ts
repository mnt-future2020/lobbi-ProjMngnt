"use client";

import useSWR from "swr";
import { IProject } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects(status?: string, memberId?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (memberId) params.set("member", memberId);
  const url = `/api/projects?${params.toString()}`;
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
