import { getDefaultUser, prisma } from "@/lib/db";
import { CalendarClient } from "./calendar-client";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";

export default async function CalendarPage() {
  const user = await getDefaultUser();
  const now = new Date();
  const rangeStart = startOfMonth(addMonths(now, -1));
  const rangeEnd = endOfMonth(addMonths(now, 2));

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      parentId: null,
      dueDate: { gte: rangeStart, lte: rangeEnd },
      status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      dueTime: true,
      priority: true,
      status: true,
    },
    orderBy: { dueDate: "asc" },
  });

  const serialized = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate!.toISOString(),
  }));

  return <CalendarClient tasks={serialized} />;
}
