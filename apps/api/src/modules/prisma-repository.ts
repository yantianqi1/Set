import type { Prisma } from "@prisma/client";
import { packInputSchema } from "@image-set-studio/shared";
import type { PrismaDatabaseClient } from "../lib/prisma.js";
import type {
  CreateJobRecordInput,
  ImageSetEventRecord,
  ImageSetJobRecord,
  ImageSetPlanItemRecord,
  ImageSetPromptRecord,
  ImageSetResultImageRecord
} from "./domain.js";
import type { ImageSetRepository } from "./repository.js";
const RUNNABLE_STATUSES = [
  "pending",
  "planning",
  "prompt_generating",
  "image_generating"
] as const;
const imageSetJobInclude = {
  planItems: {
    orderBy: {
      imageIndex: "asc"
    }
  },
  prompts: {
    orderBy: {
      imageIndex: "asc"
    }
  },
  images: {
    orderBy: {
      imageIndex: "asc"
    }
  },
  events: {
    orderBy: {
      createdAt: "asc"
    }
  }
} as const satisfies Prisma.ImageSetJobInclude;
type ImageSetJobEntity = Prisma.ImageSetJobGetPayload<{
  include: typeof imageSetJobInclude;
}>;
type PrismaTransaction = Prisma.TransactionClient;

function toIso(value: Date | null) {
  return value?.toISOString() ?? null;
}

function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

function parsePackInput(payload: string) {
  return packInputSchema.parse(JSON.parse(payload));
}

function mapPlanItem(item: ImageSetJobEntity["planItems"][number]): ImageSetPlanItemRecord {
  return {
    id: item.id,
    imageIndex: item.imageIndex,
    title: item.title,
    purpose: item.purpose,
    shotType: item.shotType,
    cameraAngle: item.cameraAngle,
    pose: item.pose,
    expression: item.expression,
    outfitVariant: item.outfitVariant,
    background: item.background,
    lighting: item.lighting,
    compositionFocus: item.compositionFocus,
    consistencyAnchor: item.consistencyAnchor,
    variationPoint: item.variationPoint,
    detailedIntent: item.detailedIntent
  };
}

function mapPrompt(item: ImageSetJobEntity["prompts"][number]): ImageSetPromptRecord {
  return {
    id: item.id,
    imageIndex: item.imageIndex,
    promptStatus: item.promptStatus as ImageSetPromptRecord["promptStatus"],
    finalPrompt: item.finalPrompt,
    shortCaption: item.shortCaption
  };
}

function mapImage(item: ImageSetJobEntity["images"][number]): ImageSetResultImageRecord {
  return {
    id: item.id,
    imageIndex: item.imageIndex,
    imageStatus: item.imageStatus as ImageSetResultImageRecord["imageStatus"],
    imageUrl: item.imageUrl,
    errorMessage: item.errorMessage,
    provider: item.provider,
    providerModel: item.providerModel
  };
}

function mapEvent(item: ImageSetJobEntity["events"][number]): ImageSetEventRecord {
  return {
    id: item.id,
    stage: item.stage,
    level: item.level as ImageSetEventRecord["level"],
    message: item.message,
    createdAt: item.createdAt.toISOString()
  };
}

function mapJob(entity: ImageSetJobEntity): ImageSetJobRecord {
  return {
    id: entity.id,
    ownerTokenHash: entity.ownerTokenHash,
    status: entity.status,
    packInput: parsePackInput(entity.packInputJson),
    totalImages: entity.totalImages,
    successImages: entity.successImages,
    failedImages: entity.failedImages,
    resolvedPollinationsConfigEncrypted: entity.resolvedPollinationsConfigEncrypted,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    startedAt: toIso(entity.startedAt),
    finishedAt: toIso(entity.finishedAt),
    failedReason: entity.failedReason,
    planItems: entity.planItems.map(mapPlanItem),
    prompts: entity.prompts.map(mapPrompt),
    images: entity.images.map(mapImage),
    events: entity.events.map(mapEvent)
  };
}

function resetRelation<Data>(items: Data[]) {
  if (items.length === 0) {
    return {
      deleteMany: {}
    };
  }

  return {
    deleteMany: {},
    createMany: {
      data: [...items]
    }
  };
}

