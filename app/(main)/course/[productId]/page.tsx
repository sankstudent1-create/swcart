import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import CourseSidebar from "@/components/CourseSidebar";
import { PlayCircle, Clock, BookOpen, Award } from "lucide-react";

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { title: true } });
  return {
    title: product ? `${product.title} — swcart Course` : "Course — swcart",
    robots: "noindex,nofollow",
  };
}

export default async function CoursePage({ params }: Props) {
  const { productId } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect(`/login?next=/course/${productId}`);

  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      courseChapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              progress: { where: { userId } },
            },
          },
        },
      },
    },
  });

  if (!product) {
    return <div className="container py-5 text-center"><h4>Course not found</h4></div>;
  }

  // Build sidebar data
  const chaptersForSidebar = product.courseChapters.map((ch) => ({
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

  const allLessons = chaptersForSidebar.flatMap((c) => c.lessons);
  const totalCompleted = allLessons.filter((l) => l.completed).length;
  const totalLessons = allLessons.length;
  const totalMins = Math.round(
    product.courseChapters.flatMap((c) => c.lessons).reduce((s, l) => s + (l.duration ?? 0), 0) / 60
  );

  // First incomplete lesson (for "continue" button)
  const nextLesson =
    allLessons.find((l) => !l.completed) ?? allLessons[0];

  return (
    <div className="container-fluid py-4" style={{ fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-lg-4 col-xl-3">
          <CourseSidebar
            productId={productId}
            chapters={chaptersForSidebar}
            enrolled={!!enrollment}
            totalCompleted={totalCompleted}
            totalLessons={totalLessons}
          />
        </div>

        {/* Main content */}
        <div className="col-12 col-lg-8 col-xl-9">
          {/* Hero */}
          <div
            style={{
              background: "linear-gradient(135deg,#1d3557,#457b9d)",
              borderRadius: 20,
              padding: "36px 32px",
              color: "#fff",
              marginBottom: 28,
            }}
          >
            <p style={{ fontSize: "0.78rem", fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>
              COURSE
            </p>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
              {product.title}
            </h1>
            {product.description && (
              <p style={{ opacity: 0.85, fontSize: "0.9rem", marginBottom: 20, maxWidth: 600 }}>
                {product.description}
              </p>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24, fontSize: "0.82rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <PlayCircle size={15} /> {totalLessons} lessons
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={15} /> {totalMins} min total
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <BookOpen size={15} /> {product.courseChapters.length} chapters
              </span>
              {totalCompleted === totalLessons && totalLessons > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#90e0c4" }}>
                  <Award size={15} /> Completed!
                </span>
              )}
            </div>

            {/* CTA */}
            {enrollment ? (
              nextLesson ? (
                <Link
                  href={`/course/${productId}/lesson/${nextLesson.id}`}
                  className="btn btn-light fw-bold"
                  style={{ borderRadius: 12, color: "#1d3557" }}
                >
                  {totalCompleted === 0 ? "▶ Start Course" : "▶ Continue Learning"}
                </Link>
              ) : null
            ) : (
              <Link href={`/product/${productId}`} className="btn btn-warning fw-bold" style={{ borderRadius: 12 }}>
                Enroll Now
              </Link>
            )}
          </div>

          {/* Chapter list */}
          {product.courseChapters.map((ch, ci) => {
            const chDone = ch.lessons.filter((l) => l.progress[0]?.completed).length;
            return (
              <div
                key={ch.id}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  marginBottom: 16,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                {/* Chapter header */}
                <div
                  style={{
                    padding: "14px 20px",
                    background: "#f8f9fa",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ fontWeight: 800, fontSize: "0.95rem", margin: 0, color: "#1a1a2e" }}>
                    Chapter {ci + 1}: {ch.title}
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600 }}>
                    {chDone}/{ch.lessons.length} done
                  </span>
                </div>

                {/* Lessons */}
                {ch.lessons.map((lesson) => {
                  const done = lesson.progress[0]?.completed;
                  const canAccess = !!enrollment || lesson.isFree;
                  return (
                    <Link
                      key={lesson.id}
                      href={canAccess ? `/course/${productId}/lesson/${lesson.id}` : `/product/${productId}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "13px 20px",
                        borderBottom: "1px solid #f8f8f8",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background 0.15s",
                      }}
                    >
                      <span style={{ color: done ? "#2a9d8f" : "#ccc" }}>
                        {done ? "✓" : lesson.type === "VIDEO" ? "▶" : lesson.type === "QUIZ" ? "?" : "📄"}
                      </span>
                      <span style={{ flex: 1, fontSize: "0.87rem", fontWeight: done ? 600 : 400, color: canAccess ? "#333" : "#bbb" }}>
                        {lesson.title}
                      </span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        {lesson.isFree && !enrollment && (
                          <span style={{ fontSize: "0.65rem", background: "#e9f7f6", color: "#2a9d8f", borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>
                            FREE
                          </span>
                        )}
                        {lesson.duration && (
                          <span style={{ fontSize: "0.72rem", color: "#bbb" }}>
                            {Math.round(lesson.duration / 60)}m
                          </span>
                        )}
                        {!canAccess && <span style={{ fontSize: "0.7rem" }}>🔒</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
