import { getDefaultUser } from "@/lib/db";
import { getHabitsWithStatus } from "@/lib/services/habits";
import { HabitsClient } from "./habits-client";

export default async function HabitsPage() {
  const user = await getDefaultUser();
  const habits = await getHabitsWithStatus(user.id);
  return <HabitsClient habits={habits} />;
}
