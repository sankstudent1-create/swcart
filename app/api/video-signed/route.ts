import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/app/actions/auth";
import { createClient } from "@supabase/supabase-js";
import { logAndCheckDigitalAccess } from "@/lib/security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/video-signed
 * Returns a 90-second signed URL for a video lesson's HLS manifest or file.
 * The URL expires rapidly — clients must refresh before it expires.
 */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { lessonId } = await req.json();
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  // Load lesson + verify user is enrolled in the parent product
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: { chapter: true },
  });

  if (!lesson?.videoKey) {
    return NextResponse.json({ error: "Lesson not found or has no video" }, { status: 404 });
  }

  // Verify enrollment unless lesson is free preview
  if (!lesson.isFree) {
    const enrollment = await prisma.userCourseEnrollment.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: lesson.chapter.productId,
        },
      },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }
  }

  // Generate short-lived signed URL (90s)
  const { data, error } = await supabase.storage
    .from("course-videos")
    .createSignedUrl(lesson.videoKey, 90);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not generate signed URL" }, { status: 500 });
  }

  // Log access
  // Log access
  await logAndCheckDigitalAccess({
    req,
    userId,
    productId: lesson.chapter.productId,
    action: "VIDEO_PLAY",
    metadata: { lessonId },
  });

  return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: 90 });
}
