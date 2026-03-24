import type { PackInput } from "@image-set-studio/shared";
import { getClientToken, loadRuntimeSetting, type RuntimeSetting } from "./client";

export function resolveApiPrefix(value = process.env.NEXT_PUBLIC_API_BASE_URL) {
  const normalized = value?.trim().replace(/\/+$/, "");
  return normalized ? normalized : "/api";
}

function apiUrl(path: string) {
  return `${resolveApiPrefix()}${path}`;
}

export function imageContentUrl(jobId: string, imageIndex: number) {
  return apiUrl(`/image-set-jobs/${jobId}/images/${imageIndex}/content`);
}

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Client-Token": getClientToken()
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "请求失败");
  }
  return response.json();
}

export async function fetchRuntimeDefaults() {
  const response = await fetch(apiUrl("/runtime-defaults"), {
    headers: buildHeaders()
  });
  return handleResponse<{
    pollinations: {
      base_url: string | null;
      default_planning_model: string | null;
      default_prompt_model: string | null;
      default_image_model: string | null;
      requires_api_key: true;
    };
  }>(response);
}

export async function listImageSetJobs(page = 1) {
  const response = await fetch(apiUrl(`/image-set-jobs?page=${page}`), {
    headers: buildHeaders()
  });
  return handleResponse<{
    items: Array<{
      id: string;
      status: string;
      theme: string;
      image_count: number;
      success_images: number;
      failed_images: number;
      preview_image_url: string | null;
      created_at: string;
    }>;
    pagination: {
      page: number;
      page_size: number;
      total: number;
    };
  }>(response);
}

export async function getImageSetJob(id: string) {
  const response = await fetch(apiUrl(`/image-set-jobs/${id}`), {
    headers: buildHeaders()
  });
  return handleResponse<{
    job: {
      id: string;
      status: string;
      theme: string;
      total_images: number;
      success_images: number;
      failed_images: number;
      variation_strategy: string | null;
      aspect_ratio: string | null;
      created_at: string;
      updated_at: string | null;
      started_at: string | null;
      finished_at: string | null;
    };
    job_input: PackInput;
    plan_items: Array<{ id: string; image_index: number; title: string; purpose: string }>;
    prompts: Array<{
      id: string;
      image_index: number;
      prompt_status: string;
      final_prompt: string | null;
      short_caption: string | null;
    }>;
    images: Array<{ id: string; image_index: number; image_status: string; image_url: string | null; error_message: string | null }>;
    events: Array<{ id: string; stage: string; level: string; message: string; created_at: string }>;
  }>(response);
}

export async function createImageSetJob(form: {
  pack_input: Record<string, unknown>;
  provider_overrides?: RuntimeSetting;
}) {
  const overrides = form.provider_overrides ?? loadRuntimeSetting();
  if (!overrides.pollinations?.api_key) {
    throw new Error("请先在设置页填写 Pollinations API Key");
  }
  const payload = {
    ...form,
    provider_overrides: overrides
  };
  const response = await fetch(apiUrl("/image-set-jobs"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<{ job: { id: string } }>(response);
}

export async function actionRetryFailed(jobId: string) {
  const response = await fetch(apiUrl(`/image-set-jobs/${jobId}/retry-failed`), {
    method: "POST",
    headers: buildHeaders()
  });
  return handleResponse<{ accepted: true }>(response);
}

export async function actionRetryImage(jobId: string, imageIndex: number) {
  const response = await fetch(apiUrl(`/image-set-jobs/${jobId}/images/${imageIndex}/retry`), {
    method: "POST",
    headers: buildHeaders()
  });
  return handleResponse<{ accepted: true }>(response);
}

export async function actionCancelJob(jobId: string) {
  const response = await fetch(apiUrl(`/image-set-jobs/${jobId}/cancel`), {
    method: "POST",
    headers: buildHeaders()
  });
  return handleResponse<{ accepted: true }>(response);
}
