import { describe, expect, it, vi } from "vitest";
import type { ImageSetRepository } from "../src/modules/repository";
import { createRepositoryBinding } from "../src/modules/repository-binding";

function createRepositoryStub(): ImageSetRepository {
  return {
    createJob: vi.fn(),
    getJob: vi.fn(),
    getJobOwnedByHash: vi.fn(),
    listJobsByOwnerHash: vi.fn(),
    listRunnableJobs: vi.fn(),
    updateJob: vi.fn()
  } as unknown as ImageSetRepository;
}

describe("createRepositoryBinding", () => {
  it("prefers an explicit repository", () => {
    const customRepository = createRepositoryStub();
    const createPrismaBinding = vi.fn();

    const binding = createRepositoryBinding({
      environment: "production",
      repository: customRepository,
      createPrismaBinding
    });

    expect(binding.repository).toBe(customRepository);
    expect(binding.dispose).toBeNull();
    expect(createPrismaBinding).not.toHaveBeenCalled();
  });

  it("uses the in-memory repository in test environment", () => {
    const createPrismaBinding = vi.fn();

    const binding = createRepositoryBinding({
      environment: "test",
      createPrismaBinding
    });

    expect(typeof binding.repository.createJob).toBe("function");
    expect(binding.dispose).toBeNull();
    expect(createPrismaBinding).not.toHaveBeenCalled();
  });

  it("uses the prisma binding outside test when no repository is injected", () => {
    const prismaRepository = createRepositoryStub();
    const dispose = vi.fn(async () => undefined);
    const createPrismaBinding = vi.fn(() => ({
      repository: prismaRepository,
      dispose
    }));

    const binding = createRepositoryBinding({
      environment: "production",
      createPrismaBinding
    });

    expect(binding.repository).toBe(prismaRepository);
    expect(binding.dispose).toBe(dispose);
    expect(createPrismaBinding).toHaveBeenCalledTimes(1);
  });
});
