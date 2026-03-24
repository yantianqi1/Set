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

function createProviders() {
  return {
    planningProvider: {
      generatePlan: vi.fn(async (input) => ({
        images: Array.from({ length: input.packInput.image_count }, (_, index) => ({
          image_index: index + 1,
          title: `场景 ${index + 1}`,
          purpose: `第 ${index + 1} 张`,
          shot_type: "full body",
          camera_angle: "eye level",
          pose: "standing",
          expression: "calm",
          outfit_variant: `look-${index + 1}`,
          background: "beach",
          lighting: "soft daylight",
          composition_focus: "subject",
          consistency_anchor: input.packInput.character_profile,
          variation_point: `variation-${index + 1}`,
          detailed_intent: `intent-${index + 1}`
        }))
      }))
    },
    promptProvider: {
      generatePrompt: vi.fn(async (input) => ({
        image_index: input.planItem.image_index,
        final_prompt: `prompt for ${input.planItem.title}`,
        short_caption: input.planItem.title,
        style_tags: [input.packInput.style_preset],
        consistency_summary: input.planItem.consistency_anchor
      }))
    },
    imageProvider: {
      generateImage: vi.fn(async (input) => ({
        image_index: input.imageIndex,
        image_url: `https://images.example.com/${input.imageIndex}.png`,
        provider: "pollinations",
        provider_model: input.pollinationsConfig.imageModel,
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

function createPayload() {
  return {
    pack_input: {
      theme: "海边泳装写真",
      character_profile: "黑长发，蓝色眼睛，清冷气质，年轻成年女性",
      image_count: 2,
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
        image_model: "flux-pro"
      }
    }
  };
}

describe("image set api", () => {
  let repository: ImageSetRepository;

  beforeEach(() => {
    repository = createInMemoryImageSetRepository();
  });

  it("returns runtime defaults without leaking api keys", async () => {
    const app = buildServer({
      config: createConfig(),
      repository,
      providers: createProviders(),
      startScheduler: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/runtime-defaults"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      pollinations: {
        base_url: "https://gen.pollinations.ai",
        default_planning_model: "openai",
        default_prompt_model: "openai-fast",
        default_image_model: "flux",
        requires_api_key: true
      }
    });
  });

  it("rejects create requests without a pollinations api key", async () => {
    const app = buildServer({
      config: createConfig(),
      repository,
      providers: createProviders(),
      startScheduler: false
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-a"
      },
      payload: {
        pack_input: createPayload().pack_input,
        provider_overrides: {
          pollinations: {
            planning_model: "openai",
            prompt_model: "openai-fast",
            image_model: "flux"
          }
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Pollinations api_key is required"
    });
  });

  it("isolates history and detail by client token hash", async () => {
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

    expect(createResponse.statusCode).toBe(201);
    const jobId = createResponse.json().job.id as string;

    const ownList = await app.inject({
      method: "GET",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-a"
      }
    });
    expect(ownList.json().items).toHaveLength(1);

    const foreignList = await app.inject({
      method: "GET",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-b"
      }
    });
    expect(foreignList.json().items).toHaveLength(0);

    const foreignDetail = await app.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}`,
      headers: {
        "x-client-token": "browser-b"
      }
    });
    expect(foreignDetail.statusCode).toBe(404);
  });

  it("processes a job through planning, prompts, and images", async () => {
    const providers = createProviders();
    const app = buildServer({
      config: createConfig(),
      repository,
      providers,
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

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json()).toMatchObject({
      job: {
        id: jobId,
        status: "completed",
        total_images: 2,
        success_images: 2,
        failed_images: 0
      }
    });
    expect(detailResponse.json().plan_items).toHaveLength(2);
    expect(detailResponse.json().prompts).toHaveLength(2);
    expect(detailResponse.json().images).toHaveLength(2);
    expect(detailResponse.json().events.length).toBeGreaterThan(0);
    expect(providers.planningProvider.generatePlan).toHaveBeenCalledTimes(1);
    expect(providers.promptProvider.generatePrompt).toHaveBeenCalledTimes(2);
    expect(providers.imageProvider.generateImage).toHaveBeenCalledTimes(2);
    expect(providers.imageProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        pollinationsConfig: expect.objectContaining({
          imageModel: "flux-pro"
        })
      })
    );
  });

  it("serves owned images through a local proxy endpoint", async () => {
    const providers = createProviders();
    const app = buildServer({
      config: createConfig(),
      repository,
      providers,
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

    const imageResponse = await app.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}/images/1/content`,
      headers: {
        "x-client-token": "browser-a"
      }
    });

    expect(imageResponse.statusCode).toBe(200);
    expect(imageResponse.headers["content-type"]).toContain("image/png");
    expect(imageResponse.body).toBe("png-bytes");
    expect(providers.imageProvider.fetchImage).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://images.example.com/1.png",
        pollinationsConfig: expect.objectContaining({
          apiKey: "pollinations-secret"
        })
      })
    );
  });

  it("accepts the client token from cookies for image proxy requests", async () => {
    const providers = createProviders();
    const app = buildServer({
      config: createConfig(),
      repository,
      providers,
      startScheduler: false
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/image-set-jobs",
      headers: {
        "x-client-token": "browser-cookie"
      },
      payload: createPayload()
    });
    const jobId = createResponse.json().job.id as string;

    await app.imageSetScheduler.runJob(jobId);

    const imageResponse = await app.inject({
      method: "GET",
      url: `/api/image-set-jobs/${jobId}/images/1/content`,
      headers: {
        cookie: "image-set-client-token=browser-cookie"
      }
    });

    expect(imageResponse.statusCode).toBe(200);
    expect(imageResponse.body).toBe("png-bytes");
  });
});
