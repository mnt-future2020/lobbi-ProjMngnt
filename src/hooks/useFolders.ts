"use client";

import useSWR from "swr";
import { IFolder } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFolders(projectId?: string) {
  const url = projectId ? `/api/folders?project=${projectId}` : null;
  const { data, error, isLoading, mutate } = useSWR<IFolder[]>(
    url,
    fetcher,
    { dedupingInterval: 5000, revalidateOnFocus: false }
  );

  return {
    folders: data || [],
    isLoading,
    error,
    mutate,
  };
}
