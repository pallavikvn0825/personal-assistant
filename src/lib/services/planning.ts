import { startOfDay, endOfDay, isBefore, isToday } from "date-fns";
import { prisma } from "@/lib/db";
import type { WorkloadAnalysis, TaskWithRelations } from "@/types";
import { getTodayTasks, sortTasksForToday } from "./tasks";

export async function analyzeTodayWorkload(
  userId: string
): Promise<WorkloadAnalysis> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  const availableHours = user?.settings?.availableHours ?? 8;
  const availableMinutes = availableHours * 60;

  const tasks = await getTodayTasks(userId);
  const estimatedMinutes = tasks.reduce(
    (sum, t) => sum + (t.estimatedMinutes ?? 30),
    0
  );

  const isOverloaded = estimatedMinutes > availableMinutes;

  let suggestedToMove: TaskWithRelations[] = [];
  if (isOverloaded) {
    suggestedToMove = [...tasks]
      .filter((t) => t.priority === "LOW" || !t.isTopPriority)
      .sort((a, b) => {
        const pri = { HIGH: 2, MEDIUM: 1, LOW: 0 };
        return pri[a.priority] - pri[b.priority];
      })
      .slice(0, 3);
  }

  return {
    taskCount: tasks.length,
    estimatedMinutes,
    availableMinutes,
    isOverloaded,
    suggestedToMove,
  };
}

export async function getPrioritizedPlan(userId: string) {
  const tasks = await getTodayTasks(userId);
  const today = startOfDay(new Date());

  const sections = {
    overdue: tasks.filter((t) => t.dueDate && isBefore(t.dueDate, today)),
    dueToday: tasks.filter(
      (t) => t.dueDate && isToday(t.dueDate) && !(t.dueDate && isBefore(t.dueDate, today))
    ),
    highPriority: tasks.filter(
      (t) =>
        t.priority === "HIGH" &&
        !(t.dueDate && (isBefore(t.dueDate, today) || isToday(t.dueDate)))
    ),
    goalRelated: tasks.filter(
      (t) =>
        t.goalId &&
        t.priority !== "HIGH" &&
        !(t.dueDate && (isBefore(t.dueDate, today) || isToday(t.dueDate)))
    ),
    other: [] as TaskWithRelations[],
  };

  const categorized = new Set([
    ...sections.overdue,
    ...sections.dueToday,
    ...sections.highPriority,
    ...sections.goalRelated,
  ]);
  sections.other = tasks.filter((t) => !categorized.has(t));

  return sections;
}

export async function suggestTasksForTimeBudget(
  userId: string,
  availableMinutes: number
): Promise<TaskWithRelations[]> {
  const tasks = await getTodayTasks(userId);
  const sorted = sortTasksForToday(tasks);

  const selected: TaskWithRelations[] = [];
  let usedMinutes = 0;

  for (const task of sorted) {
    const taskMinutes = task.estimatedMinutes ?? 30;
    if (usedMinutes + taskMinutes <= availableMinutes) {
      selected.push(task);
      usedMinutes += taskMinutes;
    }
  }

  return selected;
}

export async function getIncompleteTasksForReview(userId: string) {
  const today = startOfDay(new Date());
  return prisma.task.findMany({
    where: {
      userId,
      parentId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      OR: [
        { dueDate: { lte: endOfDay(today) } },
        { dueDate: null },
      ],
    },
    include: {
      goal: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });
}

export async function getTodayCompletedCount(userId: string) {
  const today = startOfDay(new Date());
  return prisma.task.count({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { gte: today, lte: endOfDay(today) },
    },
  });
}
