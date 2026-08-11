import { getDefaultUser } from "@/lib/db";
import { getAnalyticsSummary } from "@/lib/services/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  BarChart3,
  CheckCircle2,
  SkipForward,
  AlertTriangle,
  Flame,
  Clock,
  Calendar,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default async function AnalyticsPage() {
  const user = await getDefaultUser();
  const analytics = await getAnalyticsSummary(user.id);

  const statCards = [
    {
      label: "Daily Completion",
      value: `${analytics.dailyCompletionRate}%`,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Weekly Completion",
      value: `${analytics.weeklyCompletionRate}%`,
      icon: BarChart3,
      color: "text-primary",
    },
    {
      label: "Monthly Completion",
      value: `${analytics.monthlyCompletionRate}%`,
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Tasks Completed",
      value: analytics.tasksCompleted.toString(),
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Tasks Skipped",
      value: analytics.tasksSkipped.toString(),
      icon: SkipForward,
      color: "text-muted-foreground",
    },
    {
      label: "Overdue",
      value: analytics.tasksOverdue.toString(),
      icon: AlertTriangle,
      color: analytics.tasksOverdue > 0 ? "text-destructive" : "text-muted-foreground",
    },
    {
      label: "Current Streak",
      value: `${analytics.currentStreak} days`,
      icon: Flame,
      color: "text-orange-500",
    },
    {
      label: "Longest Streak",
      value: `${analytics.longestStreak} days`,
      icon: Flame,
      color: "text-amber-500",
    },
    {
      label: "Avg. Task Duration",
      value: formatDuration(analytics.averageCompletionMinutes),
      icon: Clock,
      color: "text-muted-foreground",
    },
    {
      label: "Most Productive Day",
      value: analytics.mostProductiveDay,
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Most Productive Hour",
      value: `${analytics.mostProductiveHour}:00`,
      icon: Clock,
      color: "text-primary",
    },
    {
      label: "Habit Consistency",
      value: `${analytics.habitConsistency}%`,
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Your productivity insights at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="animate-fade-in">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analytics.goalProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.goalProgress.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-muted-foreground">{goal.progress}%</span>
                </div>
                <ProgressBar value={goal.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
