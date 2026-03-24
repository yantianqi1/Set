import { describe, expect, it } from "vitest";
import {
  hasNextJobsPage,
  shouldShowJobsPagination
} from "../src/lib/jobs-pagination";

describe("jobs pagination helpers", () => {
  it("shows pagination only when the total exceeds the backend page size", () => {
    expect(shouldShowJobsPagination(11, 20)).toBe(false);
    expect(shouldShowJobsPagination(20, 20)).toBe(false);
    expect(shouldShowJobsPagination(21, 20)).toBe(true);
  });

  it("detects whether another jobs page exists", () => {
    expect(hasNextJobsPage(1, 20, 21)).toBe(true);
    expect(hasNextJobsPage(2, 20, 21)).toBe(false);
  });
});
