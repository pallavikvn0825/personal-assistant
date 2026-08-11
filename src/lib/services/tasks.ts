import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  isBefore,
  isToday,
  addDays,
  format,
} from "date-fns";
import { prisma } from "@/lib/db";
import type { CreateTaskInput, UpdateTaskInput, TaskWithRelations } from "@/types";
import type { Priority, TaskStatus } from "@prisma/client";
import { ensureRecurringInstances } from "./recurring";

const taskInclude = {
  goal: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  subtasks: {
    include: {
      goal: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  },
};

export async function getTasks(userId: string, filters?: {
  status?: TaskStatus[];
  priority?: Priority[];
  dueDate?: Date;
  projectId?: string;
  goalId?: string;
  category?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = { userId, parentId: null };

  if (filters?.status?.length) where.status = { in: filters.status };
  if (filters?.priority?.length) where.priority = { in: filters.priority };
  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.goalId) where.goalId = filters.goalId;
  if (filters?.category) where.category = filters.category;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters?.dueDate) {
    where.dueDate = {
      gte: startOfDay(filters.dueDate),
      lte: endOfDay(filters.dueDate),
    };
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  }) as Promise<TaskWithRelations[]>;
}

export async function getTodayTasks(userId: string) {
  const today = startOfDay(new Date());
  await ensureRecurringInstances(userId, today, addDays(today, 7));

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      parentId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      OR: [
        { dueDate: { lte: endOfDay(today) } },
        { dueDate: null, isTopPriority: true },
      ],
    },
    include: taskInclude,
  }) as TaskWithRelations[];

  return sortTasksForToday(tasks);
}

export async function getOverdueTasks(userId: string) {
  const today = startOfDay(new Date());
  return prisma.task.findMany({
    where: {
      userId,
      parentId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lt: today },
    },
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
  }) as Promise<TaskWithRelations[]>;
}

export function sortTasksForToday(tasks: TaskWithRelations[]): TaskWithRelations[] {
  const today = startOfDay(new Date());
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

  return [...tasks].sort((a, b) => {
    const aOverdue = a.dueDate && isBefore(a.dueDate, today) ? 0 : 1;
    const bOverdue = b.dueDate && isBefore(b.dueDate, today) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const aToday = a.dueDate && isToday(a.dueDate) ? 0 : 1;
    const bToday = b.dueDate && isToday(b.dueDate) ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;

    const aPri = priorityOrder[a.priority];
    const bPri = priorityOrder[b.priority];
    if (aPri !== bPri) return aPri - bPri;

    if (a.isTopPriority !== b.isTopPriority) return a.isTopPriority ? -1 : 1;

    if (a.goalId && !b.goalId) return -1;
    if (!a.goalId && b.goalId) return 1;

    return 0;
  });
}

export async function getTaskById(userId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, userId },
    include: taskInclude,
  }) as Promise<TaskWithRelations | null>;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  if (input.isTopPriority) {
    await prisma.task.updateMany({
      where: { userId, isTopPriority: true },
      data: { isTopPriority: false },
    });
  }

  const recurrenceDays = input.recurrenceDays
    ? JSON.stringify(input.recurrenceDays)
    : undefined;

  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      priority: input.priority ?? "MEDIUM",
      estimatedMinutes: input.estimatedMinutes,
      category: input.category,
      notes: input.notes,
      goalId: input.goalId,
      projectId: input.projectId,
      parentId: input.parentId,
      isTopPriority: input.isTopPriority ?? false,
      recurrenceType: input.recurrenceType ?? "NONE",
      recurrenceRule: input.recurrenceRule,
      recurrenceDays,
    },
    include: taskInclude,
  });

  if (input.recurrenceType && input.recurrenceType !== "NONE" && input.dueDate) {
    await ensureRecurringInstances(userId, input.dueDate, addDays(input.dueDate, 30));
  }

  return task as TaskWithRelations;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  if (input.isTopPriority) {
    await prisma.task.updateMany({
      where: { userId, isTopPriority: true, id: { not: taskId } },
      data: { isTopPriority: false },
    });
  }

  const data: Record<string, unknown> = { ...input };
  if (input.recurrenceDays) {
    data.recurrenceDays = JSON.stringify(input.recurrenceDays);
  }
  if (input.status === "COMPLETED") {
    data.completedAt = new Date();
  }

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  }) as Promise<TaskWithRelations>;
}

