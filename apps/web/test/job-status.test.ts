import { describe, expect, it } from "vitest";
import {
  canRetryFailedItems,
  shouldAutoRefreshJob
} from "../src/i18n/job-status";

describe("job status polling", () => {
  it("keeps polling for active jobs and stops for terminal jobs", () => {
    expect(shouldAutoRefreshJob("pending")).toBe(true);
    expect(shouldAutoRefreshJob("image_generating")).toBe(true);
    expect(shouldAutoRefreshJob("completed")).toBe(false);
    expect(shouldAutoRefreshJob("partial_completed")).toBe(false);
    expect(shouldAutoRefreshJob("planning_failed")).toBe(false);
    expect(shouldAutoRefreshJob("prompt_partial_failed")).toBe(false);
    expect(shouldAutoRefreshJob("cancelled")).toBe(false);
  });
});

describe("job retry affordances", () => {
  it("shows the retry-failed action for recoverable terminal states", () => {
    expect(canRetryFailedItems("planning_failed")).toBe(true);
    expect(canRetryFailedItems("prompt_partial_failed")).toBe(true);
    expect(canRetryFailedItems("partial_completed")).toBe(true);
    expect(canRetryFailedItems("failed")).toBe(true);
    expect(canRetryFailedItems("completed")).toBe(false);
    expect(canRetryFailedItems("cancelled")).toBe(false);
  });
});
