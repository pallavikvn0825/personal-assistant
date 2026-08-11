import type {
  Priority,
  TaskStatus,
  RecurrenceType,
  GoalStatus,
  NotificationType,
  Theme,
} from "@prisma/client";

export type {
  Priority,
  TaskStatus,
  RecurrenceType,
  GoalStatus,
  NotificationType,
  Theme,
};

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  dueTime: string | null;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: number | null;
  category: string | null;
  notes: string | null;
  isTopPriority: boolean;
  recurrenceType: RecurrenceType;
  recurrenceRule: string | null;
  recurrenceDays: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  goalId: string | null;
  projectId: string | null;
  parentId: string | null;
  goal?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
  subtasks?: TaskWithRelations[];
}

export interface DashboardStats {
  totalToday: number;
  completedToday: number;
  remainingToday: number;
  overdueCount: number;
  completionPercentage: number;
  topPriority: TaskWithRelations | null;
  streak: {
    current: number;
    longest: number;
    tasksThisWeek: number;
  };
}

export interface WorkloadAnalysis {
  taskCount: number;
  estimatedMinutes: number;
  availableMinutes: number;
  isOverloaded: boolean;
  suggestedToMove: TaskWithRelations[];
}

export interface WeeklyGoalProgress {
  id: string;
  name: string;
  progress: number;
  projectName?: string;
}

export interface ParsedTaskResult {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  estimatedMinutes?: number;
  recurrenceType?: RecurrenceType;
  recurrenceDays?: number[];
  category?: string;
  projectName?: string;
  goalName?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  priority?: Priority;
  estimatedMinutes?: number;
  category?: string;
  notes?: string;
  goalId?: string;
  projectId?: string;
  parentId?: string;
  isTopPriority?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceRule?: string;
  recurrenceDays?: number[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
}

export interface HabitWithCompletion {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequencyType: string;
  targetCount: number;
  daysOfWeek: string | null;
  currentStreak: number;
  weeklyConsistency: number;
  completedToday: boolean;
  completionsThisWeek: number;
}

export interface AnalyticsSummary {
  dailyCompletionRate: number;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  tasksCompleted: number;
  tasksSkipped: number;
  tasksOverdue: number;
  averageCompletionMinutes: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  currentStreak: number;
  longestStreak: number;
  habitConsistency: number;
  goalProgress: WeeklyGoalProgress[];
}

export interface WeeklyReviewData {
  weekStart: Date;
  weekEnd: Date;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  completedGoals: string[];
  pendingItems: string[];
  streakDays: number;
  nextWeekPriorities: string[];
}

export interface DailyReviewData {
  date: Date;
  completed: number;
  incomplete: TaskWithRelations[];
  moved: number;
  skipped: number;
}

export interface ReminderConfig {
  morningBriefing: { hour: number; minute: number; enabled: boolean };
  endOfDayReview: { hour: number; minute: number; enabled: boolean };
  weeklyReview: { day: number; hour: number; minute: number; enabled: boolean };
  taskReminders: boolean;
  overdueReminders: boolean;
}
