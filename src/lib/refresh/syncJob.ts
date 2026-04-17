import prisma from "@/lib/db";
import { Platform, SyncStatus, SyncTrigger } from "@prisma/client";

export async function createSyncJob(
  userId: string,
  platform: Platform,
  triggeredBy: SyncTrigger
) {
  return prisma.syncJob.create({
    data: { userId, platform, triggeredBy, status: SyncStatus.PENDING },
  });
}

export async function markRunning(jobId: string) {
  return prisma.syncJob.update({
    where: { id: jobId },
    data: { status: SyncStatus.RUNNING, startedAt: new Date() },
  });
}

export async function markDone(jobId: string, newProblemsFound: number) {
  return prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: SyncStatus.DONE,
      completedAt: new Date(),
      newProblemsFound,
    },
  });
}

export async function markFailed(jobId: string, errorMessage: string) {
  return prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: SyncStatus.FAILED,
      completedAt: new Date(),
      errorMessage,
    },
  });
}

export async function getRunningJob(userId: string, platform: Platform) {
  return prisma.syncJob.findFirst({
    where: {
      userId,
      platform,
      status: { in: [SyncStatus.PENDING, SyncStatus.RUNNING] },
    },
    orderBy: { startedAt: "desc" },
  });
}
