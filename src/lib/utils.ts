import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function priorityLabel(priority: string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "text-red-600 dark:text-red-400";
    case "MEDIUM":
      return "text-amber-600 dark:text-amber-400";
    case "LOW":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-muted-foreground";
  }
}

export function priorityBg(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
    case "MEDIUM":
      return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
    case "LOW":
      return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
    default:
      return "bg-card border-border";
  }
}
