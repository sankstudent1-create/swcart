import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import CourseSidebar from "@/components/CourseSidebar";
import { PlayCircle, Clock, BookOpen, Award, CheckCircle, Lock, Video, HelpCircle, FileText } from "lucide-react";

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

  let hasAccess = false;

  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (enrollment) {
    hasAccess = true;
  } else {
    const paidOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        sellerOrders: {
          some: {
            items: {
              some: {
                variant: { product: { id: productId } }
              }
            }
          }
        }
      }
    });
    if (paidOrder) hasAccess = true;
  }

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
    return (
      <div className="container py-5 text-center d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <h4 className="fw-bold text-muted">Course not found</h4>
      </div>
    );
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

  const progressPercent = totalLessons === 0 ? 0 : Math.round((totalCompleted / totalLessons) * 100);

  // First incomplete lesson (for "continue" button)
  const nextLesson = allLessons.find((l) => !l.completed) ?? allLessons[0];

  return (
    <div className="container-fluid py-4" style={{ fontFamily: "'Plus Jakarta Sans',system-ui", background: "#f8f9fa", minHeight: "100vh" }}>
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-lg-4 col-xl-3">
          <CourseSidebar
            productId={productId}
            chapters={chaptersForSidebar}
            enrolled={hasAccess}
            totalCompleted={totalCompleted}
            totalLessons={totalLessons}
          />
        </div>

        {/* Main content */}
        <div className="col-12 col-lg-8 col-xl-9">
          {/* Hero Redesign */}
          <div
            className="position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
              borderRadius: 24,
              padding: "48px 40px",
              color: "#fff",
              marginBottom: 32,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            {/* Background Decorative Element */}
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-10%",
                width: 400,
                height: 400,
                background: "radial-gradient(circle, rgba(230,57,70,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />

            <div className="position-relative z-1">
              <span
                className="badge mb-3 px-3 py-2"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", color: "#e9ecef", letterSpacing: "1px", fontWeight: 700 }}
              >
                COURSE VIEWER
              </span>
              <h1 className="fw-black mb-3 text-white" style={{ fontSize: "2.5rem", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                {product.title}
              </h1>
              {product.description && (
                <p className="mb-4" style={{ opacity: 0.8, fontSize: "1.05rem", maxWidth: 650, lineHeight: 1.6 }}>
                  {product.description}
                </p>
              )}

              {/* Stats row */}
              <div className="d-flex flex-wrap gap-4 mb-4" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                <div className="d-flex align-items-center gap-2">
                  <PlayCircle size={18} className="text-danger" />
                  <span className="fw-semibold">{totalLessons} Lessons</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Clock size={18} className="text-danger" />
                  <span className="fw-semibold">{totalMins} Min Total</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <BookOpen size={18} className="text-danger" />
                  <span className="fw-semibold">{product.courseChapters.length} Chapters</span>
                </div>
                {totalCompleted === totalLessons && totalLessons > 0 && (
                  <div className="d-flex align-items-center gap-2 text-success">
                    <Award size={18} />
                    <span className="fw-bold">Course Completed!</span>
                  </div>
                )}
              </div>

              {/* Progress Bar (Only show if they own it) */}
              {hasAccess && (
                <div className="mb-4" style={{ maxWidth: 400 }}>
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    <span style={{ opacity: 0.8 }}>Your Progress</span>
                    <span className="text-danger">{progressPercent}%</span>
                  </div>
                  <div className="progress" style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 10 }}>
                    <div
                      className="progress-bar bg-danger"
                      role="progressbar"
                      style={{ width: `${progressPercent}%`, borderRadius: 10 }}
                    />
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-2">
                {hasAccess ? (
                  nextLesson ? (
                    <Link
                      href={`/course/${productId}/lesson/${nextLesson.id}`}
                      className="btn btn-danger btn-lg px-4 py-2 shadow-sm d-inline-flex align-items-center gap-2"
                      style={{ borderRadius: 14, fontWeight: 700, transition: "transform 0.2s ease" }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
                    >
                      <PlayCircle size={20} />
                      {totalCompleted === 0 ? "Start Course" : "Continue Learning"}
                    </Link>
                  ) : null
                ) : (
                  <Link
                    href={`/product/${productId}`}
                    className="btn btn-warning btn-lg px-4 py-2 shadow-sm d-inline-flex align-items-center gap-2 text-dark"
                    style={{ borderRadius: 14, fontWeight: 800, transition: "transform 0.2s ease" }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
                  >
                    <Lock size={18} />
                    Enroll Now
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Chapters and Lessons */}
          <div className="d-flex flex-column gap-4">
            {product.courseChapters.map((ch, ci) => {
              const chDone = ch.lessons.filter((l) => l.progress[0]?.completed).length;
              const chTotal = ch.lessons.length;
              const isChCompleted = chTotal > 0 && chDone === chTotal;

              return (
                <div
                  key={ch.id}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    overflow: "hidden",
                  }}
                >
                  {/* Chapter Header */}
                  <div
                    style={{
                      padding: "20px 24px",
                      background: isChCompleted ? "#f8fffb" : "#fff",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3 className="m-0 text-dark d-flex align-items-center gap-3" style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                      <span
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: isChCompleted ? "#d1fae5" : "#f1f3f5",
                          color: isChCompleted ? "#059669" : "#495057",
                          fontSize: "0.9rem",
                        }}
                      >
                        {ci + 1}
                      </span>
                      {ch.title}
                    </h3>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-pill" style={{ background: isChCompleted ? "#059669" : "#e9ecef", color: isChCompleted ? "#fff" : "#495057", fontWeight: 700, padding: "6px 12px" }}>
                        {chDone} / {chTotal} Completed
                      </span>
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="list-group list-group-flush">
                    {ch.lessons.map((lesson) => {
                      const done = lesson.progress[0]?.completed;
                      const canAccess = hasAccess || lesson.isFree;
                      
                      const Icon = lesson.type === "VIDEO" ? Video : lesson.type === "QUIZ" ? HelpCircle : FileText;

                      return (
                        <Link
                          key={lesson.id}
                          href={canAccess ? `/course/${productId}/lesson/${lesson.id}` : `/product/${productId}`}
                          className="list-group-item list-group-item-action border-0 d-flex align-items-center"
                          style={{
                            padding: "16px 24px",
                            gap: 16,
                            transition: "all 0.2s ease",
                            background: done ? "rgba(42,157,143,0.02)" : "transparent",
                          }}
                          onMouseOver={(e) => {
                            if (canAccess) e.currentTarget.style.background = "#f8f9fa";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = done ? "rgba(42,157,143,0.02)" : "transparent";
                          }}
                        >
                          {/* Status Icon */}
                          <div
                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: done ? "#10b981" : "transparent",
                              border: done ? "none" : "2px solid #dee2e6",
                              color: "#fff",
                            }}
                          >
                            {done && <CheckCircle size={16} strokeWidth={3} />}
                          </div>

                          {/* Content Type Icon */}
                          <div style={{ color: canAccess ? "#1f2937" : "#adb5bd" }}>
                            <Icon size={18} strokeWidth={2.5} />
                          </div>

                          {/* Title */}
                          <div className="flex-grow-1" style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "0.95rem", fontWeight: done ? 700 : 600, color: canAccess ? "#1f2937" : "#868e96" }}>
                              {lesson.title}
                            </span>
                          </div>

                          {/* Badges / Duration */}
                          <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            {lesson.isFree && !hasAccess && (
                              <span
                                className="badge text-uppercase"
                                style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "0.65rem", padding: "4px 8px" }}
                              >
                                Free Preview
                              </span>
                            )}
                            {lesson.duration && lesson.duration > 0 && (
                              <span className="fw-semibold" style={{ fontSize: "0.8rem", color: "#adb5bd" }}>
                                {Math.round(lesson.duration / 60)} min
                              </span>
                            )}
                            {!canAccess && (
                              <div style={{ padding: "4px 8px", background: "#f1f3f5", borderRadius: 8, color: "#adb5bd" }}>
                                <Lock size={14} />
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
