import { describe, expect, it } from "vitest";
import {
  createImageSetJobSchema,
  imageSetJobStatuses,
  providerOverridesSchema,
  runtimeDefaultsSchema
} from "./index";

describe("image set shared schemas", () => {
  it("accepts a valid image set job payload", () => {
    expect(
      createImageSetJobSchema.parse({
        pack_input: {
          theme: "海边泳装写真",
          character_profile: "黑长发，蓝色眼睛，清冷气质，年轻成年女性",
          image_count: 4,
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
            image_model: "flux-dev"
          }
        }
      })
    ).toMatchObject({
      pack_input: {
        theme: "海边泳装写真",
        image_count: 4
      }
    });
  });

  it("rejects an image count outside the supported range", () => {
    expect(() =>
      createImageSetJobSchema.parse({
        pack_input: {
          theme: "test",
          character_profile: "test",
          image_count: 0,
          style_preset: "写实摄影",
          aspect_ratio: "3:4",
          consistency_level: "high",
          outfit_change_policy: "minor_variation",
          variation_strategy: "stable",
          scene_progression: true,
          custom_requirements: "",
          macro_config: "",
          nsfw_enabled: false
        }
      })
    ).toThrow();
  });

  it("accepts partial provider overrides", () => {
    expect(
      providerOverridesSchema.parse({
        pollinations: {
          image_model: "pollinations"
        }
      })
    ).toEqual({
      pollinations: {
        image_model: "pollinations"
      }
    });
  });

  it("accepts runtime defaults without exposing api key content", () => {
    expect(
      runtimeDefaultsSchema.parse({
        pollinations: {
          base_url: "https://gen.pollinations.ai",
          default_planning_model: "openai",
          default_prompt_model: "openai-fast",
          default_image_model: "flux",
          requires_api_key: true
        }
      })
    ).toMatchObject({
      pollinations: {
        base_url: "https://gen.pollinations.ai"
      }
    });
  });

  it("keeps the documented job statuses", () => {
    expect(imageSetJobStatuses).toEqual([
      "pending",
      "planning",
      "planning_failed",
      "prompt_generating",
      "prompt_partial_failed",
      "image_generating",
      "completed",
      "partial_completed",
      "failed",
      "cancelled"
    ]);
  });
});
