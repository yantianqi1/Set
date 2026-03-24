import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "../src/index";
import {
  createInMemoryImageSetRepository,
  type ImageSetRepository
} from "../src/modules/repository";

function createConfig() {
  return {
    encryptionKey: "12345678901234567890123456789012",
    schedulerPollMs: 10,
    promptGenerationConcurrency: 2,
    imageGenerationConcurrency: 2,
    pollinationsDefaults: {
      baseUrl: "https://gen.pollinations.ai",
      planningModel: "openai",
      promptModel: "openai-fast",
      imageModel: "flux"
    }
  };
}

function createPayload() {
  return {
    pack_input: {
      theme: "海边泳装写真",
      character_profile: "黑长发，蓝色眼睛，清冷气质，年轻成年女性",
      image_count: 1,
      style_preset: "写实摄影",
      aspect_ratio: "3:4",
      consistency_level: "high",
      outfit_change_policy: "minor_variation",
      variation_strategy: "stable",
      scene_progression: true,
      custom_requirements: "整体偏夏日清爽、杂志写真感",
      macro_config: "服装和镜头有节奏变化",
      nsfw_enabled: false
    },
    provider_overrides: {
      pollinations: {
        api_key: "pollinations-secret",
        planning_model: "openai-large",
        prompt_model: "openai-fast",
        image_model: "flux-original"
      }
    }
  };
}

function createProviders(options: { promptFailuresBeforeSuccess?: number; alwaysFailPrompt?: boolean } = {}) {
  let promptAttempts = 0;

  return {
    planningProvider: {
      generatePlan: vi.fn(async () => ({
        images: [
          {
            image_index: 1,
            title: "场景 1",
            purpose: "第 1 张",
            shot_type: "full body",
            camera_angle: "eye level",
            pose: "standing",
            expression: "calm",
            outfit_variant: "look-1",
            background: "beach",
            lighting: "soft daylight",
            composition_focus: "subject",
            consistency_anchor: "黑长发，蓝色眼睛，清冷气质，年轻成年女性",
            variation_point: "variation-1",
            detailed_intent: "intent-1"
          }
        ]
      }))
    },
    promptProvider: {
      generatePrompt: vi.fn(async () => {
        promptAttempts += 1;
        if (options.alwaysFailPrompt) {
          throw new Error("prompt upstream failed");
        }
        if ((options.promptFailuresBeforeSuccess ?? 0) >= promptAttempts) {
          throw new Error(`prompt failed attempt ${promptAttempts}`);
        }
        return {
          image_index: 1,
          final_prompt: "prompt for scene 1",
          short_caption: "场景 1",
          style_tags: ["写实摄影"],
          consistency_summary: "黑长发，蓝色眼睛，清冷气质，年轻成年女性"
        };
      })
    },
    imageProvider: {
      generateImage: vi.fn(async () => ({
        image_index: 1,
        image_url: "https://images.example.com/1.png",
        provider: "pollinations",
        provider_model: "flux-original",
        response_payload: JSON.stringify({ ok: true })
      })),
      fetchImage: vi.fn(async () => ({
        body: Buffer.from("png-bytes"),
        contentType: "image/png",
        cacheControl: "public, max-age=60"
      }))
    }
  };
}

async function createJob(app: ReturnType<typeof buildServer>) {
  const createResponse = await app.inject({
    method: "POST",
    url: "/api/image-set-jobs",
    headers: {
      "x-client-token": "browser-a"
    },
    payload: createPayload()
  });
  return createResponse.json().job.id as string;
}

async function runSchedulerWithRetries(app: ReturnType<typeof buildServer>, jobId: string) {
  await app.imageSetScheduler.runJob(jobId);
}

describe("image set scheduler prompt retries", () => {
  let repository: ImageSetRepository;

  beforeEach(() => {
    repository = createInMemoryImageSetRepository();
  });

  it("retries failed prompt generation within a single scheduler run", async () => {
    const providers = createProviders({ promptFailuresBeforeSuccess: 1 });
    const app = buildServer({
      config: createConfig(),
      repository,
      providers,
      startScheduler: false
    });
    const jobId = await createJob(app);

    await runSchedulerWithRetries(app, jobId);

    const detailResponse = await app.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(detailResponse.json().job.status).toBe("completed");
    expect(providers.promptProvider.generatePrompt).toHaveBeenCalledTimes(2);
    await app.close();
  }, 12_000);

  it("stops polling jobs after prompt retries are exhausted", async () => {
    const providers = createProviders({ alwaysFailPrompt: true });
    const app = buildServer({
      config: createConfig(),
      repository,
      providers,
      startScheduler: false
    });
    const jobId = await createJob(app);

    await runSchedulerWithRetries(app, jobId);

    const detail = await repository.getJob(jobId);
    expect(detail?.status).toBe("failed");
    expect(providers.promptProvider.generatePrompt).toHaveBeenCalledTimes(3);
    expect(await repository.listRunnableJobs()).toEqual([]);
    await app.close();
  }, 12_000);

  it("allows retry-failed to recover a job after prompt retries are exhausted", async () => {
    const firstApp = buildServer({
      config: createConfig(),
      repository,
      providers: createProviders({ alwaysFailPrompt: true }),
      startScheduler: false
    });
    const jobId = await createJob(firstApp);

    await runSchedulerWithRetries(firstApp, jobId);
    await firstApp.close();

    const secondApp = buildServer({
      config: createConfig(),
      repository,
      providers: createProviders(),
      startScheduler: false
    });
    const retryResponse = await secondApp.inject({
      method: "POST",
      url: `/api/image-set-jobs/${jobId}/retry-failed`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(retryResponse.statusCode).toBe(202);
    await runSchedulerWithRetries(secondApp, jobId);

    const detailResponse = await secondApp.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(detailResponse.json().job.status).toBe("completed");
    await secondApp.close();
  }, 12_000);
});
