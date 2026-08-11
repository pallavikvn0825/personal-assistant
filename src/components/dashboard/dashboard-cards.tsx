import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/input";
import { formatDuration, priorityLabel } from "@/lib/utils";
import { Star, Clock, Flame, Trophy, CheckCircle2 } from "lucide-react";
import type { TaskWithRelations } from "@/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MorningGreeting({ name }: { name: string }) {
  const now = new Date();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">
        {getGreeting()}, {name}! 👋
      </h1>
      <p className="text-muted-foreground mt-1">
        {format(now, "EEEE, MMMM d")}
      </p>
    </div>
  );
}

interface TodayOverviewProps {
  total: number;
  completed: number;
  remaining: number;
  overdue: number;
  completionPercentage: number;
}

export function TodayOverview({
  total,
  completed,
  remaining,
  overdue,
  completionPercentage,
}: TodayOverviewProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Tasks" value={total} />
          <Stat label="Completed" value={completed} color="text-success" />
          <Stat label="Remaining" value={remaining} />
          <Stat
            label="Overdue"
            value={overdue}
            color={overdue > 0 ? "text-destructive" : undefined}
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <ProgressBar
            value={completionPercentage}
            color={completionPercentage >= 80 ? "success" : "primary"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color ?? ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface TopPriorityProps {
  task: TaskWithRelations | null;
}

export function TopPriorityCard({ task }: TopPriorityProps) {
  if (!task) {
    return (
      <Card className="animate-fade-in border-dashed">
        <CardContent className="py-8 text-center">
          <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No priority task set. Mark a task as your top priority to focus.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-amber-500" />
          Today&apos;s Top Priority
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-semibold text-lg leading-snug">{task.title}</p>
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(task.estimatedMinutes)}
            </span>
          )}
          <Badge variant="outline">{priorityLabel(task.priority)} priority</Badge>
          {task.project && <Badge variant="secondary">{task.project.name}</Badge>}
        </div>
        <Link href="/today">
          <Button size="sm" className="mt-1">
            Start Task
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface WeeklyProgressProps {
  goals: { id: string; name: string; progress: number; projectName?: string }[];
}

export function WeeklyProgress({ goals }: WeeklyProgressProps) {
  if (goals.length === 0) return null;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium truncate pr-2">{goal.name}</span>
              <span className="text-muted-foreground shrink-0">{goal.progress}%</span>
            </div>
            <ProgressBar value={goal.progress} size="sm" />
            {goal.projectName && (
              <p className="text-xs text-muted-foreground mt-0.5">{goal.projectName}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface StreakCardProps {
  current: number;
  longest: number;
  tasksThisWeek: number;
}

export function StreakCard({ current, longest, tasksThisWeek }: StreakCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Productivity Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{current}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Current</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{longest}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Best</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold">{tasksThisWeek}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">This week</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HabitsSummaryProps {
  habits: {
    id: string;
    name: string;
    completedToday: boolean;
    currentStreak: number;
    icon: string | null;
  }[];
}

export function HabitsSummary({ habits }: HabitsSummaryProps) {
  if (habits.length === 0) return null;

  const completed = habits.filter((h) => h.completedToday).length;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Habits Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {completed}/{habits.length} completed
        </p>
        <div className="flex flex-wrap gap-2">
          {habits.map((habit) => (
            <span
              key={habit.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                habit.completedToday
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {habit.icon ?? "✓"} {habit.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
