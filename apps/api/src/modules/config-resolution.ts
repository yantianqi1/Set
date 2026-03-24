import type { ProviderOverrides, RuntimeDefaults } from "@image-set-studio/shared";
import { runtimeDefaultsSchema } from "@image-set-studio/shared";
import type { AppConfig } from "../config.js";
import type { ResolvedPollinationsConfig } from "./domain.js";

function requiredString(value: string | null | undefined, field: string) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

export function runtimeDefaultsFromConfig(config: AppConfig): RuntimeDefaults {
  return runtimeDefaultsSchema.parse({
    pollinations: {
      base_url: config.pollinationsDefaults.baseUrl,
      default_planning_model: config.pollinationsDefaults.planningModel,
      default_prompt_model: config.pollinationsDefaults.promptModel,
      default_image_model: config.pollinationsDefaults.imageModel,
      requires_api_key: true
    }
  });
}

export function resolveJobRuntimeConfig(
  config: AppConfig,
  overrides: ProviderOverrides
): ResolvedPollinationsConfig {
  return {
    baseUrl: config.pollinationsDefaults.baseUrl,
    apiKey: requiredString(overrides.pollinations?.api_key, "Pollinations api_key"),
    planningModel: requiredString(
      overrides.pollinations?.planning_model ?? config.pollinationsDefaults.planningModel,
      "Pollinations planning_model"
    ),
    promptModel: requiredString(
      overrides.pollinations?.prompt_model ?? config.pollinationsDefaults.promptModel,
      "Pollinations prompt_model"
    ),
    imageModel: requiredString(
      overrides.pollinations?.image_model ?? config.pollinationsDefaults.imageModel,
      "Pollinations image_model"
    )
  };
}
