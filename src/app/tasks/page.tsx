import { getDefaultUser, prisma } from "@/lib/db";
import { getTasks } from "@/lib/services/tasks";
import { TasksPageClient } from "./tasks-client";

export default async function TasksPage() {
  const user = await getDefaultUser();
  const [tasks, projects] = await Promise.all([
    getTasks(user.id),
    prisma.project.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <TasksPageClient tasks={tasks} projects={projects} />;
}
