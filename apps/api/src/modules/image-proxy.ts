import type { FastifyReply } from "fastify";
import type { AppConfig } from "../config.js";
import { decryptJson, hashClientToken } from "../lib/crypto.js";
import type { ImageSetJobRecord, ImageSetResultImageRecord, ResolvedPollinationsConfig } from "./domain.js";
import type { ProviderRegistry } from "./providers.js";
import type { ImageSetRepository } from "./repository.js";

function findReadyImage(job: ImageSetJobRecord, imageIndex: number) {
  const image = job.images.find((item) => item.imageIndex === imageIndex);
  if (!image?.imageUrl) {
    return null;
  }
  return image as ImageSetResultImageRecord & { imageUrl: string };
}

function loadJobConfig(config: AppConfig, job: ImageSetJobRecord) {
  return decryptJson<ResolvedPollinationsConfig>(
    config.encryptionKey,
    job.resolvedPollinationsConfigEncrypted
  );
}

export async function replyWithOwnedImageContent(input: {
  clientToken: string;
  jobId: string;
  imageIndex: number;
  repository: ImageSetRepository;
  providers: ProviderRegistry;
  config: AppConfig;
  reply: FastifyReply;
}) {
  const ownerTokenHash = hashClientToken(input.clientToken);
  const job = await input.repository.getJobOwnedByHash(ownerTokenHash, input.jobId);
  if (!job) {
    return input.reply.code(404).send({ error: "Not found" });
  }

  const image = findReadyImage(job, input.imageIndex);
  if (!image) {
    return input.reply.code(404).send({ error: "Image not found" });
  }

  try {
    const content = await input.providers.imageProvider.fetchImage({
      imageUrl: image.imageUrl,
      pollinationsConfig: loadJobConfig(input.config, job)
    });
    input.reply.header("Content-Type", content.contentType);
    if (content.cacheControl) {
      input.reply.header("Cache-Control", content.cacheControl);
    }
    return input.reply.send(content.body);
  } catch (error) {
    return input.reply.code(502).send({
      error: error instanceof Error ? error.message : "Image proxy failed"
    });
  }
}
