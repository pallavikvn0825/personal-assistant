import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  getDay,
  getHours,
} from "date-fns";
import { prisma } from "@/lib/db";
import type { WeeklyGoalProgress, AnalyticsSummary } from "@/types";

export async function getWeeklyGoalProgress(
  userId: string
): Promise<WeeklyGoalProgress[]> {
  const goals = await prisma.goal.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const progress: WeeklyGoalProgress[] = [];

  for (const goal of goals) {
    if (goal.projects.length > 0) {
      for (const project of goal.projects) {
        progress.push({
          id: project.id,
          name: project.name,
          progress: project.progress,
          projectName: goal.name,
        });
      }
    } else {
      progress.push({
        id: goal.id,
        name: goal.name,
        progress: goal.progress,
      });
    }
  }

  return progress;
}

export async function getGoalsWithProjects(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    include: {
      projects: {
        include: {
          tasks: {
            where: { parentId: null },
            include: { subtasks: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      tasks: {
        where: { parentId: null, projectId: null },
        include: { subtasks: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAnalyticsSummary(
  userId: string
): Promise<AnalyticsSummary> {
  const now = new Date();
  const todayStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    completedToday,
    totalToday,
    completedWeek,
    totalWeek,
    completedMonth,
    totalMonth,
    skipped,
    overdue,
    streak,
    completedTasks,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: todayStart },
      },
    }),
    prisma.task.count({
      where: { userId, dueDate: { gte: todayStart } },
    }),
    prisma.task.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.task.count({
      where: {
        userId,
        dueDate: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.task.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.task.count({
      where: {
        userId,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.task.count({ where: { userId, status: "SKIPPED" } }),
    prisma.task.count({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
    }),
    prisma.productivityStreak.findUnique({ where: { userId } }),
    prisma.task.findMany({
      where: { userId, status: "COMPLETED", estimatedMinutes: { not: null } },
      select: { estimatedMinutes: true, completedAt: true },
    }),
  ]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayCounts: Record<number, number> = {};
  const hourCounts: Record<number, number> = {};

  for (const task of completedTasks) {
    if (task.completedAt) {
      const day = getDay(task.completedAt);
      const hour = getHours(task.completedAt);
      dayCounts[day] = (dayCounts[day] ?? 0) + 1;
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
  }

  const mostProductiveDayNum = Object.entries(dayCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];
  const mostProductiveHour = Object.entries(hourCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  const avgMinutes =
    completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0) /
            completedTasks.length
        )
      : 0;

  const goalProgress = await getWeeklyGoalProgress(userId);

  const habitCompletions = await prisma.habitCompletion.count({
    where: { userId, date: { gte: weekStart, lte: weekEnd } },
  });
  const activeHabits = await prisma.habit.count({
    where: { userId, isActive: true },
  });
  const habitConsistency =
    activeHabits > 0
      ? Math.round((habitCompletions / (activeHabits * 7)) * 100)
      : 0;

  return {
    dailyCompletionRate:
      totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
    weeklyCompletionRate:
      totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 0,
    monthlyCompletionRate:
      totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0,
    tasksCompleted: completedWeek,
    tasksSkipped: skipped,
    tasksOverdue: overdue,
    averageCompletionMinutes: avgMinutes,
    mostProductiveDay: mostProductiveDayNum
      ? dayNames[Number(mostProductiveDayNum)]
      : "N/A",
    mostProductiveHour: mostProductiveHour ? Number(mostProductiveHour) : 9,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    habitConsistency,
    goalProgress,
  };
}

export async function getWeeklyReviewData(userId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [completed, total, streak, completedGoals, pendingTasks] =
    await Promise.all([
      prisma.task.count({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          dueDate: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.productivityStreak.findUnique({ where: { userId } }),
      prisma.goal.findMany({
        where: { userId, status: "COMPLETED" },
        select: { name: true },
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueDate: { lte: weekEnd },
        },
        select: { title: true },
        take: 10,
      }),
    ]);

  const highPriorityPending = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      priority: "HIGH",
    },
    select: { title: true },
    take: 5,
    orderBy: { dueDate: "asc" },
  });

  return {
    weekStart,
    weekEnd,
    tasksCompleted: completed,
    tasksTotal: total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    completedGoals: completedGoals.map((g) => g.name),
    pendingItems: pendingTasks.map((t) => t.title),
    streakDays: streak?.currentStreak ?? 0,
    nextWeekPriorities: highPriorityPending.map((t) => t.title),
  };
}