function toJobUpdateData(job: ImageSetJobRecord): Prisma.ImageSetJobUpdateInput {
  return {
    ownerTokenHash: job.ownerTokenHash,
    status: job.status,
    packInputJson: JSON.stringify(job.packInput),
    totalImages: job.totalImages,
    successImages: job.successImages,
    failedImages: job.failedImages,
    resolvedPollinationsConfigEncrypted: job.resolvedPollinationsConfigEncrypted,
    startedAt: parseDate(job.startedAt),
    finishedAt: parseDate(job.finishedAt),
    failedReason: job.failedReason,
    planItems: resetRelation(
      job.planItems.map((item) => ({
        id: item.id,
        imageIndex: item.imageIndex,
        title: item.title,
        purpose: item.purpose,
        shotType: item.shotType,
        cameraAngle: item.cameraAngle,
        pose: item.pose,
        expression: item.expression,
        outfitVariant: item.outfitVariant,
        background: item.background,
        lighting: item.lighting,
        compositionFocus: item.compositionFocus,
        consistencyAnchor: item.consistencyAnchor,
        variationPoint: item.variationPoint,
        detailedIntent: item.detailedIntent
      }))
    ),
    prompts: resetRelation(
      job.prompts.map((item) => ({
        id: item.id,
        imageIndex: item.imageIndex,
        promptStatus: item.promptStatus,
        finalPrompt: item.finalPrompt,
        shortCaption: item.shortCaption
      }))
    ),
    images: resetRelation(
      job.images.map((item) => ({
        id: item.id,
        imageIndex: item.imageIndex,
        imageStatus: item.imageStatus,
        imageUrl: item.imageUrl,
        errorMessage: item.errorMessage,
        provider: item.provider,
        providerModel: item.providerModel
      }))
    ),
    events: resetRelation(
      job.events.map((item) => ({
        id: item.id,
        stage: item.stage,
        level: item.level,
        message: item.message,
        createdAt: new Date(item.createdAt)
      }))
    )
  };
}

async function getJobOrThrow(prisma: PrismaTransaction, jobId: string) {
  const entity = await prisma.imageSetJob.findUnique({
    where: { id: jobId },
    include: imageSetJobInclude
  });
  if (!entity) {
    throw new Error("Job not found");
  }
  return entity;
}

export function createPrismaImageSetRepository(prisma: PrismaDatabaseClient): ImageSetRepository {
  return {
    async createJob(input: CreateJobRecordInput) {
      const entity = await prisma.imageSetJob.create({
        data: {
          ownerTokenHash: input.ownerTokenHash,
          status: "pending",
          packInputJson: JSON.stringify(input.packInput),
          totalImages: input.packInput.image_count,
          successImages: 0,
          failedImages: 0,
          resolvedPollinationsConfigEncrypted: input.resolvedPollinationsConfigEncrypted
        },
        include: imageSetJobInclude
      });
      return mapJob(entity);
    },

    async getJob(jobId: string) {
      const entity = await prisma.imageSetJob.findUnique({
        where: { id: jobId },
        include: imageSetJobInclude
      });
      return entity ? mapJob(entity) : null;
    },

    async getJobOwnedByHash(ownerTokenHash: string, jobId: string) {
      const entity = await prisma.imageSetJob.findFirst({
        where: { id: jobId, ownerTokenHash },
        include: imageSetJobInclude
      });
      return entity ? mapJob(entity) : null;
    },

    async listJobsByOwnerHash(ownerTokenHash: string, page: number, pageSize: number) {
      const [total, items] = await prisma.$transaction([
        prisma.imageSetJob.count({ where: { ownerTokenHash } }),
        prisma.imageSetJob.findMany({
          where: { ownerTokenHash },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: imageSetJobInclude
        })
      ]);
      return { items: items.map(mapJob), total };
    },

    async listRunnableJobs() {
      const items = await prisma.imageSetJob.findMany({
        where: {
          status: {
            in: [...RUNNABLE_STATUSES]
          }
        },
        orderBy: { createdAt: "asc" },
        include: imageSetJobInclude
      });
      return items.map(mapJob);
    },

    async updateJob(jobId: string, updater) {
      return prisma.$transaction(async (transaction) => {
        const current = mapJob(await getJobOrThrow(transaction, jobId));
        const updated = updater(current);
        const entity = await transaction.imageSetJob.update({
          where: { id: jobId },
          data: toJobUpdateData(updated),
          include: imageSetJobInclude
        });
        return mapJob(entity);
      });
    }
  };
}
