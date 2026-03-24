import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import Fastify from "fastify";
import {
  createImageSetJobSchema,
  runtimeDefaultsSchema
} from "@image-set-studio/shared";
import { loadConfig, type AppConfig } from "./config.js";
import { encryptJson, hashClientToken } from "./lib/crypto.js";
import { requireClientToken } from "./lib/request-auth.js";
import { resolveJobRuntimeConfig, runtimeDefaultsFromConfig } from "./modules/config-resolution.js";
import { createDefaultProviders } from "./modules/default-providers.js";
import { replyWithOwnedImageContent } from "./modules/image-proxy.js";
import { type ProviderRegistry } from "./modules/providers.js";
import { createRepositoryBinding } from "./modules/repository-binding.js";
import {
  createEvent,
  type ImageSetRepository,
  upsertImage,
  upsertPrompt
} from "./modules/repository.js";
import { ImageSetScheduler } from "./modules/scheduler.js";

declare module "fastify" {
  interface FastifyInstance {
    imageSetScheduler: ImageSetScheduler;
  }
}

function serializeJob(job: Awaited<ReturnType<ImageSetRepository["getJob"]>>) {
  if (!job) {
    return null;
  }
  const previewImageUrl =
    job.images.find((item) => item.imageStatus === "ready" && item.imageUrl)?.imageUrl ?? null;
  return {
    id: job.id,
    status: job.status,
    theme: job.packInput.theme,
    image_count: job.packInput.image_count,
    style_preset: job.packInput.style_preset,
    aspect_ratio: job.packInput.aspect_ratio,
    variation_strategy: job.packInput.variation_strategy,
    total_images: job.totalImages,
    success_images: job.successImages,
    failed_images: job.failedImages,
    preview_image_url: previewImageUrl,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
    started_at: job.startedAt,
    finished_at: job.finishedAt
  };
}

