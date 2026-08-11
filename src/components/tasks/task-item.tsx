"use client";

import { format } from "date-fns";
import { cn, formatDuration, priorityLabel, priorityBg } from "@/lib/utils";
import { Badge } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Check,
  Clock,
  MoreHorizontal,
  Star,
  Calendar,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { completeTaskAction, deleteTaskAction, rescheduleTaskAction } from "@/lib/actions";
import { useState, useTransition } from "react";
import type { TaskWithRelations } from "@/types";

interface TaskItemProps {
  task: TaskWithRelations;
  showProject?: boolean;
  compact?: boolean;
}

export function TaskItem({ task, showProject = true, compact = false }: TaskItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      await completeTaskAction(task.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTaskAction(task.id);
    });
  }

  function handleReschedule(action: "tomorrow" | "later_week") {
    startTransition(async () => {
      await rescheduleTaskAction(task.id, action);
      setMenuOpen(false);
    });
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-sm animate-fade-in",
        priorityBg(task.priority),
        isPending && "opacity-60"
      )}
    >
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors"
        aria-label="Complete task"
      >
        <Check className="h-3 w-3 opacity-0 group-hover:opacity-50 text-primary" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("font-medium text-sm leading-snug", compact && "text-xs")}>
              {task.isTopPriority && (
                <Star className="inline h-3.5 w-3.5 text-amber-500 mr-1 -mt-0.5" />
              )}
              {task.title}
            </p>
            {!compact && task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {task.description}
              </p>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
              aria-label="Task options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-10 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted"
                  onClick={() => handleReschedule("tomorrow")}
                >
                  <ArrowRight className="h-3 w-3" /> Move to tomorrow
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted"
                  onClick={() => handleReschedule("later_week")}
                >
                  <Calendar className="h-3 w-3" /> Later this week
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-muted"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <Badge variant="outline">{priorityLabel(task.priority)}</Badge>
          {task.estimatedMinutes && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimatedMinutes)}
            </span>
          )}
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(task.dueDate), "MMM d")}
              {task.dueTime && ` · ${task.dueTime}`}
            </span>
          )}
          {showProject && task.project && (
            <Badge variant="secondary">{task.project.name}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: TaskWithRelations[];
  emptyMessage?: string;
  icon?: React.ReactNode;
}

export function TaskGroup({ title, tasks, emptyMessage, icon }: TaskGroupProps) {
  if (tasks.length === 0 && !emptyMessage) return null;

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
        <span className="ml-auto text-muted-foreground/60">{tasks.length}</span>
      </h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
