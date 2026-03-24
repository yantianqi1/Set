import { randomUUID } from "node:crypto";
import type { AppConfig } from "../config.js";
import { decryptJson } from "../lib/crypto.js";
import type {
  ImageSetJobRecord,
  ImageSetPlanItemRecord,
  ImageSetPromptRecord,
  ImageSetResultImageRecord,
  ResolvedPollinationsConfig
} from "./domain.js";
import type { ProviderRegistry } from "./providers.js";
import {
  createEvent,
  type ImageSetRepository,
  replacePlan,
  upsertImage,
  upsertPrompt
} from "./repository.js";

const PROMPT_RETRY_DELAYS_MS = [0, 1_000, 3_000] as const;
const FINAL_JOB_STATUSES = [
  "completed",
  "partial_completed",
  "failed",
  "cancelled",
  "prompt_partial_failed"
] as const;

function countReady(
  items: Array<{ imageStatus?: string; promptStatus?: string }>,
  field: "imageStatus" | "promptStatus"
) {
  return items.filter((item) => item[field] === "ready").length;
}

function countFailed(
  items: Array<{ imageStatus?: string; promptStatus?: string }>,
  field: "imageStatus" | "promptStatus"
) {
  return items.filter((item) => item[field] === "failed").length;
}

function isCancelled(job: ImageSetJobRecord | null) {
  return !job || job.status === "cancelled";
}

function toProviderPlanItem(planItem: ImageSetPlanItemRecord) {
  return {
    image_index: planItem.imageIndex,
    title: planItem.title,
    purpose: planItem.purpose,
    shot_type: planItem.shotType,
    camera_angle: planItem.cameraAngle,
    pose: planItem.pose,
    expression: planItem.expression,
    outfit_variant: planItem.outfitVariant,
    background: planItem.background,
    lighting: planItem.lighting,
    composition_focus: planItem.compositionFocus,
    consistency_anchor: planItem.consistencyAnchor,
    variation_point: planItem.variationPoint,
    detailed_intent: planItem.detailedIntent
  };
}

function unresolvedPromptCount(job: ImageSetJobRecord) {
  return job.planItems.filter((item) => {
    const prompt = job.prompts.find((entry) => entry.imageIndex === item.imageIndex);
    return prompt?.promptStatus !== "ready";
  }).length;
}

function promptRetryStartMessage(round: number) {
  return `提示词自动重试第 ${round} 轮开始`;
}

function promptRetryEndMessage(round: number, remaining: number) {
  return `提示词自动重试第 ${round} 轮结束，剩余 ${remaining} 项待恢复`;
}

function promptRetryExhaustedMessage(remaining: number) {
  return `提示词自动重试耗尽，仍有 ${remaining} 项失败`;
}