export function buildServer(options: {
  config?: Partial<AppConfig>;
  repository?: ImageSetRepository;
  providers?: ProviderRegistry;
  startScheduler?: boolean;
} = {}) {
  const config = loadConfig(options.config);
  const repositoryBinding = createRepositoryBinding({
    environment: process.env.NODE_ENV,
    repository: options.repository
  });
  const repository = repositoryBinding.repository;
  const providers = options.providers ?? createDefaultProviders();
  const scheduler = new ImageSetScheduler(repository, providers, config);
  const app = Fastify();

  void app.register(cors, {
    origin: true
  });
  void app.register(async (instance) => {
    instance.addHook("onRequest", async (_, reply) => {
      reply.header("Vary", "Origin, Cookie");
    });
  });
  app.decorate("imageSetScheduler", scheduler);

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/runtime-defaults", async () => {
    return runtimeDefaultsSchema.parse(runtimeDefaultsFromConfig(config));
  });

  app.post("/api/image-set-jobs", async (request, reply) => {
    const clientToken = requireClientToken(request.headers);
    const parsed = createImageSetJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid payload" });
    }

    try {
      const resolved = resolveJobRuntimeConfig(config, parsed.data.provider_overrides ?? {});
      const job = await repository.createJob({
        ownerTokenHash: hashClientToken(clientToken),
        packInput: parsed.data.pack_input,
        resolvedPollinationsConfigEncrypted: encryptJson(config.encryptionKey, resolved)
      });
      await repository.updateJob(job.id, (current) => ({
        ...current,
        events: [...current.events, createEvent("job", "info", "任务已创建")]
      }));
      return reply.code(201).send({ job: serializeJob(await repository.getJob(job.id)) });
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid config" });
    }
  });

  app.get("/api/image-set-jobs", async (request) => {
    const clientToken = requireClientToken(request.headers);
    const page = Math.max(Number((request.query as { page?: string }).page ?? "1") || 1, 1);
    const pageSize = 20;
    const result = await repository.listJobsByOwnerHash(hashClientToken(clientToken), page, pageSize);
    return {
      items: result.items.map((item) => serializeJob(item)),
      pagination: {
        page,
        page_size: pageSize,
        total: result.total
      }
    };
  });

  app.get("/api/image-set-jobs/:id", async (request, reply) => {
    const clientToken = requireClientToken(request.headers);
    const job = await repository.getJobOwnedByHash(
      hashClientToken(clientToken),
      (request.params as { id: string }).id
    );
    if (!job) {
      return reply.code(404).send({ error: "Not found" });
    }

    const detail = {
      job: serializeJob(job),
      job_input: job.packInput,
      plan_items: job.planItems.map((item) => ({
        id: item.id,
        image_index: item.imageIndex,
        title: item.title,
        purpose: item.purpose
      })),
      prompts: job.prompts.map((item) => ({
        id: item.id,
        image_index: item.imageIndex,
        prompt_status: item.promptStatus,
        final_prompt: item.finalPrompt,
        short_caption: item.shortCaption
      })),
      images: job.images.map((item) => ({
        id: item.id,
        image_index: item.imageIndex,
        image_status: item.imageStatus,
        image_url: item.imageUrl,
        error_message: item.errorMessage
      })),
      events: job.events.map((item) => ({
        id: item.id,
        stage: item.stage,
        level: item.level,
        message: item.message,
        created_at: item.createdAt
      }))
    };
    return detail;
  });

  app.get("/api/image-set-jobs/:id/images/:imageIndex/content", async (request, reply) => {
    const clientToken = requireClientToken(request.headers);
    const params = request.params as { id: string; imageIndex: string };
    return replyWithOwnedImageContent({
      clientToken,
      jobId: params.id,
      imageIndex: Number(params.imageIndex),
      repository,
      providers,
      config,
      reply
    });
  });

  app.post("/api/image-set-jobs/:id/retry-failed", async (request, reply) => {
    const clientToken = requireClientToken(request.headers);
    const jobId = (request.params as { id: string }).id;
    const job = await repository.getJobOwnedByHash(hashClientToken(clientToken), jobId);
    if (!job) {
      return reply.code(404).send({ error: "Not found" });
    }

    await repository.updateJob(jobId, (current) => ({
      ...current,
      status: current.status === "planning_failed" ? "pending" : "prompt_generating",
      failedReason: null,
      finishedAt: null,
      prompts: current.prompts.map((item) =>
        item.promptStatus === "failed"
          ? { ...item, promptStatus: "pending", finalPrompt: null, shortCaption: null }
          : item
      ),
      images: current.images.map((item) =>
        item.imageStatus === "failed"
          ? { ...item, imageStatus: "pending", imageUrl: null, errorMessage: null }
          : item
      ),
      events: [...current.events, createEvent("retry", "info", "失败项已重新加入队列")]
    }));
    void scheduler.runJob(jobId);
    return reply.code(202).send({ accepted: true });
  });

  app.post("/api/image-set-jobs/:id/images/:imageIndex/retry", async (request, reply) => {
    const clientToken = requireClientToken(request.headers);
    const params = request.params as { id: string; imageIndex: string };
    const imageIndex = Number(params.imageIndex);
    const job = await repository.getJobOwnedByHash(hashClientToken(clientToken), params.id);
    if (!job) {
      return reply.code(404).send({ error: "Not found" });
    }

    await repository.updateJob(job.id, (current) => ({
      ...current,
      status: "prompt_generating",
      finishedAt: null,
      prompts: upsertPrompt(current, {
        ...(current.prompts.find((item) => item.imageIndex === imageIndex) ?? {
          id: randomUUID(),
          imageIndex
        }),
        promptStatus: "pending",
        finalPrompt: null,
        shortCaption: null
      }),
      images: upsertImage(current, {
        ...(current.images.find((item) => item.imageIndex === imageIndex) ?? {
          id: randomUUID(),
          imageIndex
        }),
        imageStatus: "pending",
        imageUrl: null,
        errorMessage: null,
        provider: null,
        providerModel: null
      }),
      events: [...current.events, createEvent("retry", "info", `第 ${imageIndex} 张重新加入队列`)]
    }));
    void scheduler.runJob(job.id);
    return reply.code(202).send({ accepted: true });
  });

  app.post("/api/image-set-jobs/:id/cancel", async (request, reply) => {
    const clientToken = requireClientToken(request.headers);
    const jobId = (request.params as { id: string }).id;
    const job = await repository.getJobOwnedByHash(hashClientToken(clientToken), jobId);
    if (!job) {
      return reply.code(404).send({ error: "Not found" });
    }
    await repository.updateJob(jobId, (current) => ({
      ...current,
      status: "cancelled",
      finishedAt: new Date().toISOString(),
      events: [...current.events, createEvent("job", "info", "任务已取消")]
    }));
    return reply.code(202).send({ accepted: true });
  });

  const shouldStartScheduler = options.startScheduler ?? process.env.NODE_ENV !== "test";
  app.addHook("onReady", async () => {
    if (shouldStartScheduler) {
      scheduler.start();
    }
  });
  app.addHook("onClose", async () => {
    scheduler.stop();
    if (repositoryBinding.dispose) {
      await repositoryBinding.dispose();
    }
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 4000);
  void app.listen({ port, host: "0.0.0.0" });
}
