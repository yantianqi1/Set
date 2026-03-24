import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  clearStoredLocale,
  loadStoredLocale,
  resolveBrowserLocale,
  resolveInitialLocale,
  saveStoredLocale,
  SUPPORTED_LOCALES
} from "../src/i18n/locale";
import { getHomeDefaults, shouldSyncHomeDefaults } from "../src/i18n/home-defaults";
import { messages } from "../src/i18n/messages";

function collectPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "function") {
    return [prefix];
  }

  if (!value || typeof value !== "object") {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>)
    .flatMap(([key, entry]) => collectPaths(entry, prefix ? `${prefix}.${key}` : key))
    .sort();
}

describe("locale helpers", () => {
  it("resolves supported browser languages", () => {
    expect(resolveBrowserLocale("en-US")).toBe("en");
    expect(resolveBrowserLocale("ja-JP")).toBe("ja");
    expect(resolveBrowserLocale("zh-TW")).toBe("zh-TW");
    expect(resolveBrowserLocale("zh-HK")).toBe("zh-TW");
    expect(resolveBrowserLocale("fr-FR")).toBe(DEFAULT_LOCALE);
  });

  it("prefers saved locale over browser locale", () => {
    expect(resolveInitialLocale("ja", "en-US")).toBe("ja");
    expect(resolveInitialLocale(null, "en-US")).toBe("en");
  });

  it("persists locale in localStorage", () => {
    clearStoredLocale();
    expect(loadStoredLocale()).toBeNull();
    saveStoredLocale("zh-TW");
    expect(loadStoredLocale()).toBe("zh-TW");
    clearStoredLocale();
    expect(loadStoredLocale()).toBeNull();
  });
});

describe("message dictionaries", () => {
  it("keeps identical message keys across all locales", () => {
    const baseline = collectPaths(messages[DEFAULT_LOCALE]);

    for (const locale of SUPPORTED_LOCALES) {
      expect(collectPaths(messages[locale])).toEqual(baseline);
    }
  });
});

describe("localized home defaults", () => {
  it("provides a complete default form for every locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const defaults = getHomeDefaults(locale);
      expect(defaults.theme).toBeTruthy();
      expect(defaults.character_profile).toBeTruthy();
      expect(defaults.style_preset).toBeTruthy();
      expect(defaults.aspect_ratio).toBeTruthy();
      expect(defaults.consistency_level).toBeTruthy();
      expect(defaults.outfit_change_policy).toBeTruthy();
      expect(defaults.macro_config).toBeTruthy();
      expect(typeof defaults.scene_progression).toBe("boolean");
      expect(typeof defaults.nsfw_enabled).toBe("boolean");
      expect(defaults.image_count).toBeGreaterThan(0);
    }
  });

  it("only syncs localized defaults when the current form is still pristine", () => {
    const pristine = getHomeDefaults("zh-CN");
    const edited = { ...pristine, theme: "自定义主题" };

    expect(shouldSyncHomeDefaults(pristine, "zh-CN", "en")).toBe(true);
    expect(shouldSyncHomeDefaults(edited, "zh-CN", "en")).toBe(false);
    expect(shouldSyncHomeDefaults(pristine, "zh-CN", "zh-CN")).toBe(false);
  });
});
