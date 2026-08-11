import { getDefaultUser } from "@/lib/db";
import { getGoalsWithProjects } from "@/lib/services/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/input";
import { Target, FolderOpen, CheckCircle2, Circle } from "lucide-react";
import { priorityLabel } from "@/lib/utils";

export default async function GoalsPage() {
  const user = await getDefaultUser();
  const goals = await getGoalsWithProjects(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <p className="text-muted-foreground mt-1">
          Track progress toward your long-term objectives
        </p>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No goals yet. Goals will appear here once created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="animate-fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {goal.name}
                    </CardTitle>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{priorityLabel(goal.priority)}</Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <ProgressBar value={goal.progress} />
                </div>
              </CardHeader>

              {goal.projects.length > 0 && (
                <CardContent className="space-y-4 pt-0">
                  {goal.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">{project.name}</h3>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                      <ProgressBar value={project.progress} size="sm" className="mb-3" />
                      <div className="space-y-1.5">
                        {project.tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            {task.status === "COMPLETED" ? (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span
                              className={
                                task.status === "COMPLETED"
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              {task.title}
                            </span>
                            {task.subtasks.length > 0 && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {task.subtasks.filter((s) => s.status === "COMPLETED").length}/
                                {task.subtasks.length} subtasks
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
