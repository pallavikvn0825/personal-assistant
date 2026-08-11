import {
  startOfDay,
  addDays,
  setHours,
  setMinutes,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { prisma } from "@/lib/db";
import type { NotificationType, ReminderConfig } from "@/types";

export async function getReminderConfig(userId: string): Promise<ReminderConfig> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  return {
    morningBriefing: {
      hour: settings?.morningBriefingHour ?? 9,
      minute: settings?.morningBriefingMinute ?? 0,
      enabled: settings?.morningBriefingEnabled ?? true,
    },
    endOfDayReview: {
      hour: settings?.endOfDayReviewHour ?? 20,
      minute: settings?.endOfDayReviewMinute ?? 0,
      enabled: settings?.endOfDayReviewEnabled ?? true,
    },
    weeklyReview: {
      day: settings?.weeklyReviewDay ?? 0,
      hour: settings?.weeklyReviewHour ?? 19,
      minute: settings?.weeklyReviewMinute ?? 0,
      enabled: settings?.weeklyReviewEnabled ?? true,
    },
    taskReminders: settings?.taskRemindersEnabled ?? true,
    overdueReminders: settings?.overdueRemindersEnabled ?? true,
  };
}

export async function scheduleSystemReminders(userId: string) {
  const config = await getReminderConfig(userId);
  const now = new Date();
  const today = startOfDay(now);

  const reminders: Array<{
    type: NotificationType;
    scheduledAt: Date;
    message: string;
  }> = [];

  if (config.morningBriefing.enabled) {
    const briefingTime = setMinutes(
      setHours(today, config.morningBriefing.hour),
      config.morningBriefing.minute
    );
    if (briefingTime > now) {
      reminders.push({
        type: "MORNING_BRIEFING",
        scheduledAt: briefingTime,
        message: "Good morning! Here's your daily briefing.",
      });
    }
  }

  if (config.endOfDayReview.enabled) {
    const reviewTime = setMinutes(
      setHours(today, config.endOfDayReview.hour),
      config.endOfDayReview.minute
    );
    if (reviewTime > now) {
      reminders.push({
        type: "END_OF_DAY_REVIEW",
        scheduledAt: reviewTime,
        message: "Time for your end-of-day review.",
      });
    }
  }

  for (const reminder of reminders) {
    const existing = await prisma.reminder.findFirst({
      where: {
        userId,
        type: reminder.type,
        scheduledAt: {
          gte: startOfDay(reminder.scheduledAt),
          lte: addDays(startOfDay(reminder.scheduledAt), 1),
        },
      },
    });

    if (!existing) {
      await prisma.reminder.create({
        data: {
          userId,
          type: reminder.type,
          scheduledAt: reminder.scheduledAt,
          message: reminder.message,
        },
      });
    }
  }
}

export async function getPendingReminders(userId: string) {
  const now = new Date();
  return prisma.reminder.findMany({
    where: {
      userId,
      isSent: false,
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function createTaskReminder(
  userId: string,
  taskId: string,
  scheduledAt: Date,
  message?: string
) {
  return prisma.reminder.create({
    data: {
      userId,
      taskId,
      type: "TASK_REMINDER",
      scheduledAt,
      message,
    },
  });
}

export async function markReminderSent(reminderId: string) {
  return prisma.reminder.update({
    where: { id: reminderId },
    data: { isSent: true, sentAt: new Date() },
  });
}

export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      channel: "IN_APP",
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

export async function getUnreadNotifications(userId: string, limit = 10) {
  return prisma.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

// Notification delivery interface for future channels (browser, email, push)
export interface NotificationDeliveryProvider {
  channel: "IN_APP" | "BROWSER" | "EMAIL" | "PUSH";
  send(userId: string, title: string, message: string, metadata?: Record<string, unknown>): Promise<boolean>;
}

export class InAppNotificationProvider implements NotificationDeliveryProvider {
  channel = "IN_APP" as const;

  async send(userId: string, title: string, message: string) {
    await createInAppNotification(userId, "TASK_REMINDER", title, message);
    return true;
  }
}

// Placeholder providers for future implementation
export class BrowserNotificationProvider implements NotificationDeliveryProvider {
  channel = "BROWSER" as const;
  async send() {
    // Will integrate with Web Push API
    return false;
  }
}

export class EmailNotificationProvider implements NotificationDeliveryProvider {
  channel = "EMAIL" as const;
  async send() {
    // Will integrate with email service (SendGrid, Resend, etc.)
    return false;
  }
}

export class PushNotificationProvider implements NotificationDeliveryProvider {
  channel = "PUSH" as const;
  async send() {
    // Will integrate with mobile push (FCM, APNs)
    return false;
  }
}

export async function processDueReminders(userId: string) {
  const due = await getPendingReminders(userId);
  const providers: NotificationDeliveryProvider[] = [
    new InAppNotificationProvider(),
  ];

  for (const reminder of due) {
    const title =
      reminder.type === "MORNING_BRIEFING"
        ? "Morning Briefing"
        : reminder.type === "END_OF_DAY_REVIEW"
          ? "End of Day Review"
          : reminder.type === "WEEKLY_REVIEW"
            ? "Weekly Review"
            : "Task Reminder";

    for (const provider of providers) {
      await provider.send(
        userId,
        title,
        reminder.message ?? "You have a reminder",
        { reminderId: reminder.id, taskId: reminder.taskId }
      );
    }
    await markReminderSent(reminder.id);
  }
}
