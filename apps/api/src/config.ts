export interface AppConfig {
  encryptionKey: string;
  schedulerPollMs: number;
  promptGenerationConcurrency: number;
  imageGenerationConcurrency: number;
  pollinationsDefaults: {
    baseUrl: string;
    planningModel: string | null;
    promptModel: string | null;
    imageModel: string | null;
  };
}

function readString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const encryptionKey = overrides.encryptionKey ?? process.env.CONFIG_ENCRYPTION_KEY ?? "";
  if (!encryptionKey.trim()) {
    throw new Error("CONFIG_ENCRYPTION_KEY is required");
  }

  return {
    encryptionKey,
    schedulerPollMs: overrides.schedulerPollMs ?? readNumber(process.env.SCHEDULER_POLL_MS, 2_000),
    promptGenerationConcurrency:
      overrides.promptGenerationConcurrency ??
      readNumber(process.env.PROMPT_GENERATION_CONCURRENCY, 2),
    imageGenerationConcurrency:
      overrides.imageGenerationConcurrency ??
      readNumber(process.env.IMAGE_GENERATION_CONCURRENCY, 2),
    pollinationsDefaults: {
      baseUrl: overrides.pollinationsDefaults?.baseUrl ?? "https://gen.pollinations.ai",
      planningModel:
        overrides.pollinationsDefaults?.planningModel ??
        readString(process.env.POLLINATIONS_DEFAULT_PLANNING_MODEL),
      promptModel:
        overrides.pollinationsDefaults?.promptModel ??
        readString(process.env.POLLINATIONS_DEFAULT_PROMPT_MODEL),
      imageModel:
        overrides.pollinationsDefaults?.imageModel ??
        readString(process.env.POLLINATIONS_DEFAULT_IMAGE_MODEL)
    }
  };
}
