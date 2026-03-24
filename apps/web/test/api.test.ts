import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  actionRetryFailed,
  createImageSetJob,
  getImageSetJob,
  imageContentUrl,
  listImageSetJobs,
  resolveApiPrefix
} from "../src/lib/api";

type Assert<T extends true> = T;
type JobDetail = Awaited<ReturnType<typeof getImageSetJob>>;
type JobDetailHasCreatedAt = JobDetail["job"] extends { created_at: string } ? true : false;
type JobsList = Awaited<ReturnType<typeof listImageSetJobs>>;
type JobsListHasPageSize = JobsList["pagination"] extends { page_size: number } ? true : false;
const jobDetailTypeAssertion: Assert<JobDetailHasCreatedAt> = true;
const jobsListTypeAssertion: Assert<JobsListHasPageSize> = true;

describe("resolveApiPrefix", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("falls back to same-origin api path when no env override exists", () => {
    expect(resolveApiPrefix("")).toBe("/api");
    expect(resolveApiPrefix(undefined)).toBe("/api");
  });

  it("uses NEXT_PUBLIC_API_BASE_URL when provided", () => {
    expect(resolveApiPrefix("http://localhost:4000/api")).toBe("http://localhost:4000/api");
    expect(resolveApiPrefix("http://localhost:4000/api/")).toBe("http://localhost:4000/api");
  });

  it("builds local proxy urls for generated images", () => {
    expect(imageContentUrl("job-1", 2)).toBe("/api/image-set-jobs/job-1/images/2/content");
  });

  it("sends pollinations overrides when creating a job", async () => {
    localStorage.setItem("image-set-client-token", "browser-token");
    localStorage.setItem(
      "image-set-settings",
      JSON.stringify({
        pollinations: {
          api_key: "pollinations-secret",
          planning_model: "openai",
          prompt_model: "openai-fast",
          image_model: "flux"
        }
      })
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ job: { id: "job-1" } }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      })
    );

    await createImageSetJob({
      pack_input: {
        theme: "海边泳装写真"
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/image-set-jobs",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Client-Token": "browser-token"
        }),
        body: JSON.stringify({
          pack_input: {
            theme: "海边泳装写真"
          },
          provider_overrides: {
            pollinations: {
              api_key: "pollinations-secret",
              planning_model: "openai",
              prompt_model: "openai-fast",
              image_model: "flux"
            }
          }
        })
      })
    );
  });

  it("keeps created_at on job detail responses", () => {
    expect(jobDetailTypeAssertion).toBe(true);
  });

  it("keeps page_size on job list responses", () => {
    expect(jobsListTypeAssertion).toBe(true);
  });

  it("calls the retry-failed endpoint with the client token header", async () => {
    localStorage.setItem("image-set-client-token", "browser-token");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        status: 202,
        headers: {
          "Content-Type": "application/json"
        }
      })
    );

    await actionRetryFailed("job-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/image-set-jobs/job-1/retry-failed",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Client-Token": "browser-token"
        })
      })
    );
  });
});
