import { getDefaultUser } from "@/lib/db";
import {
  getIncompleteTasksForReview,
  getTodayCompletedCount,
} from "@/lib/services/planning";
import { DailyReviewClient } from "./daily-review-client";

export default async function DailyReviewPage() {
  const user = await getDefaultUser();
  const [completed, incomplete] = await Promise.all([
    getTodayCompletedCount(user.id),
    getIncompleteTasksForReview(user.id),
  ]);

  return (
    <DailyReviewClient
      completed={completed}
      incomplete={incomplete as Parameters<typeof DailyReviewClient>[0]["incomplete"]}
    />
  );
}
