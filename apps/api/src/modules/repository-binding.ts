import { createPrismaClient } from "../lib/prisma.js";
import { createInMemoryImageSetRepository, type ImageSetRepository } from "./repository.js";
import { createPrismaImageSetRepository } from "./prisma-repository.js";

export interface RepositoryBinding {
  repository: ImageSetRepository;
  dispose: (() => Promise<void>) | null;
}

export function createPrismaRepositoryBinding(): RepositoryBinding {
  const prisma = createPrismaClient();
  return {
    repository: createPrismaImageSetRepository(prisma),
    dispose: async () => {
      await prisma.$disconnect();
    }
  };
}

export function createRepositoryBinding(options: {
  environment: string | undefined;
  repository?: ImageSetRepository;
  createPrismaBinding?: () => RepositoryBinding;
}): RepositoryBinding {
  if (options.repository) {
    return {
      repository: options.repository,
      dispose: null
    };
  }

  if (options.environment === "test") {
    return {
      repository: createInMemoryImageSetRepository(),
      dispose: null
    };
  }

  return (options.createPrismaBinding ?? createPrismaRepositoryBinding)();
}
