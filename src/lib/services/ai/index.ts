/**
 * AI Service Interfaces
 *
 * These interfaces define the contract for future LLM integration.
 * Do NOT implement fake AI — wire up a real provider when ready.
 */

import type {
  ParsedTaskResult,
  TaskWithRelations,
  WorkloadAnalysis,
  WeeklyReviewData,
} from "@/types";

// ─── Natural Language Task Parsing ───────────────────────────────────────────

export interface NaturalLanguageParser {
  /**
   * Parse natural language input into structured task data.
   * Example: "Remind me every weekday at 9 AM to study GitHub AI for one hour"
   */
  parse(input: string): Promise<ParsedTaskResult>;
}

export class StubNaturalLanguageParser implements NaturalLanguageParser {
  async parse(input: string): Promise<ParsedTaskResult> {
    // Placeholder — returns basic title extraction until LLM is connected
    return { title: input.trim() };
  }
}

// ─── Daily Planning Assistant ────────────────────────────────────────────────

export interface DailyPlanningContext {
  tasks: TaskWithRelations[];
  workload: WorkloadAnalysis;
  availableMinutes: number;
  weeklyGoalProgress: { name: string; progress: number }[];
  habitsDue: string[];
}

export interface DailyPlanningSuggestion {
  prioritizedTasks: TaskWithRelations[];
  reasoning: string;
  warnings: string[];
  focusTask: TaskWithRelations | null;
}

export interface DailyPlanningAssistant {
  suggestPlan(context: DailyPlanningContext): Promise<DailyPlanningSuggestion>;
  suggestForTimeBudget(
    context: DailyPlanningContext,
    minutes: number
  ): Promise<DailyPlanningSuggestion>;
}

export class StubDailyPlanningAssistant implements DailyPlanningAssistant {
  async suggestPlan(context: DailyPlanningContext): Promise<DailyPlanningSuggestion> {
    return {
      prioritizedTasks: context.tasks.slice(0, 5),
      reasoning: "Connect an LLM provider to get intelligent planning suggestions.",
      warnings: context.workload.isOverloaded
        ? ["Your day looks overloaded. Consider rescheduling low-priority tasks."]
        : [],
      focusTask: context.tasks[0] ?? null,
    };
  }

  async suggestForTimeBudget(
    context: DailyPlanningContext,
    minutes: number
  ): Promise<DailyPlanningSuggestion> {
    let used = 0;
    const selected: TaskWithRelations[] = [];
    for (const task of context.tasks) {
      const taskMin = task.estimatedMinutes ?? 30;
      if (used + taskMin <= minutes) {
        selected.push(task);
        used += taskMin;
      }
    }
    return {
      prioritizedTasks: selected,
      reasoning: `Selected ${selected.length} tasks fitting in ${minutes} minutes.`,
      warnings: [],
      focusTask: selected[0] ?? null,
    };
  }
}

// ─── Weekly Planning Assistant ───────────────────────────────────────────────

export interface WeeklyPlanningContext {
  reviewData: WeeklyReviewData;
  pendingTasks: TaskWithRelations[];
  goals: { name: string; progress: number }[];
}

export interface WeeklyPlanSuggestion {
  priorities: string[];
  taskBreakdown: { goal: string; suggestedTasks: string[] }[];
  reasoning: string;
}

export interface WeeklyPlanningAssistant {
  planWeek(context: WeeklyPlanningContext): Promise<WeeklyPlanSuggestion>;
  breakDownGoal(
    goalName: string,
    description?: string
  ): Promise<{ title: string; estimatedMinutes?: number }[]>;
}

export class StubWeeklyPlanningAssistant implements WeeklyPlanningAssistant {
  async planWeek(context: WeeklyPlanningContext): Promise<WeeklyPlanSuggestion> {
    return {
      priorities: context.reviewData.nextWeekPriorities,
      taskBreakdown: [],
      reasoning: "Connect an LLM provider for intelligent weekly planning.",
    };
  }

  async breakDownGoal(goalName: string): Promise<{ title: string; estimatedMinutes?: number }[]> {
    return [
      { title: `Research ${goalName}`, estimatedMinutes: 60 },
      { title: `Create plan for ${goalName}`, estimatedMinutes: 30 },
      { title: `Execute first step of ${goalName}`, estimatedMinutes: 90 },
    ];
  }
}

// ─── Productivity Insights Assistant ─────────────────────────────────────────

export interface ProductivityInsight {
  type: "warning" | "suggestion" | "celebration";
  title: string;
  message: string;
}

export interface ProductivityInsightsAssistant {
  analyze(context: {
    overdueTasks: TaskWithRelations[];
    completionRate: number;
    streak: number;
    fallingBehindGoals: { name: string; progress: number }[];
  }): Promise<ProductivityInsight[]>;

  answerQuestion(
    question: string,
    context: Record<string, unknown>
  ): Promise<string>;
}

export class StubProductivityInsightsAssistant implements ProductivityInsightsAssistant {
  async analyze(context: {
    overdueTasks: TaskWithRelations[];
    completionRate: number;
    streak: number;
    fallingBehindGoals: { name: string; progress: number }[];
  }): Promise<ProductivityInsight[]> {
    const insights: ProductivityInsight[] = [];

    if (context.overdueTasks.length > 0) {
      insights.push({
        type: "warning",
        title: "Overdue Tasks",
        message: `You have ${context.overdueTasks.length} overdue task(s). Consider rescheduling or completing them today.`,
      });
    }

    if (context.streak >= 3) {
      insights.push({
        type: "celebration",
        title: "Great Streak!",
        message: `You're on a ${context.streak}-day productivity streak. Keep it up!`,
      });
    }

    return insights;
  }

  async answerQuestion(question: string): Promise<string> {
    return `AI assistant not yet connected. Your question: "${question}" — connect an LLM provider to get intelligent answers.`;
  }
}

// ─── Rescheduling Assistant ──────────────────────────────────────────────────

export interface ReschedulingAssistant {
  suggestReschedule(
    incompleteTasks: TaskWithRelations[],
    target: "tomorrow" | "next_week"
  ): Promise<{ taskId: string; suggestedDate: Date; reason: string }[]>;
}

export class StubReschedulingAssistant implements ReschedulingAssistant {
  async suggestReschedule(
    incompleteTasks: TaskWithRelations[]
  ): Promise<{ taskId: string; suggestedDate: Date; reason: string }[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return incompleteTasks.map((task) => ({
      taskId: task.id,
      suggestedDate: tomorrow,
      reason: "Moved to tomorrow to keep today manageable.",
    }));
  }
}

// ─── Service Factory ───────────────────────────────────────────────────────────

export interface AIServices {
  parser: NaturalLanguageParser;
  dailyPlanning: DailyPlanningAssistant;
  weeklyPlanning: WeeklyPlanningAssistant;
  insights: ProductivityInsightsAssistant;
  rescheduling: ReschedulingAssistant;
}

export function createAIServices(): AIServices {
  return {
    parser: new StubNaturalLanguageParser(),
    dailyPlanning: new StubDailyPlanningAssistant(),
    weeklyPlanning: new StubWeeklyPlanningAssistant(),
    insights: new StubProductivityInsightsAssistant(),
    rescheduling: new StubReschedulingAssistant(),
  };
}

// Future: swap stubs with real LLM provider
// export function createAIServicesWithProvider(provider: LLMProvider): AIServices { ... }

export interface LLMProvider {
  complete(prompt: string, systemPrompt?: string): Promise<string>;
  completeJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
}
