import { getDefaultUser } from "@/lib/db";
import { getWeeklyReviewData } from "@/lib/services/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/input";
import { format } from "date-fns";
import { CheckCircle2, Circle, Flame, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function WeeklyReviewPage() {
  const user = await getDefaultUser();
  const review = await getWeeklyReviewData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly Review</h1>
        <p className="text-muted-foreground mt-1">
          {format(review.weekStart, "MMM d")} – {format(review.weekEnd, "MMM d, yyyy")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">
              {review.tasksCompleted}/{review.tasksTotal}
            </p>
            <p className="text-sm text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{review.completionRate}%</p>
            <p className="text-sm text-muted-foreground">Completion rate</p>
            <ProgressBar value={review.completionRate} className="mt-3" size="sm" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <p className="text-3xl font-bold">{review.streakDays}</p>
            </div>
            <p className="text-sm text-muted-foreground">Day streak</p>
          </CardContent>
        </Card>
      </div>

      {review.completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Completed Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {review.completedGoals.map((goal) => (
              <div key={goal} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                {goal}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {review.pendingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
              Still Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {review.pendingItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-4 w-4 shrink-0" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {review.nextWeekPriorities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Next Week&apos;s Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {review.nextWeekPriorities.map((priority, i) => (
                <li key={priority} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="shrink-0 mt-0.5">
                    {i + 1}
                  </Badge>
                  {priority}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href="/review/daily">
          <Button variant="outline">Daily Review</Button>
        </Link>
        <Link href="/today">
          <Button>Plan Tomorrow</Button>
        </Link>
      </div>
    </div>
  );
}