export async function completeTask(userId: string, taskId: string) {
  const task = await updateTask(userId, taskId, {
    status: "COMPLETED",
  });
  await updateStreakOnCompletion(userId);
  await updateGoalProgress(userId, task.goalId, task.projectId);
  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}

export async function rescheduleTask(
  userId: string,
  taskId: string,
  newDate: Date,
  action: "tomorrow" | "later_week" | "custom" = "custom"
) {
  let dueDate = newDate;
  if (action === "tomorrow") {
    dueDate = addDays(startOfDay(new Date()), 1);
  } else if (action === "later_week") {
    dueDate = addDays(startOfDay(new Date()), 3);
  }

  return updateTask(userId, taskId, {
    dueDate,
    status: "PENDING",
  });
}

async function updateStreakOnCompletion(userId: string) {
  const today = startOfDay(new Date());
  const streak = await prisma.productivityStreak.findUnique({ where: { userId } });

  if (!streak) {
    await prisma.productivityStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        tasksThisWeek: 1,
      },
    });
    return;
  }

  const lastActive = streak.lastActiveDate
    ? startOfDay(streak.lastActiveDate)
    : null;
  const yesterday = addDays(today, -1);

  let newStreak = streak.currentStreak;
  if (!lastActive || lastActive.getTime() === today.getTime()) {
    // Same day, no change to streak count
  } else if (lastActive.getTime() === yesterday.getTime()) {
    newStreak = streak.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const completedThisWeek = await prisma.task.count({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { gte: weekStart },
    },
  });

  await prisma.productivityStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActiveDate: today,
      tasksThisWeek: completedThisWeek,
    },
  });
}

async function updateGoalProgress(
  userId: string,
  goalId?: string | null,
  projectId?: string | null
) {
  if (projectId) {
    const projectTasks = await prisma.task.count({
      where: { projectId, userId, parentId: null },
    });
    const completedProjectTasks = await prisma.task.count({
      where: { projectId, userId, parentId: null, status: "COMPLETED" },
    });
    const progress =
      projectTasks > 0
        ? Math.round((completedProjectTasks / projectTasks) * 100)
        : 0;
    await prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });
  }

  if (goalId) {
    const goalTasks = await prisma.task.count({
      where: { goalId, userId, parentId: null },
    });
    const completedGoalTasks = await prisma.task.count({
      where: { goalId, userId, parentId: null, status: "COMPLETED" },
    });
    const progress =
      goalTasks > 0 ? Math.round((completedGoalTasks / goalTasks) * 100) : 0;
    await prisma.goal.update({
      where: { id: goalId },
      data: { progress },
    });
  }
}

export async function getDashboardTaskGroups(userId: string) {
  const today = startOfDay(new Date());
  const allTasks = await getTodayTasks(userId);

  const overdue = allTasks.filter(
    (t) => t.dueDate && isBefore(t.dueDate, today)
  );
  const highPriority = allTasks.filter(
    (t) => t.priority === "HIGH" && !overdue.includes(t)
  );
  const todayTasks = allTasks.filter(
    (t) =>
      (t.dueDate && isToday(t.dueDate) && !overdue.includes(t)) ||
      (!t.dueDate && t.priority !== "HIGH")
  );
  const optional = allTasks.filter(
    (t) => t.priority === "LOW" && !overdue.includes(t) && !highPriority.includes(t) && !todayTasks.includes(t)
  );

  const completedToday = await prisma.task.count({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { gte: today, lte: endOfDay(today) },
    },
  });

  const totalToday = allTasks.length + completedToday;
  const remainingToday = allTasks.length;

  return {
    overdue,
    highPriority,
    today: todayTasks,
    optional,
    stats: {
      totalToday,
      completedToday,
      remainingToday,
      overdueCount: overdue.length,
      completionPercentage:
        totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
    },
  };
}

export async function getTopPriorityTask(userId: string) {
  const top = await prisma.task.findFirst({
    where: {
      userId,
      isTopPriority: true,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: taskInclude,
  });
  if (top) return top as TaskWithRelations;

  const tasks = await getTodayTasks(userId);
  return tasks[0] ?? null;
}

export async function getWeeklyTasks(userId: string) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  return prisma.task.findMany({
    where: {
      userId,
      parentId: null,
      dueDate: { gte: weekStart, lte: weekEnd },
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
  }) as Promise<TaskWithRelations[]>;
}

export async function searchTasks(userId: string, query: string) {
  return getTasks(userId, { search: query });
}
