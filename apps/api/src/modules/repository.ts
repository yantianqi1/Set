import { randomUUID } from "node:crypto";
import type {
  CreateJobRecordInput,
  ImageSetEventRecord,
  ImageSetJobRecord,
  ImageSetPlanItemRecord,
  ImageSetPromptRecord,
  ImageSetResultImageRecord
} from "./domain.js";

export interface ImageSetRepository {
  createJob(input: CreateJobRecordInput): Promise<ImageSetJobRecord>;
  getJob(jobId: string): Promise<ImageSetJobRecord | null>;
  getJobOwnedByHash(ownerTokenHash: string, jobId: string): Promise<ImageSetJobRecord | null>;
  listJobsByOwnerHash(
    ownerTokenHash: string,
    page: number,
    pageSize: number
  ): Promise<{ items: ImageSetJobRecord[]; total: number }>;
  listRunnableJobs(): Promise<ImageSetJobRecord[]>;
  updateJob(jobId: string, updater: (job: ImageSetJobRecord) => ImageSetJobRecord): Promise<ImageSetJobRecord>;
}

function nowIso() {
  return new Date().toISOString();
}

function cloneJob(job: ImageSetJobRecord) {
  return structuredClone(job);
}

export function createInMemoryImageSetRepository(): ImageSetRepository {
  const jobs = new Map<string, ImageSetJobRecord>();

  return {
    async createJob(input) {
      const createdAt = nowIso();
      const job: ImageSetJobRecord = {
        id: randomUUID(),
        ownerTokenHash: input.ownerTokenHash,
        status: "pending",
        packInput: input.packInput,
        totalImages: input.packInput.image_count,
        successImages: 0,
        failedImages: 0,
        resolvedPollinationsConfigEncrypted: input.resolvedPollinationsConfigEncrypted,
        createdAt,
        updatedAt: createdAt,
        startedAt: null,
        finishedAt: null,
        failedReason: null,
        planItems: [],
        prompts: [],
        images: [],
        events: []
      };
      jobs.set(job.id, job);
      return cloneJob(job);
    },

    async getJob(jobId) {
      const job = jobs.get(jobId);
      return job ? cloneJob(job) : null;
    },

    async getJobOwnedByHash(ownerTokenHash, jobId) {
      const job = jobs.get(jobId);
      if (!job || job.ownerTokenHash !== ownerTokenHash) {
        return null;
      }
      return cloneJob(job);
    },

    async listJobsByOwnerHash(ownerTokenHash, page, pageSize) {
      const items = Array.from(jobs.values())
        .filter((job) => job.ownerTokenHash === ownerTokenHash)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      const start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize).map(cloneJob),
        total: items.length
      };
    },

    async listRunnableJobs() {
      return Array.from(jobs.values())
        .filter((job) =>
          ["pending", "planning", "prompt_generating", "image_generating"].includes(job.status)
        )
        .map(cloneJob);
    },

    async updateJob(jobId, updater) {
      const current = jobs.get(jobId);
      if (!current) {
        throw new Error("Job not found");
      }
      const updated = updater(cloneJob(current));
      updated.updatedAt = nowIso();
      jobs.set(jobId, updated);
      return cloneJob(updated);
    }
  };
}

export function createEvent(stage: string, level: "info" | "error", message: string): ImageSetEventRecord {
  return {
    id: randomUUID(),
    stage,
    level,
    message,
    createdAt: nowIso()
  };
}

export function upsertPrompt(job: ImageSetJobRecord, prompt: ImageSetPromptRecord) {
  const next = job.prompts.filter((item) => item.imageIndex !== prompt.imageIndex);
  next.push(prompt);
  next.sort((left, right) => left.imageIndex - right.imageIndex);
  return next;
}

export function upsertImage(job: ImageSetJobRecord, image: ImageSetResultImageRecord) {
  const next = job.images.filter((item) => item.imageIndex !== image.imageIndex);
  next.push(image);
  next.sort((left, right) => left.imageIndex - right.imageIndex);
  return next;
}

export function replacePlan(job: ImageSetJobRecord, items: ImageSetPlanItemRecord[]) {
  return items.sort((left, right) => left.imageIndex - right.imageIndex);
}
