import type { Messages } from "./messages";

export const JOB_STATUS_COLORS: Record<string, string> = {
  pending: "var(--muted)",
  planning: "var(--accent)",
  planning_failed: "#f87171",
  prompt_generating: "var(--accent)",
  prompt_partial_failed: "#fbbf24",
  image_generating: "var(--accent)",
  completed: "#4ade80",
  partial_completed: "#fbbf24",
  failed: "#f87171",
  cancelled: "var(--ink-light)"
};

const TERMINAL_JOB_STATUSES = new Set([
  "planning_failed",
  "prompt_partial_failed",
  "completed",
  "partial_completed",
  "failed",
  "cancelled"
]);
const RETRYABLE_FAILED_JOB_STATUSES = new Set([
  "planning_failed",
  "prompt_partial_failed",
  "partial_completed",
  "failed"
]);

export function getStatusLabel(status: string, t: Messages) {
  const labels = t.status as Record<string, string>;
  return labels[status] ?? status;
}

export function shouldAutoRefreshJob(status: string) {
  return !TERMINAL_JOB_STATUSES.has(status);
}

export function canRetryFailedItems(status: string) {
  return RETRYABLE_FAILED_JOB_STATUSES.has(status);
}
