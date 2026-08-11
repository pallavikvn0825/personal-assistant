import { getDefaultUser } from "@/lib/db";
import { getDashboardTaskGroups, getTopPriorityTask } from "@/lib/services/tasks";
import { getWeeklyGoalProgress } from "@/lib/services/goals";
import { getHabitsWithStatus } from "@/lib/services/habits";
import { scheduleSystemReminders } from "@/lib/services/reminders";
import {
  MorningGreeting,
  TodayOverview,
  TopPriorityCard,
  WeeklyProgress,
  StreakCard,
  HabitsSummary,
} from "@/components/dashboard/dashboard-cards";
import { TaskGroup } from "@/components/tasks/task-item";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getDefaultUser();

  const [groups, topPriority, weeklyGoals, habits] = await Promise.all([
    getDashboardTaskGroups(user.id),
    getTopPriorityTask(user.id),
    getWeeklyGoalProgress(user.id),
    getHabitsWithStatus(user.id),
  ]);

  // Schedule reminders in background (non-blocking)
  scheduleSystemReminders(user.id).catch(() => {});

  const streak = user.productivityStreak ?? {
    currentStreak: 0,
    longestStreak: 0,
    tasksThisWeek: 0,
  };

  return (
    <div className="space-y-6">
      <MorningGreeting name={user.name} />

      {groups.stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm">
            You have <strong>{groups.stats.overdueCount}</strong> overdue task
            {groups.stats.overdueCount > 1 ? "s" : ""}.
          </p>
          <Link href="/today" className="ml-auto shrink-0">
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TodayOverview
          total={groups.stats.totalToday}
          completed={groups.stats.completedToday}
          remaining={groups.stats.remainingToday}
          overdue={groups.stats.overdueCount}
          completionPercentage={groups.stats.completionPercentage}
        />
        <StreakCard
          current={streak.currentStreak}
          longest={streak.longestStreak}
          tasksThisWeek={streak.tasksThisWeek}
        />
      </div>

      <TopPriorityCard task={topPriority} />

      <div className="grid gap-4 md:grid-cols-2">
        <WeeklyProgress goals={weeklyGoals} />
        <HabitsSummary habits={habits} />
      </div>

      <div className="space-y-6">
        <TaskGroup
          title="Overdue"
          tasks={groups.overdue}
          icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        />
        <TaskGroup title="High Priority" tasks={groups.highPriority} />
        <TaskGroup title="Today" tasks={groups.today} />
        <TaskGroup title="Optional" tasks={groups.optional} />
      </div>

      {groups.stats.totalToday === 0 && groups.stats.completedToday === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No tasks for today.{" "}
            <Link href="/tasks" className="text-primary hover:underline">
              Add a task
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}
    </div>
  );
}
