const TOKEN_KEY = "image-set-client-token";
const SETTINGS_KEY = "image-set-settings";
const TOKEN_COOKIE_ATTRS = "Path=/; SameSite=Lax";

function randomHex(length = 32) {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function persistClientTokenCookie(token: string) {
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; ${TOKEN_COOKIE_ATTRS}`;
}

export function getClientToken() {
  if (typeof window === "undefined") {
    throw new Error("client token is browser-only");
  }

  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = randomHex(32);
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  persistClientTokenCookie(token);
  return token;
}

export type RuntimeSetting = {
  pollinations?: {
    api_key?: string;
    planning_model?: string;
    prompt_model?: string;
    image_model?: string;
  };
};

function normalizeValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeGroup<T extends Record<string, string | undefined>>(group: T | undefined) {
  if (!group) {
    return undefined;
  }

  const entries = Object.entries(group)
    .map(([key, value]) => [key, normalizeValue(value)] as const)
    .filter((entry) => entry[1] !== undefined);

  return entries.length > 0 ? (Object.fromEntries(entries) as T) : undefined;
}

export function compactRuntimeSetting(setting: RuntimeSetting): RuntimeSetting {
  const pollinations = normalizeGroup(setting.pollinations);

  return {
    ...(pollinations ? { pollinations } : {})
  };
}

export function loadRuntimeSetting(): RuntimeSetting {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {};
    }
    return compactRuntimeSetting(JSON.parse(raw) as RuntimeSetting);
  } catch {
    return {};
  }
}

export function saveRuntimeSetting(config: RuntimeSetting) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(compactRuntimeSetting(config)));
}

export function clearRuntimeSetting() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SETTINGS_KEY);
}
