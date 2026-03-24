import { describe, expect, it, vi } from "vitest";
import type { PrismaDatabaseClient } from "../src/lib/prisma";
import { createPrismaImageSetRepository } from "../src/modules/prisma-repository";

describe("prisma image set repository", () => {
  it("does not treat prompt_partial_failed as a runnable status", async () => {
    const findMany = vi.fn(async () => []);
    const prisma = {
      imageSetJob: {
        findMany
      }
    } as unknown as PrismaDatabaseClient;
    const repository = createPrismaImageSetRepository(prisma);

    await repository.listRunnableJobs();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]?.[0].where.status.in).toEqual([
      "pending",
      "planning",
      "prompt_generating",
      "image_generating"
    ]);
  });
});
