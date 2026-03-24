import { z } from "zod";
import type { PackInput } from "@image-set-studio/shared";
import type { ProviderRegistry } from "./providers.js";

const PREVIEW_LIMIT = 320;
const ALLOWED_IMAGE_DOWNLOAD_PROTOCOLS = new Set(["http:", "https:"]);

const chatCompletionSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().min(1)
      })
    })
  )
});

const planningOutputSchema = z.object({
  images: z.array(
    z.object({
      image_index: z.number().int().min(1),
      title: z.string().trim().min(1),
      purpose: z.string().trim().min(1),
      shot_type: z.string().trim().min(1),
      camera_angle: z.string().trim().min(1),
      pose: z.string().trim().min(1),
      expression: z.string().trim().min(1),
      outfit_variant: z.string().trim().min(1),
      background: z.string().trim().min(1),
      lighting: z.string().trim().min(1),
      composition_focus: z.string().trim().min(1),
      consistency_anchor: z.string().trim().min(1),
      variation_point: z.string().trim().min(1),
      detailed_intent: z.string().trim().min(1)
    })
  )
});

const promptOutputSchema = z.object({
  final_prompt: z.string().trim().min(1),
  short_caption: z.string().trim().min(1)
});

const imageOutputSchema = z.object({
  data: z.array(
    z.object({
      url: z.string().trim().url()
    })
  )
});

function truncate(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > PREVIEW_LIMIT ? `${normalized.slice(0, PREVIEW_LIMIT)}...` : normalized;
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function buildHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
}

function mapAspectRatioToSize(aspectRatio: string) {
  switch (aspectRatio) {
    case "1:1":
      return "1024x1024";
    case "16:9":
      return "1280x720";
    case "9:16":
      return "720x1280";
    case "3:4":
      return "1024x1365";
    default:
      return "1024x1024";
  }
}

function normalizeImageDownloadUrl(imageUrl: string) {
  try {
    const parsed = new URL(imageUrl);
    if (!ALLOWED_IMAGE_DOWNLOAD_PROTOCOLS.has(parsed.protocol)) {
      throw new Error("unsupported image protocol");
    }
    return parsed.toString();
  } catch {
    throw new Error("Image download url must be an absolute http(s) URL");
  }
}

async function requestJson(url: string, init: RequestInit, label: string, model: string) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${label} failed for model ${model} with status ${response.status}: ${truncate(text)}`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${label} returned non-JSON for model ${model}: ${truncate(text)}`);
  }
}

async function requestBinary(url: string, init: RequestInit, label: string, model: string) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} failed for model ${model} with status ${response.status}: ${truncate(text)}`);
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    cacheControl: response.headers.get("cache-control")
  };
}

function parseCompletionJson<T>(payload: unknown, schema: z.ZodSchema<T>, label: string, model: string) {
  const completion = chatCompletionSchema.safeParse(payload);
  if (!completion.success) {
    throw new Error(`${label} returned an invalid completion envelope for model ${model}`);
  }

  const content = completion.data.choices[0]?.message.content;
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${label} returned an invalid JSON body for model ${model}: ${truncate(content)}`);
  }

  const normalized = schema.safeParse(parsed);
  if (!normalized.success) {
    throw new Error(`${label} returned an invalid schema for model ${model}: ${truncate(content)}`);
  }
  return normalized.data;
}

function planningSystemPrompt(packInput: PackInput) {
  return [
    "You are planning a coherent multi-image image set.",
    "Return JSON only.",
    `Return exactly ${packInput.image_count} items in images[].`,
    "Schema: {\"images\":[{\"image_index\":1,\"title\":\"...\",\"purpose\":\"...\",\"shot_type\":\"...\",\"camera_angle\":\"...\",\"pose\":\"...\",\"expression\":\"...\",\"outfit_variant\":\"...\",\"background\":\"...\",\"lighting\":\"...\",\"composition_focus\":\"...\",\"consistency_anchor\":\"...\",\"variation_point\":\"...\",\"detailed_intent\":\"...\"}]}",
    "Do not output markdown or code fences."
  ].join(" ");
}

