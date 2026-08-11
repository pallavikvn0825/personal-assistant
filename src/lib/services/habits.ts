import {
  startOfDay,
  startOfWeek,
  subDays,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import { prisma } from "@/lib/db";
import type { HabitWithCompletion } from "@/types";

export async function getHabitsWithStatus(
  userId: string,
  date: Date = new Date()
): Promise<HabitWithCompletion[]> {
  const today = startOfDay(date);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    include: {
      completions: {
        where: {
          date: { gte: subDays(today, 30) },
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return habits.map((habit) => {
    const completedToday = habit.completions.some((c) =>
      isSameDay(c.date, today)
    );

    const weekCompletions = habit.completions.filter(
      (c) => c.date >= weekStart
    ).length;

    const weeklyConsistency =
      habit.frequencyType === "daily"
        ? Math.round((weekCompletions / 7) * 100)
        : Math.round((weekCompletions / habit.targetCount) * 100);

    const currentStreak = calculateStreak(habit.completions.map((c) => c.date));

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      frequencyType: habit.frequencyType,
      targetCount: habit.targetCount,
      daysOfWeek: habit.daysOfWeek,
      currentStreak,
      weeklyConsistency: Math.min(weeklyConsistency, 100),
      completedToday,
      completionsThisWeek: weekCompletions,
    };
  });
}

function calculateStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0;

  const sorted = [...completionDates]
    .map((d) => startOfDay(d).getTime())
    .sort((a, b) => b - a);

  const uniqueDays = [...new Set(sorted)];
  let streak = 0;
  let expected = startOfDay(new Date()).getTime();

  for (const day of uniqueDays) {
    if (day === expected) {
      streak++;
      expected = subDays(new Date(expected), 1).getTime();
    } else if (day < expected) {
      break;
    }
  }

  return streak;
}

export async function completeHabit(
  userId: string,
  habitId: string,
  date: Date = new Date()
) {
  const today = startOfDay(date);
  return prisma.habitCompletion.upsert({
    where: {
      habitId_date: { habitId, date: today },
    },
    create: { userId, habitId, date: today, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export async function uncompleteHabit(userId: string, habitId: string) {
  const today = startOfDay(new Date());
  return prisma.habitCompletion.deleteMany({
    where: { habitId, date: today },
  });
}

export async function createHabit(
  userId: string,
  data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequencyType?: string;
    targetCount?: number;
    daysOfWeek?: number[];
    reminderTime?: string;
  }
) {
  return prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      frequencyType: data.frequencyType ?? "daily",
      targetCount: data.targetCount ?? 1,
      daysOfWeek: data.daysOfWeek ? JSON.stringify(data.daysOfWeek) : undefined,
      reminderTime: data.reminderTime,
    },
  });
}

export async function getHabitHistory(habitId: string, days = 30) {
  const start = subDays(startOfDay(new Date()), days);
  const completions = await prisma.habitCompletion.findMany({
    where: { habitId, date: { gte: start } },
    orderBy: { date: "asc" },
  });

  const interval = eachDayOfInterval({ start, end: new Date() });
  return interval.map((date) => ({
    date,
    completed: completions.some((c) => isSameDay(c.date, date)),
  }));
}
