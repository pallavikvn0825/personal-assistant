"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { completeHabitAction, uncompleteHabitAction } from "@/lib/actions";
import { Flame, Check } from "lucide-react";
import type { HabitWithCompletion } from "@/types";

interface HabitsClientProps {
  habits: HabitWithCompletion[];
}

export function HabitsClient({ habits }: HabitsClientProps) {
  const [isPending, startTransition] = useTransition();

  function toggleHabit(habit: HabitWithCompletion) {
    startTransition(async () => {
      if (habit.completedToday) {
        await uncompleteHabitAction(habit.id);
      } else {
        await completeHabitAction(habit.id);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
        <p className="text-muted-foreground mt-1">
          Build consistency with daily habits
        </p>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No habits yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {habits.map((habit) => (
            <Card
              key={habit.id}
              className={`transition-all ${isPending ? "opacity-70" : ""} ${
                habit.completedToday
                  ? "border-success/30 bg-success/5"
                  : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{habit.icon ?? "✓"}</span>
                    {habit.name}
                  </CardTitle>
                  <button
                    onClick={() => toggleHabit(habit)}
                    disabled={isPending}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      habit.completedToday
                        ? "border-success bg-success text-white"
                        : "border-muted-foreground/30 hover:border-primary"
                    }`}
                    aria-label={habit.completedToday ? "Mark incomplete" : "Mark complete"}
                  >
                    {habit.completedToday && <Check className="h-4 w-4" />}
                  </button>
                </div>
                {habit.description && (
                  <p className="text-xs text-muted-foreground">{habit.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    {habit.currentStreak} day streak
                  </span>
                  <span className="text-muted-foreground">
                    {habit.completionsThisWeek}/{habit.frequencyType === "daily" ? 7 : habit.targetCount} this week
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Weekly consistency</span>
                    <span>{habit.weeklyConsistency}%</span>
                  </div>
                  <ProgressBar
                    value={habit.weeklyConsistency}
                    size="sm"
                    color={habit.weeklyConsistency >= 70 ? "success" : "primary"}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