function promptSystemPrompt() {
  return [
    "You write a single production-ready Pollinations image prompt.",
    "Return JSON only.",
    "Schema: {\"final_prompt\":\"...\",\"short_caption\":\"...\"}",
    "final_prompt must be a polished English prompt.",
    "short_caption must be short and readable."
  ].join(" ");
}

export function createDefaultProviders(): ProviderRegistry {
  return {
    planningProvider: {
      async generatePlan({ packInput, pollinationsConfig }) {
        const payload = await requestJson(
          joinUrl(pollinationsConfig.baseUrl, "/v1/chat/completions"),
          {
            method: "POST",
            headers: buildHeaders(pollinationsConfig.apiKey),
            body: JSON.stringify({
              model: pollinationsConfig.planningModel,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: planningSystemPrompt(packInput) },
                { role: "user", content: JSON.stringify(packInput) }
              ]
            })
          },
          "Planning request",
          pollinationsConfig.planningModel
        );
        const result = parseCompletionJson(
          payload,
          planningOutputSchema,
          "Planning response",
          pollinationsConfig.planningModel
        );
        if (result.images.length !== packInput.image_count) {
          throw new Error(
            `Planning response returned ${result.images.length} images for model ${pollinationsConfig.planningModel}, expected ${packInput.image_count}`
          );
        }
        return result;
      }
    },
    promptProvider: {
      async generatePrompt({ planItem, packInput, pollinationsConfig }) {
        const payload = await requestJson(
          joinUrl(pollinationsConfig.baseUrl, "/v1/chat/completions"),
          {
            method: "POST",
            headers: buildHeaders(pollinationsConfig.apiKey),
            body: JSON.stringify({
              model: pollinationsConfig.promptModel,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: promptSystemPrompt() },
                {
                  role: "user",
                  content: JSON.stringify({
                    pack_input: packInput,
                    plan_item: planItem
                  })
                }
              ]
            })
          },
          "Prompt request",
          pollinationsConfig.promptModel
        );
        const prompt = parseCompletionJson(
          payload,
          promptOutputSchema,
          "Prompt response",
          pollinationsConfig.promptModel
        );
        return {
          image_index: planItem.image_index,
          final_prompt: prompt.final_prompt,
          short_caption: prompt.short_caption,
          style_tags: [packInput.style_preset],
          consistency_summary: planItem.consistency_anchor
        };
      }
    },
    imageProvider: {
      async generateImage({ imageIndex, prompt, aspectRatio, pollinationsConfig }) {
        const payload = await requestJson(
          joinUrl(pollinationsConfig.baseUrl, "/v1/images/generations"),
          {
            method: "POST",
            headers: buildHeaders(pollinationsConfig.apiKey),
            body: JSON.stringify({
              model: pollinationsConfig.imageModel,
              prompt,
              size: mapAspectRatioToSize(aspectRatio),
              response_format: "url"
            })
          },
          "Image request",
          pollinationsConfig.imageModel
        );
        const parsed = imageOutputSchema.safeParse(payload);
        if (!parsed.success || !parsed.data.data[0]?.url) {
          throw new Error(
            `Image response invalid for model ${pollinationsConfig.imageModel}: ${truncate(JSON.stringify(payload))}`
          );
        }
        const image = parsed.data.data[0];
        return {
          image_index: imageIndex,
          image_url: image.url,
          provider: "pollinations",
          provider_model: pollinationsConfig.imageModel,
          response_payload: JSON.stringify(payload)
        };
      },
      async fetchImage({ imageUrl, pollinationsConfig }) {
        return requestBinary(
          normalizeImageDownloadUrl(imageUrl),
          {},
          "Image download",
          pollinationsConfig.imageModel
        );
      }
    }
  };
}
