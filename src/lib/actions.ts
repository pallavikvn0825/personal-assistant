"use server";

import { revalidatePath } from "next/cache";
import { getDefaultUser } from "@/lib/db";
import {
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  rescheduleTask,
} from "@/lib/services/tasks";
import { completeHabit, uncompleteHabit, createHabit } from "@/lib/services/habits";
import { prisma } from "@/lib/db";
import type { CreateTaskInput, UpdateTaskInput } from "@/types";
import type { Priority, TaskStatus, RecurrenceType, Theme } from "@prisma/client";

async function getUser() {
  return getDefaultUser();
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/goals");
  revalidatePath("/habits");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/review/weekly");
  revalidatePath("/review/daily");
}

export async function createTaskAction(input: CreateTaskInput) {
  const user = await getUser();
  const task = await createTask(user.id, input);
  revalidateAll();
  return task;
}

export async function updateTaskAction(taskId: string, input: UpdateTaskInput) {
  const user = await getUser();
  const task = await updateTask(user.id, taskId, input);
  revalidateAll();
  return task;
}

export async function completeTaskAction(taskId: string) {
  const user = await getUser();
  const task = await completeTask(user.id, taskId);
  revalidateAll();
  return task;
}

export async function deleteTaskAction(taskId: string) {
  const user = await getUser();
  await deleteTask(user.id, taskId);
  revalidateAll();
}

export async function rescheduleTaskAction(
  taskId: string,
  action: "tomorrow" | "later_week" | "custom",
  customDate?: string
) {
  const user = await getUser();
  const date = customDate ? new Date(customDate) : new Date();
  await rescheduleTask(user.id, taskId, date, action);
  revalidateAll();
}

export async function skipTaskAction(taskId: string) {
  const user = await getUser();
  await updateTask(user.id, taskId, { status: "SKIPPED" as TaskStatus });
  revalidateAll();
}

export async function setTopPriorityAction(taskId: string) {
  const user = await getUser();
  await updateTask(user.id, taskId, { isTopPriority: true });
  revalidateAll();
}

export async function completeHabitAction(habitId: string) {
  const user = await getUser();
  await completeHabit(user.id, habitId);
  revalidateAll();
}

export async function uncompleteHabitAction(habitId: string) {
  const user = await getUser();
  await uncompleteHabit(user.id, habitId);
  revalidateAll();
}

export async function createHabitAction(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  const user = await getUser();
  await createHabit(user.id, data);
  revalidateAll();
}

export async function updateSettingsAction(data: {
  name?: string;
  timezone?: string;
  workStartHour?: number;
  workEndHour?: number;
  availableHours?: number;
  morningBriefingHour?: number;
  morningBriefingMinute?: number;
  endOfDayReviewHour?: number;
  endOfDayReviewMinute?: number;
  weeklyReviewDay?: number;
  weeklyReviewHour?: number;
  weeklyReviewMinute?: number;
  notificationsEnabled?: boolean;
  morningBriefingEnabled?: boolean;
  endOfDayReviewEnabled?: boolean;
  weeklyReviewEnabled?: boolean;
  taskRemindersEnabled?: boolean;
  overdueRemindersEnabled?: boolean;
  theme?: Theme;
}) {
  const user = await getUser();

  if (data.name || data.timezone) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.timezone && { timezone: data.timezone }),
      },
    });
  }

  const { name: _, timezone: __, ...settingsData } = data;
  if (Object.keys(settingsData).length > 0) {
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: settingsData,
    });
  }

  revalidatePath("/settings");
}

export async function saveDailyReviewAction(data: {
  tasksMoved: number;
  tasksSkipped: number;
  tasksDeleted: number;
  notes?: string;
  mood?: number;
}) {
  const user = await getUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completed = await prisma.task.count({
    where: {
      userId: user.id,
      status: "COMPLETED",
      completedAt: { gte: today },
    },
  });

  const incomplete = await prisma.task.count({
    where: {
      userId: user.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  await prisma.dailyReview.upsert({
    where: {
      userId_date: { userId: user.id, date: today },
    },
    create: {
      userId: user.id,
      date: today,
      tasksCompleted: completed,
      tasksIncomplete: incomplete,
      ...data,
      isComplete: true,
    },
    update: {
      tasksCompleted: completed,
      tasksIncomplete: incomplete,
      ...data,
      isComplete: true,
    },
  });

  revalidatePath("/review/daily");
}

export async function saveWeeklyReviewAction(data: {
  notes?: string;
  nextWeekPlan?: string[];
}) {
  const user = await getUser();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const [completed, total] = await Promise.all([
    prisma.task.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
        completedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.task.count({
      where: {
        userId: user.id,
        dueDate: { gte: weekStart, lte: weekEnd },
      },
    }),
  ]);

  await prisma.weeklyReview.upsert({
    where: {
      userId_weekStart: { userId: user.id, weekStart },
    },
    create: {
      userId: user.id,
      weekStart,
      weekEnd,
      tasksCompleted: completed,
      tasksTotal: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      notes: data.notes,
      nextWeekPlan: data.nextWeekPlan
        ? JSON.stringify(data.nextWeekPlan)
        : undefined,
      isComplete: true,
    },
    update: {
      tasksCompleted: completed,
      tasksTotal: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      notes: data.notes,
      nextWeekPlan: data.nextWeekPlan
        ? JSON.stringify(data.nextWeekPlan)
        : undefined,
      isComplete: true,
    },
  });

  revalidatePath("/review/weekly");
}

export async function parseNaturalLanguageAction(input: string) {
  const { createAIServices } = await import("@/lib/services/ai");
  const ai = createAIServices();
  return ai.parser.parse(input);
}
