import { redirect } from "next/navigation";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import CourseSidebar from "@/components/CourseSidebar";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import QuizPlayer from "@/components/QuizPlayer";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ productId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { productId, lessonId } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect(`/login?next=/course/${productId}/lesson/${lessonId}`);

  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  // Load lesson
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: {
      quizQuestions: true,
      chapter: { include: { product: true } },
    },
  });

  if (!lesson || lesson.chapter.productId !== productId) {
    redirect(`/course/${productId}`);
  }

  // Access check
  if (!lesson.isFree && !enrollment) {
    redirect(`/product/${productId}?error=enroll_required`);
  }

  // Load all chapters + progress for sidebar
  const allChapters = await prisma.courseChapter.findMany({
    where: { productId },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          progress: { where: { userId } },
        },
      },
    },
  });

  // Next / Previous lesson
  const allLessons = allChapters.flatMap((c) => c.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const chaptersForSidebar = allChapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      duration: l.duration,
      isFree: l.isFree,
      completed: l.progress[0]?.completed ?? false,
      watchedSecs: l.progress[0]?.watchedSecs ?? 0,
    })),
  }));

  const totalCompleted = chaptersForSidebar
    .flatMap((c) => c.lessons)
    .filter((l) => l.completed).length;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return (
    <div
      className="container-fluid py-3"
      style={{ fontFamily: "'Plus Jakarta Sans',system-ui", minHeight: "100vh", background: "#f8f9fa" }}
    >
      <div className="row g-3">
        {/* Sidebar */}
        <div className="col-12 col-lg-4 col-xl-3 order-lg-2">
          <CourseSidebar
            productId={productId}
            chapters={chaptersForSidebar}
            currentLessonId={lessonId}
            enrolled={!!enrollment}
            totalCompleted={totalCompleted}
            totalLessons={allLessons.length}
          />
        </div>

        {/* Lesson content */}
        <div className="col-12 col-lg-8 col-xl-9 order-lg-1">
          {/* Breadcrumb */}
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 12 }}>
            <Link href={`/course/${productId}`} style={{ color: "#e63946", textDecoration: "none", fontWeight: 700 }}>
              {lesson.chapter.product.title}
            </Link>
            {" › "}
            {lesson.chapter.title}
            {" › "}
            <span style={{ color: "#333" }}>{lesson.title}</span>
          </div>

          {/* Content card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 2px 20px rgba(0,0,0,0.07)",
              marginBottom: 20,
            }}
          >
            {/* VIDEO */}
            {lesson.type === "VIDEO" && (
              <SecureVideoPlayer
                lessonId={lessonId}
                productId={productId}
                buyerEmail={user?.email ?? ""}
              />
            )}

            {/* Content header */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    background: lesson.type === "VIDEO"
                      ? "#1d3557" : lesson.type === "QUIZ"
                      ? "#e63946" : "#457b9d",
                    color: "#fff",
                    padding: "2px 10px",
                    borderRadius: 20,
                    letterSpacing: "0.05em",
                  }}
                >
                  {lesson.type}
                </span>
              </div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1a1a2e", marginBottom: 0 }}>
                {lesson.title}
              </h1>
            </div>

            {/* QUIZ */}
            {lesson.type === "QUIZ" && (
              <div style={{ padding: "0 24px 24px" }}>
                <QuizPlayer
                  lessonId={lessonId}
                  questions={lesson.quizQuestions.map((q) => ({
                    id: q.id,
                    question: q.question,
                    options: q.options as string[],
                    answer: q.answer,
                    explain: q.explain,
                  }))}
                />
              </div>
            )}

            {/* PDF */}
            {lesson.type === "PDF" && lesson.chapter.productId && (
              <div style={{ padding: "0 24px 24px" }}>
                <p className="text-muted small">PDF lessons open in the secure reader.</p>
                <Link
                  href={`/read/${productId}?lesson=${lessonId}`}
                  className="btn btn-danger"
                  style={{ borderRadius: 12 }}
                >
                  Open PDF Reader
                </Link>
              </div>
            )}

            {/* TEXT */}
            {lesson.type === "TEXT" && lesson.textBody && (
              <div
                style={{ padding: "0 24px 24px", lineHeight: 1.8, fontSize: "0.95rem", color: "#333" }}
                dangerouslySetInnerHTML={{ __html: lesson.textBody }}
              />
            )}
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
            {prevLesson ? (
              <Link
                href={`/course/${productId}/lesson/${prevLesson.id}`}
                className="btn btn-outline-secondary"
                style={{ borderRadius: 12, flex: 1, maxWidth: 200, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
              >
                <ChevronLeft size={16} />
                Previous
              </Link>
            ) : <div />}

            {nextLesson ? (
              <Link
                href={`/course/${productId}/lesson/${nextLesson.id}`}
                className="btn btn-danger"
                style={{ borderRadius: 12, flex: 1, maxWidth: 200, display: "flex", alignItems: "center", gap: 6, justifyContent: "center", fontWeight: 700 }}
              >
                Next
                <ChevronRight size={16} />
              </Link>
            ) : (
              <Link
                href={`/course/${productId}`}
                className="btn btn-success"
                style={{ borderRadius: 12, flex: 1, maxWidth: 220, fontWeight: 700 }}
              >
                🎉 Course Complete!
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
