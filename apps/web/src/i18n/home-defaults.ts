import type { PackInput } from "@image-set-studio/shared";

import type { LocaleCode } from "./locale";

const STYLE_PRESET_OPTIONS: Record<LocaleCode, readonly string[]> = {
  en: ["Realistic Photography", "Anime", "Stylized Illustration", "Portrait Editorial"],
  "zh-CN": ["写实摄影", "动漫", "风格插画", "人像写真"],
  "zh-TW": ["寫實攝影", "動漫", "風格插畫", "人像寫真"],
  ja: ["リアル写真", "アニメ", "スタイライズイラスト", "ポートレート作品"]
};

const HOME_DEFAULTS: Record<LocaleCode, PackInput> = {
  en: {
    theme: "Inspiration: Sunset Seaside Editorial",
    character_profile:
      "A woman with long black hair, wearing a light blue dress, calm expression, cinematic portrait details...",
    image_count: 6,
    style_preset: STYLE_PRESET_OPTIONS.en[0],
    aspect_ratio: "3:4",
    consistency_level: "high",
    outfit_change_policy: "minor_variation",
    variation_strategy: "stable",
    scene_progression: true,
    custom_requirements: "Keep a cinematic atmosphere with a warm sunset beach background.",
    macro_config: "Start with a full-body frame, mix in medium shots, end with a close-up.",
    nsfw_enabled: false
  },
  "zh-CN": {
    theme: "灵感：夏日海边写真",
    character_profile: "一个留着黑长发的女孩，穿着浅蓝色裙子，眼神清冷，带一点电影感...",
    image_count: 6,
    style_preset: STYLE_PRESET_OPTIONS["zh-CN"][0],
    aspect_ratio: "3:4",
    consistency_level: "high",
    outfit_change_policy: "minor_variation",
    variation_strategy: "stable",
    scene_progression: true,
    custom_requirements: "希望有电影感，背景是黄昏的海边。",
    macro_config: "第一张全身，中间穿插近景，最后一张特写。",
    nsfw_enabled: false
  },
  "zh-TW": {
    theme: "靈感：夏日海邊寫真",
    character_profile: "一位留著黑長髮的女孩，穿著淺藍色洋裝，眼神清冷，帶一點電影感...",
    image_count: 6,
    style_preset: STYLE_PRESET_OPTIONS["zh-TW"][0],
    aspect_ratio: "3:4",
    consistency_level: "high",
    outfit_change_policy: "minor_variation",
    variation_strategy: "stable",
    scene_progression: true,
    custom_requirements: "希望帶有電影感，背景是黃昏的海邊。",
    macro_config: "第一張全身，中間穿插近景，最後一張特寫。",
    nsfw_enabled: false
  },
  ja: {
    theme: "着想: 夕暮れの海辺ポートレート",
    character_profile:
      "黒く長い髪の女性。淡いブルーのドレスをまとい、静かな眼差しで、映画のような空気感がある...",
    image_count: 6,
    style_preset: STYLE_PRESET_OPTIONS.ja[0],
    aspect_ratio: "3:4",
    consistency_level: "high",
    outfit_change_policy: "minor_variation",
    variation_strategy: "stable",
    scene_progression: true,
    custom_requirements: "夕暮れの海辺を背景に、シネマティックな雰囲気を出したい。",
    macro_config: "最初は全身、途中に中景を入れ、最後はクローズアップで締める。",
    nsfw_enabled: false
  }
};

const PACK_INPUT_KEYS = [
  "theme",
  "character_profile",
  "image_count",
  "style_preset",
  "aspect_ratio",
  "consistency_level",
  "outfit_change_policy",
  "variation_strategy",
  "scene_progression",
  "custom_requirements",
  "macro_config",
  "nsfw_enabled"
] as const satisfies readonly (keyof PackInput)[];

function isSamePackInput(left: PackInput, right: PackInput) {
  return PACK_INPUT_KEYS.every((key) => left[key] === right[key]);
}

export function getHomeDefaults(locale: LocaleCode): PackInput {
  return { ...HOME_DEFAULTS[locale] };
}

export function getStylePresetOptions(locale: LocaleCode, currentValue?: string) {
  const options = [...STYLE_PRESET_OPTIONS[locale]];

  if (currentValue && !options.includes(currentValue)) {
    options.unshift(currentValue);
  }

  return options;
}

export function shouldSyncHomeDefaults(
  form: PackInput,
  previousLocale: LocaleCode,
  nextLocale: LocaleCode
) {
  if (previousLocale === nextLocale) {
    return false;
  }

  return isSamePackInput(form, HOME_DEFAULTS[previousLocale]);
}
