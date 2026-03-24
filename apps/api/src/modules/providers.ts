import type { PackInput } from "@image-set-studio/shared";
import type { ResolvedPollinationsConfig } from "./domain.js";

export interface PlanningResultItem {
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
}

export interface PlanningProvider {
  generatePlan(input: {
    packInput: PackInput;
    pollinationsConfig: ResolvedPollinationsConfig;
  }): Promise<{ images: PlanningResultItem[] }>;
}

export interface PromptProvider {
  generatePrompt(input: {
    packInput: PackInput;
    planItem: PlanningResultItem;
    pollinationsConfig: ResolvedPollinationsConfig;
  }): Promise<{
    image_index: number;
    final_prompt: string;
    short_caption: string;
    style_tags: string[];
    consistency_summary: string;
  }>;
}

export interface ImageProvider {
  generateImage(input: {
    imageIndex: number;
    prompt: string;
    aspectRatio: string;
    pollinationsConfig: ResolvedPollinationsConfig;
  }): Promise<{
    image_index: number;
    image_url: string;
    provider: string;
    provider_model: string;
    response_payload: string | null;
  }>;
  fetchImage(input: {
    imageUrl: string;
    pollinationsConfig: ResolvedPollinationsConfig;
  }): Promise<{
    body: Buffer;
    contentType: string;
    cacheControl: string | null;
  }>;
}

export interface ProviderRegistry {
  planningProvider: PlanningProvider;
  promptProvider: PromptProvider;
  imageProvider: ImageProvider;
}
