import { createRequire } from "node:module";
import type { PrismaClient } from "@prisma/client";

export function createPrismaClient() {
  const require = createRequire(import.meta.url);
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  return new PrismaClient();
}

export type PrismaDatabaseClient = PrismaClient;
