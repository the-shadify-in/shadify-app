import { prisma } from "@/lib/db";
import { TELEMETRY_TOPICS, type TelemetryTopic } from "@/features/ask/topics";

export interface RecordChipTapInput {
  slug: string;
  topic: TelemetryTopic;
}

export interface ChipTopicStat {
  topic: string;
  totalCount: number;
}

export interface AllWeddingsChipStats {
  totalTaps: number;
  otherSharePercent: number;
  topicBreakdown: Record<string, number>;
  topTopic: string | null;
}

/**
 * Returns UTC calendar day Date (at 00:00:00.000Z) for PostgreSQL DATE column.
 */
export function getUtcCalendarDay(date = new Date()): Date {
  const dateStr = date.toISOString().slice(0, 10);
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Increments the daily counter for a given wedding and topic.
 * Silently ignores unknown, unpublished, or expired weddings.
 * Strictly anonymous: no IP, no user agent, no fine timestamp, no cookies.
 */
export async function recordChipTap(
  input: RecordChipTapInput,
): Promise<{ recorded: boolean; reason?: string }> {
  const { slug, topic } = input;

  if (!TELEMETRY_TOPICS.includes(topic)) {
    return { recorded: false, reason: "invalid_topic" };
  }

  // 1. Resolve wedding and ensure it is published and not expired
  const wedding = await prisma.wedding.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      contentExpiresAt: true,
    },
  });

  if (!wedding) {
    return { recorded: false, reason: "wedding_not_found" };
  }

  if (wedding.status !== "published") {
    return { recorded: false, reason: "wedding_not_published" };
  }

  if (wedding.contentExpiresAt && wedding.contentExpiresAt < new Date()) {
    return { recorded: false, reason: "wedding_expired" };
  }

  const day = getUtcCalendarDay();

  // 2. Atomic upsert into wedding_chip_counts_daily
  await prisma.weddingChipCountDaily.upsert({
    where: {
      weddingId_day_topic: {
        weddingId: wedding.id,
        day,
        topic,
      },
    },
    create: {
      weddingId: wedding.id,
      day,
      topic,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });

  return { recorded: true };
}

/**
 * Retrieves aggregate chip tap stats for an individual wedding.
 */
export async function getChipCountsForWedding(weddingId: string): Promise<ChipTopicStat[]> {
  const counts = await prisma.weddingChipCountDaily.groupBy({
    by: ["topic"],
    where: { weddingId },
    _sum: {
      count: true,
    },
    orderBy: {
      _sum: {
        count: "desc",
      },
    },
  });

  return counts.map((row) => ({
    topic: row.topic,
    totalCount: row._sum.count ?? 0,
  }));
}

/**
 * Admin view: aggregate across all weddings.
 * Shows which questions are asked most, total volume, and the share of "something else" taps.
 */
export async function getAllWeddingsChipStats(): Promise<AllWeddingsChipStats> {
  const counts = await prisma.weddingChipCountDaily.groupBy({
    by: ["topic"],
    _sum: {
      count: true,
    },
    orderBy: {
      _sum: {
        count: "desc",
      },
    },
  });

  let totalTaps = 0;
  let otherTaps = 0;
  const topicBreakdown: Record<string, number> = {};
  let topTopic: string | null = null;
  let maxCount = 0;

  for (const row of counts) {
    const count = row._sum.count ?? 0;
    totalTaps += count;
    topicBreakdown[row.topic] = count;

    if (row.topic === "other" || row.topic === "other_contact_tapped") {
      otherTaps += count;
    }

    if (count > maxCount) {
      maxCount = count;
      topTopic = row.topic;
    }
  }

  const otherSharePercent = totalTaps > 0 ? Math.round((otherTaps / totalTaps) * 100) : 0;

  return {
    totalTaps,
    otherSharePercent,
    topicBreakdown,
    topTopic,
  };
}

export interface WeddingChipSummary {
  id: string;
  slug: string;
  couple: string;
  totalTaps: number;
  topQuestion: string | null;
  breakdown: Record<string, number>;
}

/**
 * Admin view: per-wedding breakdown of chip taps.
 */
export async function getPerWeddingChipStats(): Promise<WeddingChipSummary[]> {
  const weddings = await prisma.wedding.findMany({
    select: {
      id: true,
      slug: true,
      brideName: true,
      groomName: true,
      chipCounts: {
        select: {
          topic: true,
          count: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return weddings.map((w) => {
    let totalTaps = 0;
    const breakdown: Record<string, number> = {};
    let topQuestion: string | null = null;
    let max = 0;

    for (const c of w.chipCounts) {
      const current = (breakdown[c.topic] || 0) + c.count;
      breakdown[c.topic] = current;
      totalTaps += c.count;
      if (current > max) {
        max = current;
        topQuestion = c.topic;
      }
    }

    return {
      id: w.id,
      slug: w.slug,
      couple: `${w.brideName} & ${w.groomName}`,
      totalTaps,
      topQuestion,
      breakdown,
    };
  });
}
