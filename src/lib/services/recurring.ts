import {
  startOfDay,
  addDays,
  getDay,
  isSameDay,
  format,
} from "date-fns";
import { RRule } from "rrule";
import { prisma } from "@/lib/db";
import type { RecurrenceType } from "@prisma/client";

export function getRecurrenceDates(
  type: RecurrenceType,
  startDate: Date,
  endDate: Date,
  recurrenceDays?: number[],
  rruleString?: string
): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (type === "NONE") return dates;

  if (type === "CUSTOM" && rruleString) {
    try {
      const rule = RRule.fromString(rruleString);
      return rule.between(current, end, true).map((d) => startOfDay(d));
    } catch {
      return dates;
    }
  }

  while (current <= end) {
    const dayOfWeek = getDay(current);
    let include = false;

    switch (type) {
      case "DAILY":
        include = true;
        break;
      case "WEEKDAYS":
        include = dayOfWeek >= 1 && dayOfWeek <= 5;
        break;
      case "WEEKLY":
        include = dayOfWeek === getDay(startDate);
        break;
      case "CUSTOM":
        include = recurrenceDays?.includes(dayOfWeek) ?? false;
        break;
    }

    if (include && current >= startOfDay(startDate)) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return dates;
}

export async function ensureRecurringInstances(
  userId: string,
  fromDate: Date,
  toDate: Date
) {
  const recurringTasks = await prisma.task.findMany({
    where: {
      userId,
      recurrenceType: { not: "NONE" },
      parentId: null,
    },
  });

  for (const task of recurringTasks) {
    const recurrenceDays = task.recurrenceDays
      ? (JSON.parse(task.recurrenceDays) as number[])
      : undefined;

    const anchorDate = task.dueDate ?? task.createdAt;
    const dates = getRecurrenceDates(
      task.recurrenceType,
      anchorDate,
      toDate,
      recurrenceDays,
      task.recurrenceRule ?? undefined
    );

    for (const date of dates) {
      if (date < startOfDay(fromDate)) continue;

      await prisma.taskInstance.upsert({
        where: {
          taskId_scheduledDate: {
            taskId: task.id,
            scheduledDate: date,
          },
        },
        create: {
          userId,
          taskId: task.id,
          scheduledDate: date,
          dueTime: task.dueTime,
          status: "PENDING",
        },
        update: {},
      });
    }
  }
}

export async function getRecurringTasksForDate(userId: string, date: Date) {
  await ensureRecurringInstances(userId, date, addDays(date, 1));

  const instances = await prisma.taskInstance.findMany({
    where: {
      userId,
      scheduledDate: startOfDay(date),
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      task: {
        include: {
          goal: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  return instances;
}

export async function completeRecurringInstance(
  userId: string,
  instanceId: string
) {
  return prisma.taskInstance.update({
    where: { id: instanceId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export function describeRecurrence(
  type: RecurrenceType,
  dueTime?: string | null,
  recurrenceDays?: number[]
): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeStr = dueTime ? ` at ${dueTime}` : "";

  switch (type) {
    case "DAILY":
      return `Every day${timeStr}`;
    case "WEEKDAYS":
      return `Every weekday${timeStr}`;
    case "WEEKLY":
      return `Every week${timeStr}`;
    case "CUSTOM":
      if (recurrenceDays?.length) {
        const days = recurrenceDays.map((d) => dayNames[d]).join(", ");
        return `${days}${timeStr}`;
      }
      return `Custom schedule${timeStr}`;
    default:
      return "One-time";
  }
}

export function parseRecurrenceDays(json: string | null): number[] | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as number[];
  } catch {
    return undefined;
  }
}
