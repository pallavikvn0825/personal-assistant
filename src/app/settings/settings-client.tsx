"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { updateSettingsAction } from "@/lib/actions";
import { setTheme } from "@/components/layout/theme-provider";
import type { Theme } from "@prisma/client";

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    timezone: string;
  };
  settings: {
    workStartHour: number;
    workEndHour: number;
    availableHours: number;
    morningBriefingHour: number;
    morningBriefingMinute: number;
    endOfDayReviewHour: number;
    endOfDayReviewMinute: number;
    weeklyReviewDay: number;
    weeklyReviewHour: number;
    weeklyReviewMinute: number;
    notificationsEnabled: boolean;
    morningBriefingEnabled: boolean;
    endOfDayReviewEnabled: boolean;
    weeklyReviewEnabled: boolean;
    taskRemindersEnabled: boolean;
    overdueRemindersEnabled: boolean;
    theme: Theme;
  };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SettingsClient({ user, settings }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      await updateSettingsAction({
        name: form.get("name") as string,
        timezone: form.get("timezone") as string,
        workStartHour: parseInt(form.get("workStartHour") as string),
        workEndHour: parseInt(form.get("workEndHour") as string),
        availableHours: parseInt(form.get("availableHours") as string),
        morningBriefingHour: parseInt(form.get("morningBriefingHour") as string),
        morningBriefingMinute: parseInt(form.get("morningBriefingMinute") as string),
        endOfDayReviewHour: parseInt(form.get("endOfDayReviewHour") as string),
        endOfDayReviewMinute: parseInt(form.get("endOfDayReviewMinute") as string),
        weeklyReviewDay: parseInt(form.get("weeklyReviewDay") as string),
        weeklyReviewHour: parseInt(form.get("weeklyReviewHour") as string),
        weeklyReviewMinute: parseInt(form.get("weeklyReviewMinute") as string),
        notificationsEnabled: form.get("notificationsEnabled") === "on",
        morningBriefingEnabled: form.get("morningBriefingEnabled") === "on",
        endOfDayReviewEnabled: form.get("endOfDayReviewEnabled") === "on",
        weeklyReviewEnabled: form.get("weeklyReviewEnabled") === "on",
        taskRemindersEnabled: form.get("taskRemindersEnabled") === "on",
        overdueRemindersEnabled: form.get("overdueRemindersEnabled") === "on",
        theme: form.get("theme") as Theme,
      });

      const theme = form.get("theme") as string;
      if (theme === "LIGHT") setTheme("light");
      else if (theme === "DARK") setTheme("dark");
      else setTheme("system");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your productivity assistant</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user.email} disabled />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" defaultValue={user.timezone} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Planning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workStartHour">Work Start (hour)</Label>
                <Input id="workStartHour" name="workStartHour" type="number" min="0" max="23" defaultValue={settings.workStartHour} />
              </div>
              <div>
                <Label htmlFor="workEndHour">Work End (hour)</Label>
                <Input id="workEndHour" name="workEndHour" type="number" min="0" max="23" defaultValue={settings.workEndHour} />
              </div>
            </div>
            <div>
              <Label htmlFor="availableHours">Available Working Hours</Label>
              <Input id="availableHours" name="availableHours" type="number" min="1" max="16" defaultValue={settings.availableHours} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="notificationsEnabled" defaultChecked={settings.notificationsEnabled} />
              Enable notifications
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Morning Briefing</Label>
                <div className="flex gap-2 mt-1">
                  <Input name="morningBriefingHour" type="number" min="0" max="23" defaultValue={settings.morningBriefingHour} className="w-20" />
                  <span className="self-center text-muted-foreground">:</span>
                  <Input name="morningBriefingMinute" type="number" min="0" max="59" defaultValue={settings.morningBriefingMinute} className="w-20" />
                </div>
                <label className="flex items-center gap-2 text-xs mt-1 text-muted-foreground cursor-pointer">
                  <input type="checkbox" name="morningBriefingEnabled" defaultChecked={settings.morningBriefingEnabled} />
                  Enabled
                </label>
              </div>
              <div>
                <Label>End of Day Review</Label>
                <div className="flex gap-2 mt-1">
                  <Input name="endOfDayReviewHour" type="number" min="0" max="23" defaultValue={settings.endOfDayReviewHour} className="w-20" />
                  <span className="self-center text-muted-foreground">:</span>
                  <Input name="endOfDayReviewMinute" type="number" min="0" max="59" defaultValue={settings.endOfDayReviewMinute} className="w-20" />
                </div>
                <label className="flex items-center gap-2 text-xs mt-1 text-muted-foreground cursor-pointer">
                  <input type="checkbox" name="endOfDayReviewEnabled" defaultChecked={settings.endOfDayReviewEnabled} />
                  Enabled
                </label>
              </div>
            </div>
            <div>
              <Label>Weekly Review</Label>
              <div className="flex gap-2 mt-1">
                <Select name="weeklyReviewDay" defaultValue={settings.weeklyReviewDay.toString()} className="flex-1">
                  {DAYS.map((day, i) => (
                    <option key={day} value={i}>{day}</option>
                  ))}
                </Select>
                <Input name="weeklyReviewHour" type="number" min="0" max="23" defaultValue={settings.weeklyReviewHour} className="w-20" />
                <span className="self-center text-muted-foreground">:</span>
                <Input name="weeklyReviewMinute" type="number" min="0" max="59" defaultValue={settings.weeklyReviewMinute} className="w-20" />
              </div>
              <label className="flex items-center gap-2 text-xs mt-1 text-muted-foreground cursor-pointer">
                <input type="checkbox" name="weeklyReviewEnabled" defaultChecked={settings.weeklyReviewEnabled} />
                Enabled
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="taskRemindersEnabled" defaultChecked={settings.taskRemindersEnabled} />
              Task reminders
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="overdueRemindersEnabled" defaultChecked={settings.overdueRemindersEnabled} />
              Overdue reminders
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="theme">Theme</Label>
            <Select id="theme" name="theme" defaultValue={settings.theme} className="mt-1">
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
              <option value="SYSTEM">System</option>
            </Select>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
