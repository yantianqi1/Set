"use client";

import type { PackInput } from "@image-set-studio/shared";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { getHomeDefaults, getStylePresetOptions, shouldSyncHomeDefaults } from "@/i18n/home-defaults";
import { useI18n } from "@/i18n/use-i18n";
import { createImageSetJob } from "@/lib/api";
import { loadRuntimeSetting } from "@/lib/client";

const ASPECT_RATIO_OPTIONS = ["1:1", "3:4", "9:16", "16:9"] as const;
const CONSISTENCY_OPTIONS = ["low", "medium", "high"] as const;
const OUTFIT_OPTIONS = ["fixed", "minor_variation", "major_variation"] as const;

type FormValue = PackInput[keyof PackInput];

export default function HomePage() {
  const { locale, t } = useI18n();
  const [form, setForm] = useState<PackInput>(() => getHomeDefaults(locale));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const previousLocaleRef = useRef(locale);

  useEffect(() => {
    setHasApiKey(Boolean(loadRuntimeSetting().pollinations?.api_key));
  }, []);

  useEffect(() => {
    const previousLocale = previousLocaleRef.current;
    if (shouldSyncHomeDefaults(form, previousLocale, locale)) {
      setForm(getHomeDefaults(locale));
    }
    previousLocaleRef.current = locale;
  }, [form, locale]);

  const handleChange = (field: keyof PackInput, value: FormValue) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { job } = await createImageSetJob({
        pack_input: form
      });
      setJobId(job.id);
      setMessage(t.home.messages.success);
    } catch (error) {
      setMessage(
        t.home.messages.error(error instanceof Error ? error.message : t.common.unknownError)
      );
    } finally {
      setLoading(false);
    }
  };

  const stylePresetOptions = getStylePresetOptions(locale, form.style_preset);

  return (
    <section className="page-shell">
      <div className="panel" style={{ transform: 'rotate(-0.5deg)' }}>
        <h1 style={{ transform: 'rotate(1deg)' }}>{t.home.title}</h1>
        <p className="subtitle">{t.home.subtitle}</p>
        
        <form onSubmit={handleSubmit}>
          {/* 基本信息 - 黄便签风格 */}
          <div style={{ background: 'var(--sticky-yellow)', padding: '2rem', border: '2px solid var(--ink)', borderRadius: '2px', marginBottom: '1rem', transform: 'rotate(0.5deg)' }}>
            <div className="form-group">
              <label>📒 {t.home.labels.theme}</label>
              <input 
                placeholder={t.home.placeholders.theme}
                value={form.theme} 
                onChange={(event) => handleChange("theme", event.target.value)} 
                style={{ background: 'white' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>👩 {t.home.labels.characterProfile}</label>
              <textarea
                rows={4}
                placeholder={t.home.placeholders.characterProfile}
                value={form.character_profile}
                onChange={(event) => handleChange("character_profile", event.target.value)}
                style={{ background: 'white' }}
              />
            </div>
          </div>

          {/* 规格参数 - 蓝便签风格 */}
          <div style={{ background: 'var(--sticky-blue)', padding: '2rem', border: '2px solid var(--ink)', borderRadius: '2px', marginBottom: '1rem', transform: 'rotate(-0.8deg)' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>🔢 {t.home.labels.imageCount}</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.image_count}
                  onChange={(event) => handleChange("image_count", Number(event.target.value))}
                  style={{ background: 'white' }}
                />
              </div>
              <div className="form-group">
                <label>🎨 {t.home.labels.stylePreset}</label>
                <select value={form.style_preset} onChange={(event) => handleChange("style_preset", event.target.value)} style={{ background: 'white' }}>
                  {stylePresetOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>📐 {t.home.labels.aspectRatio}</label>
                <select value={form.aspect_ratio} onChange={(event) => handleChange("aspect_ratio", event.target.value)} style={{ background: 'white' }}>
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 策略引导 - 绿便签风格 */}
          <div style={{ background: 'var(--sticky-green)', padding: '2rem', border: '2px solid var(--ink)', borderRadius: '2px', marginBottom: '1rem', transform: 'rotate(0.3deg)' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>🎭 {t.home.labels.consistencyLevel}</label>
                <select
                  value={form.consistency_level}
                  onChange={(event) => handleChange("consistency_level", event.target.value)}
                  style={{ background: 'white' }}
                >
                  {CONSISTENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t.home.consistencyOptions[option]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>👗 {t.home.labels.outfitChangePolicy}</label>
                <select
                  value={form.outfit_change_policy}
                  onChange={(event) => handleChange("outfit_change_policy", event.target.value)}
                  style={{ background: 'white' }}
                >
                  {OUTFIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t.home.outfitOptions[option]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 高级设置 */}
          <div className="form-group">
            <label>📝 {t.home.labels.macroConfig}</label>
            <textarea
              rows={2}
              placeholder={t.home.placeholders.macroConfig}
              value={form.macro_config}
              onChange={(event) => handleChange("macro_config", event.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0' }}>
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={form.scene_progression}
                onChange={(event) => handleChange("scene_progression", event.target.checked)}
              />
              <span>{t.home.toggles.sceneProgression}</span>
            </label>
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={form.nsfw_enabled}
                onChange={(event) => handleChange("nsfw_enabled", event.target.checked)}
              />
              <span>{t.home.toggles.nsfw}</span>
            </label>
          </div>

          <button
            className="button"
            type="submit"
            disabled={loading || !hasApiKey}
            style={{ alignSelf: 'center', minWidth: '300px' }}
          >
            {loading
              ? t.home.actions.loading
              : hasApiKey
                ? t.home.actions.submit
                : t.home.actions.needsApiKey}
          </button>
        </form>

        {message && (
          <div className="message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{message}</span>
            {jobId && (
              <Link href={`/jobs/${jobId}`} className="button" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginBottom: 0 }}>
                {t.home.actions.viewDetail} →
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
