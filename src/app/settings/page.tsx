import { getDefaultUser } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getDefaultUser();

  const defaultSettings = {
    workStartHour: 9,
    workEndHour: 17,
    availableHours: 8,
    morningBriefingHour: 9,
    morningBriefingMinute: 0,
    endOfDayReviewHour: 20,
    endOfDayReviewMinute: 0,
    weeklyReviewDay: 0,
    weeklyReviewHour: 19,
    weeklyReviewMinute: 0,
    notificationsEnabled: true,
    morningBriefingEnabled: true,
    endOfDayReviewEnabled: true,
    weeklyReviewEnabled: true,
    taskRemindersEnabled: true,
    overdueRemindersEnabled: true,
    theme: "SYSTEM" as const,
  };

  return (
    <SettingsClient
      user={{ name: user.name, email: user.email, timezone: user.timezone }}
      settings={user.settings ?? defaultSettings}
    />
  );
}
