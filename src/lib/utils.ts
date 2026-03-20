import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function apiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || data?.message || fallback;
  } catch {
    return `${fallback} (${res.status} ${res.statusText})`;
  }
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message && err.message !== fallback) return err.message;
  return fallback;
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
