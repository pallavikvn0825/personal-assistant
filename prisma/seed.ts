import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const email = process.env.DEFAULT_USER_EMAIL ?? "me@example.com";
  const name = process.env.DEFAULT_USER_NAME ?? "You";

  // Clear existing data
  await prisma.parsedTaskDraft.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.dailyReview.deleteMany();
  await prisma.weeklyReview.deleteMany();
  await prisma.habitCompletion.deleteMany();
  await prisma.taskInstance.deleteMany();
  await prisma.task.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.productivityStreak.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email,
      name,
      timezone: "America/New_York",
      settings: {
        create: {
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
          theme: "SYSTEM",
        },
      },
      productivityStreak: {
        create: {
          currentStreak: 5,
          longestStreak: 12,
          lastActiveDate: startOfDay(new Date()),
          tasksThisWeek: 18,
        },
      },
    },
  });

  const userId = user.id;
  const today = startOfDay(new Date());

  // Goals
  const careerGoal = await prisma.goal.create({
    data: {
      userId,
      name: "Career Development",
      description: "Advance professional skills and certifications",
      priority: "HIGH",
      progress: 60,
      sortOrder: 0,
    },
  });

  const healthGoal = await prisma.goal.create({
    data: {
      userId,
      name: "Health & Wellness",
      description: "Maintain physical and mental health habits",
      priority: "MEDIUM",
      progress: 75,
      sortOrder: 1,
    },
  });

  // Projects
  const githubProject = await prisma.project.create({
    data: {
      userId,
      goalId: careerGoal.id,
      name: "GitHub AI Developer Certification",
      description: "Complete GitHub AI certification program",
      progress: 70,
      priority: "HIGH",
      sortOrder: 0,
    },
  });

  const apolloProject = await prisma.project.create({
    data: {
      userId,
      goalId: careerGoal.id,
      name: "Apollo Cloud Certification",
      description: "Apollo GraphQL cloud certification",
      progress: 40,
      priority: "HIGH",
      sortOrder: 1,
    },
  });

  const onboardingProject = await prisma.project.create({
    data: {
      userId,
      goalId: careerGoal.id,
      name: "Onboarding",
      description: "Complete new role onboarding tasks",
      progress: 80,
      priority: "MEDIUM",
      sortOrder: 2,
    },
  });

  // Tasks
  const tasks = [
    {
      title: "Study GitHub AI concepts",
      description: "Review AI fundamentals and GitHub Copilot features",
      dueDate: today,
      dueTime: "09:00",
      priority: "HIGH" as const,
      estimatedMinutes: 60,
      category: "Study",
      projectId: githubProject.id,
      goalId: careerGoal.id,
      isTopPriority: true,
      recurrenceType: "WEEKDAYS" as const,
    },
    {
      title: "Complete GitHub AI practice lab",
      description: "Hands-on lab for AI integration",
      dueDate: today,
      priority: "HIGH" as const,
      estimatedMinutes: 90,
      category: "Study",
      projectId: githubProject.id,
      goalId: careerGoal.id,
    },
    {
      title: "Review certification practice questions",
      description: "Go through practice exam questions",
      dueDate: addDays(today, 1),
      priority: "MEDIUM" as const,
      estimatedMinutes: 45,
      category: "Study",
      projectId: githubProject.id,
      goalId: careerGoal.id,
    },
    {
      title: "Study Apollo Cloud module 3",
      description: "GraphQL federation and schema design",
      dueDate: today,
      priority: "MEDIUM" as const,
      estimatedMinutes: 60,
      category: "Study",
      projectId: apolloProject.id,
      goalId: careerGoal.id,
    },
    {
      title: "Complete onboarding security training",
      description: "Mandatory security awareness training",
      dueDate: addDays(today, 2),
      priority: "HIGH" as const,
      estimatedMinutes: 30,
      category: "Work",
      projectId: onboardingProject.id,
      goalId: careerGoal.id,
    },
    {
      title: "Set up development environment",
      description: "Configure local dev tools and access",
      dueDate: subDays(today, 1),
      priority: "HIGH" as const,
      estimatedMinutes: 45,
      category: "Work",
      projectId: onboardingProject.id,
      goalId: careerGoal.id,
      status: "PENDING" as const,
    },
    {
      title: "Review team documentation",
      description: "Read through team wiki and processes",
      dueDate: addDays(today, 3),
      priority: "LOW" as const,
      estimatedMinutes: 30,
      category: "Work",
      projectId: onboardingProject.id,
      goalId: careerGoal.id,
    },
    {
      title: "Take GitHub AI practice exam",
      description: "Mock certification exam",
      dueDate: addDays(today, 5),
      priority: "HIGH" as const,
      estimatedMinutes: 120,
      category: "Study",
      projectId: githubProject.id,
      goalId: careerGoal.id,
    },
    {
      title: "Optional reading: AI trends article",
      description: "Industry article on AI in development",
      dueDate: today,
      priority: "LOW" as const,
      estimatedMinutes: 20,
      category: "Reading",
    },
  ];

  for (const taskData of tasks) {
    const { status, ...data } = taskData as typeof taskData & { status?: string };
    await prisma.task.create({
      data: {
        userId,
        ...data,
        status: (status as "PENDING") ?? "PENDING",
      },
    });
  }

  // Completed tasks for analytics
  const completedTasks = [
    { title: "Complete module 1", projectId: githubProject.id, goalId: careerGoal.id, daysAgo: 1 },
    { title: "Complete module 2", projectId: githubProject.id, goalId: careerGoal.id, daysAgo: 2 },
    { title: "Apollo module 1", projectId: apolloProject.id, goalId: careerGoal.id, daysAgo: 3 },
    { title: "Apollo module 2", projectId: apolloProject.id, goalId: careerGoal.id, daysAgo: 4 },
    { title: "HR paperwork", projectId: onboardingProject.id, goalId: careerGoal.id, daysAgo: 5 },
  ];

  for (const ct of completedTasks) {
    const completedAt = subDays(new Date(), ct.daysAgo);
    await prisma.task.create({
      data: {
        userId,
        title: ct.title,
        projectId: ct.projectId,
        goalId: ct.goalId,
        status: "COMPLETED",
        completedAt,
        dueDate: completedAt,
        priority: "MEDIUM",
        estimatedMinutes: 60,
      },
    });
  }

  // Habits
  const habits = [
    { name: "Study for 1 hour", icon: "📚", color: "#6366f1", frequencyType: "daily", reminderTime: "09:00" },
    { name: "Exercise", icon: "🏃", color: "#22c55e", frequencyType: "daily", reminderTime: "07:00" },
    { name: "Read 20 minutes", icon: "📖", color: "#f59e0b", frequencyType: "daily" },
    { name: "Review daily tasks", icon: "✅", color: "#3b82f6", frequencyType: "daily", reminderTime: "20:00" },
    { name: "Journal", icon: "📝", color: "#a855f7", frequencyType: "daily" },
    { name: "Meditation", icon: "🧘", color: "#06b6d4", frequencyType: "daily", reminderTime: "07:30" },
  ];

  for (let i = 0; i < habits.length; i++) {
    const habit = await prisma.habit.create({
      data: { userId, ...habits[i], sortOrder: i },
    });

    // Add some completion history
    for (let d = 0; d < 7; d++) {
      if (d === 0 && i < 3) continue; // today handled below
      if (Math.random() > 0.3) {
        await prisma.habitCompletion.create({
          data: {
            userId,
            habitId: habit.id,
            date: subDays(today, d),
          },
        });
      }
    }

    // Today completions for some habits
    if (i < 3) {
      await prisma.habitCompletion.upsert({
        where: { habitId_date: { habitId: habit.id, date: today } },
        create: { userId, habitId: habit.id, date: today },
        update: {},
      });
    }
  }

  // Sample reminders
  await prisma.reminder.create({
    data: {
      userId,
      type: "MORNING_BRIEFING",
      scheduledAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
      message: "Good morning! Here's your daily briefing.",
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   User: ${email}`);
  console.log(`   Goals: 2, Projects: 3, Tasks: ${tasks.length + completedTasks.length}, Habits: ${habits.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
