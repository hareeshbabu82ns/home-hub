/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import { db } from "../src/lib/db";

function buildDurationBreakdown(
  sessions: Array<{ startTime: Date; durationMs: bigint | null }>,
) {
  const yearMap = new Map<number, Map<number, Map<number, number>>>();
  let totalDurationMs = 0;

  for (const session of sessions) {
    if (!session.durationMs) continue;
    const duration = Number(session.durationMs);
    totalDurationMs += duration;

    const date = new Date(session.startTime);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, new Map());
    const dayMap = monthMap.get(month)!;

    dayMap.set(day, (dayMap.get(day) || 0) + duration);
  }

  const durations: any[] = [];
  for (const [year, monthMap] of yearMap.entries()) {
    let yearDurationMs = 0;
    const yearMonths: any[] = [];
    for (const [month, dayMap] of monthMap.entries()) {
      let monthDurationMs = 0;
      const monthDays: any[] = [];
      for (const [day, duration] of dayMap.entries()) {
        monthDurationMs += duration;
        monthDays.push({ day, durationMs: duration });
      }
      monthDays.sort((a, b) => a.day - b.day);
      yearDurationMs += monthDurationMs;
      yearMonths.push({
        month,
        durationMs: monthDurationMs,
        durations: monthDays,
      });
    }
    yearMonths.sort((a, b) => a.month - b.month);
    durations.push({ year, durationMs: yearDurationMs, durations: yearMonths });
  }
  durations.sort((a, b) => a.year - b.year);
  return { totalDurationMs, durations };
}

async function findOrCreateSeedUser(): Promise<string> {
  // Use first admin email from env, otherwise fallback to existing admin user
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  const adminEmail = adminEmails[0] || undefined;

  let user = null;
  if (adminEmail) {
    user = await db.user.findFirst({ where: { email: adminEmail.trim() } });
    if (user) return user.id;
  }

  // Try to find any admin user
  user = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (user) return user.id;

  // Create a seed admin user
  const result = await db.user.create({
    data: {
      name: "Seed Admin",
      email: adminEmail || "seed-admin@example.com",
      role: "ADMIN",
      isActive: true,
    },
  });

  return result.id;
}

async function main() {
  console.log("Seeding time-tracking data...");
  const userId = await findOrCreateSeedUser();

  // Create topics
  const topics = [
    { name: "Running Timer", color: "#f97316", icon: "clock" },
    { name: "Short Sessions", color: "#06b6d4", icon: "zap" },
    { name: "Long Sessions", color: "#10b981", icon: "clock" },
    {
      name: "Favorite Topic",
      color: "#8b5cf6",
      icon: "star",
      isFavorite: true,
    },
    {
      name: "Archived Topic",
      color: "#64748b",
      icon: "archive",
      isArchived: true,
    },
  ];

  const createdTopics: Record<string, string> = {};

  for (const t of topics) {
    const topic = await db.timeTopic.upsert({
      where: { userId_name: { userId, name: t.name } },
      update: { ...t },
      create: { ...t, userId },
    });
    createdTopics[t.name] = topic.id;
  }

  // Helper to create session
  async function createSession(topicId: string, start: Date, end?: Date) {
    const data: any = {
      userId,
      topicId,
      startTime: start,
      isRunning: end ? false : true,
    };
    if (end) {
      const durationMs = BigInt(end.getTime() - start.getTime());
      data.endTime = end;
      data.durationMs = durationMs;
    }
    return db.timeSession.create({ data });
  }

  const now = new Date();

  // Running timer
  await createSession(
    createdTopics["Running Timer"],
    new Date(now.getTime() - 2 * 60 * 1000),
  );

  // Short sessions
  await createSession(
    createdTopics["Short Sessions"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1 + 30 * 1000),
  );
  await createSession(
    createdTopics["Short Sessions"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2 + 5 * 60 * 1000),
  );
  await createSession(
    createdTopics["Short Sessions"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3 + 15 * 60 * 1000),
  );

  // Long sessions
  await createSession(
    createdTopics["Long Sessions"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10 + 2 * 60 * 60 * 1000),
  );
  await createSession(
    createdTopics["Long Sessions"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20 + 3 * 60 * 60 * 1000),
  );

  // Favorite topic sessions
  await createSession(
    createdTopics["Favorite Topic"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2 + 25 * 60 * 1000),
  );

  // Archived topic (few sessions)
  await createSession(
    createdTopics["Archived Topic"],
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30 + 45 * 60 * 1000),
  );

  // Generate a larger number of sessions spread across the last year
  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomDateBetween(start: Date, end: Date) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  }

  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const topicIds = Object.values(createdTopics);

  // Create 120 sessions covering the past year across topics (excluding the running timer)
  const sessionsToCreate = 120;
  for (let i = 0; i < sessionsToCreate; i += 1) {
    const topicId = topicIds[randInt(0, topicIds.length - 1)];
    const start = randomDateBetween(oneYearAgo, now);
    // duration between 30s and 3 hours
    const durationMs = randInt(30 * 1000, 3 * 60 * 60 * 1000);
    let end = new Date(start.getTime() + durationMs);
    if (end.getTime() > now.getTime())
      end = new Date(now.getTime() - randInt(1, 30) * 1000);
    await createSession(topicId, start, end);
  }

  // Now recompute and update topic stats
  for (const [_name, id] of Object.entries(createdTopics)) {
    const sessions = await db.timeSession.findMany({
      where: { topicId: id, userId, isRunning: false },
    });

    const lastTrackedAt = sessions.reduce(
      (acc: Date | null, s) => {
        if (!s.endTime) return acc;
        if (!acc) return s.endTime;
        return s.endTime > acc ? s.endTime : acc;
      },
      null as Date | null,
    );

    const durationBreakdown = buildDurationBreakdown(
      sessions.map((s) => ({
        startTime: s.startTime,
        durationMs: s.durationMs,
      })),
    );

    await db.timeTopic.update({
      where: { id },
      data: {
        durationBreakdown: durationBreakdown as unknown as any,
        sessionCount: sessions.length,
        lastTrackedAt,
      },
    });
  }

  console.log("Time-tracking seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
