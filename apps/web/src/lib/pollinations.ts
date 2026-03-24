const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";

export interface PollinationsModelOption {
  value: string;
  label: string;
  description: string;
}

type PollinationsTextModelResponse =
  | {
      data?: Array<{
        id?: string;
        name?: string;
        description?: string;
        output_modalities?: string[];
      }>;
    }
  | Array<{
      id?: string;
      name?: string;
      description?: string;
      output_modalities?: string[];
    }>;

type PollinationsImageModelResponse = Array<{
  name?: string;
  description?: string;
  output_modalities?: string[];
}>;

function buildAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

function toModelLabel(name: string, description?: string) {
  return description?.trim() ? `${name} - ${description.trim()}` : name;
}

function normalizeTextModels(payload: PollinationsTextModelResponse) {
  const items = Array.isArray(payload) ? payload : payload.data ?? [];
  return items
    .filter((item) => item.output_modalities?.includes("text"))
    .map((item) => ({
      value: item.id ?? item.name ?? "",
      label: toModelLabel(item.id ?? item.name ?? "", item.description),
      description: item.description?.trim() ?? ""
    }))
    .filter((item) => item.value);
}

function normalizeImageModels(payload: PollinationsImageModelResponse) {
  return payload
    .filter((item) => item.output_modalities?.includes("image"))
    .map((item) => ({
      value: item.name ?? "",
      label: toModelLabel(item.name ?? "", item.description),
      description: item.description?.trim() ?? ""
    }))
    .filter((item) => item.value);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `请求失败: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchPollinationsModelOptions(apiKey: string) {
  const [textResponse, imageResponse] = await Promise.all([
    fetch(`${POLLINATIONS_BASE_URL}/v1/models`, {
      headers: buildAuthHeaders(apiKey)
    }),
    fetch(`${POLLINATIONS_BASE_URL}/image/models`, {
      headers: buildAuthHeaders(apiKey)
    })
  ]);
  const [textPayload, imagePayload] = await Promise.all([
    parseJsonResponse<PollinationsTextModelResponse>(textResponse),
    parseJsonResponse<PollinationsImageModelResponse>(imageResponse)
  ]);

  return {
    textModels: normalizeTextModels(textPayload),
    imageModels: normalizeImageModels(imagePayload)
  };
}
