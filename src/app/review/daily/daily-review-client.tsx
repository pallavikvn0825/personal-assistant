"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  rescheduleTaskAction,
  skipTaskAction,
  deleteTaskAction,
  saveDailyReviewAction,
} from "@/lib/actions";
import { ArrowRight, Calendar, SkipForward, Trash2, CheckCircle2 } from "lucide-react";
import type { TaskWithRelations } from "@/types";

interface DailyReviewClientProps {
  completed: number;
  incomplete: TaskWithRelations[];
}

export function DailyReviewClient({ completed, incomplete }: DailyReviewClientProps) {
  const [isPending, startTransition] = useTransition();
  const [processed, setProcessed] = useState<Set<string>>(new Set());

  function handleAction(taskId: string, action: "tomorrow" | "later_week" | "skip" | "delete") {
    startTransition(async () => {
      if (action === "skip") {
        await skipTaskAction(taskId);
      } else if (action === "delete") {
        await deleteTaskAction(taskId);
      } else {
        await rescheduleTaskAction(taskId, action);
      }
      setProcessed((prev) => new Set([...prev, taskId]));
    });
  }

  function handleFinish() {
    startTransition(async () => {
      await saveDailyReviewAction({
        tasksMoved: 0,
        tasksSkipped: 0,
        tasksDeleted: 0,
      });
    });
  }

  const remaining = incomplete.filter((t) => !processed.has(t.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">End of Day Review</h1>
        <p className="text-muted-foreground mt-1">How did today go?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-3xl font-bold">{completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{remaining.length}</p>
            <p className="text-sm text-muted-foreground">Incomplete</p>
          </CardContent>
        </Card>
      </div>

      {remaining.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What should happen with unfinished tasks?
          </h2>
          {remaining.map((task) => (
            <Card key={task.id} className={isPending ? "opacity-70" : ""}>
              <CardContent className="py-4">
                <p className="font-medium mb-3">{task.title}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(task.id, "tomorrow")}
                    disabled={isPending}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Tomorrow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(task.id, "later_week")}
                    disabled={isPending}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Later this week
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(task.id, "skip")}
                    disabled={isPending}
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(task.id, "delete")}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
            <p className="font-medium">All tasks handled!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Great work today. See you tomorrow.
            </p>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleFinish} disabled={isPending} className="w-full">
        Finish Review
      </Button>
    </div>
  );
}
