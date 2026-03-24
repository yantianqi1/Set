import { z } from "zod";

export const runtimeDefaultsSchema = z
  .object({
    pollinations: z
      .object({
        base_url: z.string().trim().url().nullable(),
        default_planning_model: z.string().trim().min(1).max(200).nullable(),
        default_prompt_model: z.string().trim().min(1).max(200).nullable(),
        default_image_model: z.string().trim().min(1).max(200).nullable(),
        requires_api_key: z.literal(true)
      })
      .strict()
  })
  .strict();

export type RuntimeDefaults = z.infer<typeof runtimeDefaultsSchema>;