async function waitForRetryDelay(delayMs: number) {
  if (delayMs === 0) {
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function toPlanRecord(item: {
  image_index: number;
  title: string;
  purpose: string;
  shot_type: string;
  camera_angle: string;
  pose: string;
  expression: string;
  outfit_variant: string;
  background: string;
  lighting: string;
  composition_focus: string;
  consistency_anchor: string;
  variation_point: string;
  detailed_intent: string;
}): ImageSetPlanItemRecord {
  return {
    id: randomUUID(),
    imageIndex: item.image_index,
    title: item.title,
    purpose: item.purpose,
    shotType: item.shot_type,
    cameraAngle: item.camera_angle,
    pose: item.pose,
    expression: item.expression,
    outfitVariant: item.outfit_variant,
    background: item.background,
    lighting: item.lighting,
    compositionFocus: item.composition_focus,
    consistencyAnchor: item.consistency_anchor,
    variationPoint: item.variation_point,
    detailedIntent: item.detailed_intent
  };
}

export class ImageSetScheduler {
  private activeJobs = new Map<string, Promise<void>>();
  private intervalId?: NodeJS.Timeout;

  constructor(
    private readonly repository: ImageSetRepository,
    private readonly providers: ProviderRegistry,
    private readonly config: AppConfig
  ) {}

  start() {
    if (this.intervalId) {
      return;
    }
    this.intervalId = setInterval(() => void this.tick(), this.config.schedulerPollMs);
  }

  stop() {
    if (!this.intervalId) {
      return;
    }
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  async tick() {
    const jobs = await this.repository.listRunnableJobs();
    await Promise.all(jobs.map((job) => this.runJob(job.id)));
  }

  runJob(jobId: string) {
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId)!;
    }

    const task = this.processJob(jobId).finally(() => {
      this.activeJobs.delete(jobId);
    });
    this.activeJobs.set(jobId, task);
    return task;
  }

  private async processJob(jobId: string) {
    const job = await this.repository.getJob(jobId);
    if (!job || job.status === "cancelled") {
      return;
    }

    const pollinationsConfig = decryptJson<ResolvedPollinationsConfig>(
      this.config.encryptionKey,
      job.resolvedPollinationsConfigEncrypted
    );

    if (job.planItems.length === 0) {
      await this.runPlanning(jobId, pollinationsConfig);
    }
    const afterPlanning = await this.repository.getJob(jobId);
    if (!afterPlanning || ["cancelled", "planning_failed"].includes(afterPlanning.status)) {
      return;
    }

    const promptsFinished = await this.runPromptGenerationWithRetries(jobId, pollinationsConfig);
    if (!promptsFinished) {
      return;
    }
    const afterPrompts = await this.repository.getJob(jobId);
    if (isCancelled(afterPrompts)) {
      return;
    }

    await this.runImageGeneration(jobId, pollinationsConfig);
    await this.finalize(jobId);
  }

  private async runPlanning(jobId: string, pollinationsConfig: ResolvedPollinationsConfig) {
    const job = await this.repository.getJob(jobId);
    if (!job || job.status === "cancelled") {
      return;
    }

    await this.repository.updateJob(jobId, (current) => ({
      ...current,
      status: "planning",
      startedAt: current.startedAt ?? new Date().toISOString(),
      events: [...current.events, createEvent("planning", "info", "套图规划开始")]
    }));

    try {
      const result = await this.providers.planningProvider.generatePlan({
        packInput: job.packInput,
        pollinationsConfig
      });
      const planItems = result.images.map(toPlanRecord);
      await this.repository.updateJob(jobId, (current) => ({
        ...current,
        status: "prompt_generating",
        totalImages: planItems.length,
        failedReason: null,
        planItems: replacePlan(current, planItems),
        prompts: planItems.map((item) => ({
          id: randomUUID(),
          imageIndex: item.imageIndex,
          promptStatus: "pending",
          finalPrompt: null,
          shortCaption: null
        })),
        images: planItems.map((item) => ({
          id: randomUUID(),
          imageIndex: item.imageIndex,
          imageStatus: "pending",
          imageUrl: null,
          errorMessage: null,
          provider: null,
          providerModel: null
        })),
        events: [...current.events, createEvent("planning", "info", "套图规划完成")]
      }));
    } catch (error) {
      await this.repository.updateJob(jobId, (current) => ({
        ...current,
        status: "planning_failed",
        failedReason: error instanceof Error ? error.message : "套图规划失败",
        events: [...current.events, createEvent("planning", "error", "套图规划失败")]
      }));
    }
  }

  private async runPromptGenerationWithRetries(
    jobId: string,
    pollinationsConfig: ResolvedPollinationsConfig
  ) {
    for (let attemptIndex = 0; attemptIndex < PROMPT_RETRY_DELAYS_MS.length; attemptIndex += 1) {
      const round = attemptIndex + 1;
      const beforeAttempt = await this.repository.getJob(jobId);
      if (!beforeAttempt || beforeAttempt.status === "cancelled") {
        return false;
      }
      if (unresolvedPromptCount(beforeAttempt) === 0) {
        return true;
      }

      if (attemptIndex > 0) {
        await this.repository.updateJob(jobId, (current) => ({
          ...current,
          events: [
            ...current.events,
            createEvent("prompt_generation", "info", promptRetryStartMessage(round))
          ]
        }));
        await waitForRetryDelay(PROMPT_RETRY_DELAYS_MS[attemptIndex]);
      }

      const remaining = await this.runPromptGenerationAttempt(jobId, pollinationsConfig);
      if (remaining === null || remaining === 0) {
        return remaining === 0;
      }

      if (attemptIndex === PROMPT_RETRY_DELAYS_MS.length - 1) {
        await this.repository.updateJob(jobId, (current) => ({
          ...current,
          events: [
            ...current.events,
            createEvent("prompt_generation", "error", promptRetryExhaustedMessage(remaining))
          ]
        }));
        return true;
      }

      await this.repository.updateJob(jobId, (current) => ({
        ...current,
        events: [
          ...current.events,
          createEvent("prompt_generation", "info", promptRetryEndMessage(round, remaining))
        ]
      }));
    }

    return true;
  }

  private async runPromptGenerationAttempt(
    jobId: string,
    pollinationsConfig: ResolvedPollinationsConfig
  ) {
    const job = await this.repository.getJob(jobId);
    if (!job || job.status === "cancelled") {
      return null;
    }

    for (const planItem of job.planItems) {
      const currentJob = await this.repository.getJob(jobId);
      if (!currentJob || currentJob.status === "cancelled") {
        return null;
      }
      const currentPrompt = currentJob.prompts.find((item) => item.imageIndex === planItem.imageIndex);
      if (currentPrompt?.promptStatus === "ready") {
        continue;
      }
      try {
        const prompt = await this.providers.promptProvider.generatePrompt({
          packInput: currentJob.packInput,
          planItem: toProviderPlanItem(planItem),
          pollinationsConfig
        });
        const promptRecord: ImageSetPromptRecord = {
          id: currentPrompt?.id ?? randomUUID(),
          imageIndex: planItem.imageIndex,
          promptStatus: "ready",
          finalPrompt: prompt.final_prompt,
          shortCaption: prompt.short_caption
        };
        await this.repository.updateJob(jobId, (current) => ({
          ...current,
          prompts: upsertPrompt(current, promptRecord)
        }));
      } catch (error) {
        await this.repository.updateJob(jobId, (current) => ({
          ...current,
          prompts: upsertPrompt(current, {
            id: currentPrompt?.id ?? randomUUID(),
            imageIndex: planItem.imageIndex,
            promptStatus: "failed",
            finalPrompt: null,
            shortCaption: null
          }),
          events: [
            ...current.events,
            createEvent(
              "prompt_generation",
              "error",
              error instanceof Error ? error.message : "提示词生成失败"
            )
          ]
        }));
      }
    }

    const afterAttempt = await this.repository.getJob(jobId);
    if (!afterAttempt || afterAttempt.status === "cancelled") {
      return null;
    }

    return unresolvedPromptCount(afterAttempt);
  }

  private async runImageGeneration(jobId: string, pollinationsConfig: ResolvedPollinationsConfig) {
    const job = await this.repository.getJob(jobId);
    if (!job || job.status === "cancelled") {
      return;
    }

    await this.repository.updateJob(jobId, (current) => ({
      ...current,
      status: "image_generating",
      events: [...current.events, createEvent("image_generation", "info", "图片生成开始")]
    }));

    for (const prompt of job.prompts.filter((item) => item.promptStatus === "ready" && item.finalPrompt)) {
      const currentImage = job.images.find((item) => item.imageIndex === prompt.imageIndex);
      if (currentImage?.imageStatus === "ready") {
        continue;
      }
      try {
        const image = await this.providers.imageProvider.generateImage({
          imageIndex: prompt.imageIndex,
          prompt: prompt.finalPrompt ?? "",
          aspectRatio: job.packInput.aspect_ratio,
          pollinationsConfig
        });
        const imageRecord: ImageSetResultImageRecord = {
          id: currentImage?.id ?? randomUUID(),
          imageIndex: prompt.imageIndex,
          imageStatus: "ready",
          imageUrl: image.image_url,
          errorMessage: null,
          provider: image.provider,
          providerModel: image.provider_model
        };
        await this.repository.updateJob(jobId, (current) => ({
          ...current,
          images: upsertImage(current, imageRecord)
        }));
      } catch (error) {
        await this.repository.updateJob(jobId, (current) => ({
          ...current,
          images: upsertImage(current, {
            id: currentImage?.id ?? randomUUID(),
            imageIndex: prompt.imageIndex,
            imageStatus: "failed",
            imageUrl: null,
            errorMessage: error instanceof Error ? error.message : "图片生成失败",
            provider: null,
            providerModel: pollinationsConfig.imageModel
          }),
          events: [
            ...current.events,
            createEvent(
              "image_generation",
              "error",
              error instanceof Error ? error.message : "图片生成失败"
            )
          ]
        }));
      }
    }
  }

  private async finalize(jobId: string) {
    await this.repository.updateJob(jobId, (current) => {
      if (current.status === "cancelled") {
        return current;
      }
      const successImages = countReady(current.images, "imageStatus");
      const failedImages = new Set<number>();
      current.prompts.filter((item) => item.promptStatus === "failed").forEach((item) => failedImages.add(item.imageIndex));
      current.images.filter((item) => item.imageStatus === "failed").forEach((item) => failedImages.add(item.imageIndex));

      let status = current.status;
      if (successImages === current.totalImages && current.totalImages > 0) {
        status = "completed";
      } else if (successImages > 0 && successImages + failedImages.size >= current.totalImages) {
        status = "partial_completed";
      } else if (failedImages.size >= current.totalImages && current.totalImages > 0) {
        status = "failed";
      } else if (countFailed(current.prompts, "promptStatus") > 0) {
        status = "prompt_partial_failed";
      }

      return {
        ...current,
        status,
        successImages,
        failedImages: failedImages.size,
        finishedAt: FINAL_JOB_STATUSES.includes(status as (typeof FINAL_JOB_STATUSES)[number])
          ? new Date().toISOString()
          : current.finishedAt
      };
    });
  }
}
