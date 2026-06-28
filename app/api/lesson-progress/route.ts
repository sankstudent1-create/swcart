import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";

/**
 * POST /api/lesson-progress
 * Upserts a user's progress on a specific lesson (video watch time, completion, quiz score).
 * Called automatically every 10s from the video player and on quiz submit.
 */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { lessonId, watchedSecs, completed, quizScore } = await req.json();

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const progress = await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      watchedSecs: watchedSecs ?? 0,
      completed: completed ?? false,
      quizScore: quizScore ?? null,
    },
    update: {
      // Only update watchedSecs if it's increasing (prevent rewinding manipulation)
      ...(watchedSecs !== undefined && { watchedSecs }),
      ...(completed !== undefined && { completed }),
      ...(quizScore !== undefined && { quizScore }),
    },
  });

  return NextResponse.json({ ok: true, progress });
}

/**
 * GET /api/lesson-progress?productId=X
 * Returns all lesson progress for a user's enrolled product.
 */
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const progress = await prisma.userLessonProgress.findMany({
    where: {
      userId,
      lesson: { chapter: { productId } },
    },
    select: {
      lessonId: true,
      completed: true,
      watchedSecs: true,
      quizScore: true,
    },
  });

  return NextResponse.json({ progress });
}
