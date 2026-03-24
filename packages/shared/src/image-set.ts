import { z } from "zod";

export const imageSetJobStatuses = [
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
] as const;

export type ImageSetJobStatus = (typeof imageSetJobStatuses)[number];

export const packInputSchema = z.object({
  theme: z.string().trim().min(1).max(120),
  character_profile: z.string().trim().min(1).max(4_000),
  image_count: z.number().int().min(1).max(12),
  style_preset: z.string().trim().min(1).max(80),
  aspect_ratio: z.enum(["1:1", "3:4", "9:16", "16:9"]),
  consistency_level: z.enum(["low", "medium", "high"]),
  outfit_change_policy: z.enum(["fixed", "minor_variation", "major_variation"]),
  variation_strategy: z.enum(["stable", "exploratory"]).default("stable"),
  scene_progression: z.boolean(),
  custom_requirements: z.string().trim().max(2_000).default(""),
  macro_config: z.string().trim().max(3_000).default(""),
  nsfw_enabled: z.boolean().default(false)
});

const pollinationsOverridesSchema = z
  .object({
    api_key: z.string().trim().min(1).max(5_000).optional(),
    planning_model: z.string().trim().min(1).max(200).optional(),
    prompt_model: z.string().trim().min(1).max(200).optional(),
    image_model: z.string().trim().min(1).max(200).optional()
  })
  .strict();

export const providerOverridesSchema = z
  .object({
    pollinations: pollinationsOverridesSchema.optional()
  })
  .strict()
  .optional()
  .transform((value) => value ?? {});

export const createImageSetJobSchema = z.object({
  pack_input: packInputSchema,
  provider_overrides: providerOverridesSchema
});

export type PackInput = z.infer<typeof packInputSchema>;
export type ProviderOverrides = z.infer<typeof providerOverridesSchema>;
export type CreateImageSetJobInput = z.infer<typeof createImageSetJobSchema>;
