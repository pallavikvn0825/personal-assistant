import { getDefaultUser } from "@/lib/db";
import { analyzeTodayWorkload, getPrioritizedPlan } from "@/lib/services/planning";
import { formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskGroup } from "@/components/tasks/task-item";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default async function TodayPage() {
  const user = await getDefaultUser();
  const [workload, plan] = await Promise.all([
    analyzeTodayWorkload(user.id),
    getPrioritizedPlan(user.id),
  ]);

  const availableHours = user.settings?.availableHours ?? 8;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM d")} — What should you work on?
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Today&apos;s Workload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{workload.taskCount}</span>
              <span className="text-sm text-muted-foreground">tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{formatDuration(workload.estimatedMinutes)}</strong> estimated
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Available: <strong>{availableHours} hours</strong>
              </span>
            </div>
          </div>

          {workload.isOverloaded ? (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Your day looks overloaded.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You have {formatDuration(workload.estimatedMinutes)} of tasks but
                only {formatDuration(workload.availableMinutes)} available.
              </p>
              {workload.suggestedToMove.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Suggested tasks to move
                  </p>
                  <ul className="space-y-1">
                    {workload.suggestedToMove.map((task) => (
                      <li key={task.id} className="text-sm text-muted-foreground">
                        • {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm">You have enough time today.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <TaskGroup
          title="Overdue"
          tasks={plan.overdue}
          icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        />
        <TaskGroup title="Due Today" tasks={plan.dueToday} />
        <TaskGroup title="High Priority" tasks={plan.highPriority} />
        <TaskGroup title="Goal Related" tasks={plan.goalRelated} />
        <TaskGroup title="Other" tasks={plan.other} />
      </div>
    </div>
  );
}
