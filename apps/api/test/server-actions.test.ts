import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "../src/index";
import {
  createInMemoryImageSetRepository,
  type ImageSetRepository
} from "../src/modules/repository";

function createConfig(imageModel = "flux-default") {
  return {
    encryptionKey: "12345678901234567890123456789012",
    schedulerPollMs: 10,
    promptGenerationConcurrency: 2,
    imageGenerationConcurrency: 2,
    pollinationsDefaults: {
      baseUrl: "https://gen.pollinations.ai",
      planningModel: "openai",
      promptModel: "openai-fast",
      imageModel
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

function createProviders(options: { imageFailure?: boolean; invalidPlan?: boolean } = {}) {
  return {
    planningProvider: {
      generatePlan: vi.fn(async () =>
        options.invalidPlan
          ? ({ prompts: [] } as never)
          : {
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
            }
      )
    },
    promptProvider: {
      generatePrompt: vi.fn(async () => ({
        image_index: 1,
        final_prompt: "prompt for scene 1",
        short_caption: "场景 1",
        style_tags: ["写实摄影"],
        consistency_summary: "黑长发，蓝色眼睛，清冷气质，年轻成年女性"
      }))
    },
    imageProvider: {
      generateImage: vi.fn(async (input) => {
        if (options.imageFailure) {
          throw new Error("upstream failed");
        }
        return {
          image_index: input.imageIndex,
          image_url: `https://images.example.com/${input.imageIndex}.png`,
          provider: "pollinations",
          provider_model: input.pollinationsConfig.imageModel,
          response_payload: JSON.stringify({ ok: true })
        };
      }),
      fetchImage: vi.fn(async () => ({
        body: Buffer.from("png-bytes"),
        contentType: "image/png",
        cacheControl: "public, max-age=60"
      }))
    }
  };
}

describe("image set actions", () => {
  let repository: ImageSetRepository;

  beforeEach(() => {
    repository = createInMemoryImageSetRepository();
  });

  it("reuses the stored snapshot for retry-failed after defaults change", async () => {
    const failingProviders = createProviders({ imageFailure: true });
    const createApp = buildServer({
      config: createConfig("flux-original"),
      repository,
      providers: failingProviders,
      startScheduler: false
    });

    const createResponse = await createApp.inject({
      method: "POST",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-a"
      },
      payload: createPayload()
    });
    const jobId = createResponse.json().job.id as string;

    await createApp.imageSetScheduler.runJob(jobId);

    const succeedingProviders = createProviders();
    const retryApp = buildServer({
      config: createConfig("flux-new-default"),
      repository,
      providers: succeedingProviders,
      startScheduler: false
    });

    const retryResponse = await retryApp.inject({
      method: "POST",
      url: `/api/image-set-jobs/${jobId}/retry-failed`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(retryResponse.statusCode).toBe(202);
    await retryApp.imageSetScheduler.runJob(jobId);

    const detailResponse = await retryApp.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(detailResponse.json().job.status).toBe("completed");
    expect(succeedingProviders.imageProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        pollinationsConfig: expect.objectContaining({
          imageModel: "flux-original"
        })
      })
    );
  });

  it("fails planning explicitly when the provider returns an unexpected shape", async () => {
    const app = buildServer({
      config: createConfig(),
      repository,
      providers: createProviders({ invalidPlan: true }),
      startScheduler: false
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-a"
      },
      payload: createPayload()
    });
    const jobId = createResponse.json().job.id as string;

    await app.imageSetScheduler.runJob(jobId);

    const detailResponse = await app.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(detailResponse.json().job.status).toBe("planning_failed");
    expect(detailResponse.json().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: "planning",
          level: "error"
        })
      ])
    );
  });

  it("returns 404 for foreign retry and cancel actions", async () => {
    const app = buildServer({
      config: createConfig(),
      repository,
      providers: createProviders(),
      startScheduler: false
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-a"
      },
      payload: createPayload()
    });
    const jobId = createResponse.json().job.id as string;

    const retryFailedResponse = await app.inject({
      method: "POST",
      url: `/api/image-set-jobs/${jobId}/retry-failed`,
      headers: {
        "x-client-token": "browser-b"
      }
    });
    const retryImageResponse = await app.inject({
      method: "POST",
      url: `/api/image-set-jobs/${jobId}/images/1/retry`,
      headers: {
        "x-client-token": "browser-b"
      }
    });
    const cancelResponse = await app.inject({
      method: "POST",
      url: `/api/image-set-jobs/${jobId}/cancel`,
      headers: {
        "x-client-token": "browser-b"
      }
    });

    expect(retryFailedResponse.statusCode).toBe(404);
    expect(retryImageResponse.statusCode).toBe(404);
    expect(cancelResponse.statusCode).toBe(404);
  });
});
