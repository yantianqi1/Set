"use client";

import type { RuntimeDefaults } from "@image-set-studio/shared";
import { FormEvent, useEffect, useState } from "react";

import { useI18n } from "@/i18n/use-i18n";
import {
  compactRuntimeSetting,
  clearRuntimeSetting,
  loadRuntimeSetting,
  saveRuntimeSetting,
  type RuntimeSetting
} from "@/lib/client";
import { fetchRuntimeDefaults } from "@/lib/api";
import { fetchPollinationsModelOptions, type PollinationsModelOption } from "@/lib/pollinations";

const EMPTY_DEFAULTS: RuntimeDefaults = {
  pollinations: {
    base_url: "https://gen.pollinations.ai",
    default_planning_model: null,
    default_prompt_model: null,
    default_image_model: null,
    requires_api_key: true as const
  }
};

function withFallbackSelection(
  current: string | undefined,
  fallback: string | null,
  options: PollinationsModelOption[]
) {
  return current ?? fallback ?? options[0]?.value;
}

export default function SettingsPage() {
  const { t } = useI18n();
  const [draft, setDraft] = useState<RuntimeSetting>({});
  const [defaults, setDefaults] = useState(EMPTY_DEFAULTS);
  const [textModels, setTextModels] = useState<PollinationsModelOption[]>([]);
  const [imageModels, setImageModels] = useState<PollinationsModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = loadRuntimeSetting();
    setDraft(saved);
    fetchRuntimeDefaults()
      .then((response) => {
        setDefaults(response);
        if (saved.pollinations?.api_key) {
          void handleFetchModels(saved.pollinations.api_key, response);
        }
      })
      .catch((error) => {
        setMessage(
          error instanceof Error ? error.message : t.settings.messages.loadDefaultsError
        );
      });
  }, []);

  async function handleFetchModels(apiKey?: string, currentDefaults = defaults) {
    const resolvedApiKey = apiKey?.trim() ?? draft.pollinations?.api_key?.trim();
    if (!resolvedApiKey) {
      setMessage(t.settings.messages.missingApiKey);
      return;
    }

    setLoadingModels(true);
    try {
      const options = await fetchPollinationsModelOptions(resolvedApiKey);
      setTextModels(options.textModels);
      setImageModels(options.imageModels);
      setDraft((previous) => ({
        pollinations: {
          api_key: resolvedApiKey,
          planning_model: withFallbackSelection(
            previous.pollinations?.planning_model,
            currentDefaults.pollinations.default_planning_model,
            options.textModels
          ),
          prompt_model: withFallbackSelection(
            previous.pollinations?.prompt_model,
            currentDefaults.pollinations.default_prompt_model,
            options.textModels
          ),
          image_model: withFallbackSelection(
            previous.pollinations?.image_model,
            currentDefaults.pollinations.default_image_model,
            options.imageModels
          )
        }
      }));
      setMessage(t.settings.messages.modelsUpdated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.settings.messages.fetchModelsFailed);
    } finally {
      setLoadingModels(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = compactRuntimeSetting(draft);
    saveRuntimeSetting(payload);
    setDraft(payload);
    setMessage(t.settings.messages.saved);
  }

  function handleClear() {
    clearRuntimeSetting();
    setDraft({});
    setTextModels([]);
    setImageModels([]);
    setMessage(t.settings.messages.cleared);
  }

  return (
    <section className="page-shell">
      <article className="panel">
        <h1>{t.settings.title}</h1>
        <p className="subtitle">{t.settings.subtitle}</p>
        <form onSubmit={handleSubmit}>
          <label>
            {t.settings.labels.baseUrl}
            <input value={defaults.pollinations.base_url ?? ""} readOnly />
          </label>
          <label>
            {t.settings.labels.apiKey}
            <input
              type="password"
              value={draft.pollinations?.api_key ?? ""}
              onChange={(event) =>
                setDraft((previous) => ({
                  pollinations: {
                    ...previous.pollinations,
                    api_key: event.target.value
                  }
                }))
              }
            />
          </label>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              className="button"
              type="button"
              onClick={() => void handleFetchModels()}
              disabled={loadingModels}
            >
              {loadingModels ? t.settings.actions.fetchingModels : t.settings.actions.fetchModels}
            </button>
            <button className="button" type="submit">
              {t.settings.actions.save}
            </button>
            <button className="button" type="button" onClick={handleClear}>
              {t.settings.actions.clear}
            </button>
          </div>
          <label>
            {t.settings.labels.planningModel}
            <select
              value={draft.pollinations?.planning_model ?? ""}
              onChange={(event) =>
                setDraft((previous) => ({
                  pollinations: {
                    ...previous.pollinations,
                    planning_model: event.target.value
                  }
                }))
              }
            >
              <option value="">
                {defaults.pollinations.default_planning_model ??
                  t.settings.placeholders.fetchModelsFirst}
              </option>
              {textModels.map((item) => (
                <option key={`planning-${item.value}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.settings.labels.promptModel}
            <select
              value={draft.pollinations?.prompt_model ?? ""}
              onChange={(event) =>
                setDraft((previous) => ({
                  pollinations: {
                    ...previous.pollinations,
                    prompt_model: event.target.value
                  }
                }))
              }
            >
              <option value="">
                {defaults.pollinations.default_prompt_model ??
                  t.settings.placeholders.fetchModelsFirst}
              </option>
              {textModels.map((item) => (
                <option key={`prompt-${item.value}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.settings.labels.imageModel}
            <select
              value={draft.pollinations?.image_model ?? ""}
              onChange={(event) =>
                setDraft((previous) => ({
                  pollinations: {
                    ...previous.pollinations,
                    image_model: event.target.value
                  }
                }))
              }
            >
              <option value="">
                {defaults.pollinations.default_image_model ??
                  t.settings.placeholders.fetchModelsFirst}
              </option>
              {imageModels.map((item) => (
                <option key={`image-${item.value}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </form>
        {message ? <p style={{ marginTop: "1rem" }}>{message}</p> : null}
      </article>
    </section>
  );
}
