import type { PackInput } from "@image-set-studio/shared";

export type PromptStatus = "pending" | "generating" | "ready" | "failed";
export type ImageStatus = "pending" | "generating" | "ready" | "failed";

export interface ResolvedPollinationsConfig {
  baseUrl: string;
  apiKey: string;
  planningModel: string;
  promptModel: string;
  imageModel: string;
}

export interface ImageSetPlanItemRecord {
  id: string;
  imageIndex: number;
  title: string;
  purpose: string;
  shotType: string;
  cameraAngle: string;
  pose: string;
  expression: string;
  outfitVariant: string;
  background: string;
  lighting: string;
  compositionFocus: string;
  consistencyAnchor: string;
  variationPoint: string;
  detailedIntent: string;
}

export interface ImageSetPromptRecord {
  id: string;
  imageIndex: number;
  promptStatus: PromptStatus;
  finalPrompt: string | null;
  shortCaption: string | null;
}

export interface ImageSetResultImageRecord {
  id: string;
  imageIndex: number;
  imageStatus: ImageStatus;
  imageUrl: string | null;
  errorMessage: string | null;
  provider: string | null;
  providerModel: string | null;
}

export interface ImageSetEventRecord {
  id: string;
  stage: string;
  level: "info" | "error";
  message: string;
  createdAt: string;
}

export interface ImageSetJobRecord {
  id: string;
  ownerTokenHash: string;
  status: string;
  packInput: PackInput;
  totalImages: number;
  successImages: number;
  failedImages: number;
  resolvedPollinationsConfigEncrypted: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  failedReason: string | null;
  planItems: ImageSetPlanItemRecord[];
  prompts: ImageSetPromptRecord[];
  images: ImageSetResultImageRecord[];
  events: ImageSetEventRecord[];
}

export interface CreateJobRecordInput {
  ownerTokenHash: string;
  packInput: PackInput;
  resolvedPollinationsConfigEncrypted: string;
}
