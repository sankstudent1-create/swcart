import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { PlayCircle, Clock, BookOpen, Award, CheckCircle, Lock, Video, HelpCircle, FileText, ChevronRight, Play, MonitorPlay } from "lucide-react";

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
      digitalAssets: true,
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
      <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
          <MonitorPlay size={40} className="text-muted" />
        </div>
        <h3 className="fw-black text-dark mb-2">Course not found</h3>
        <p className="text-muted">The course you are looking for does not exist or has been removed.</p>
        <Link href="/library" className="btn btn-dark rounded-pill px-4 mt-3 fw-bold">Back to Library</Link>
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
    <div className="font-jakarta" style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: "5rem" }}>
      
      {/* Cinematic Hero Section */}
      <div className="position-relative overflow-hidden mb-5" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", padding: "6rem 0", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
        {/* Abstract shapes */}
        <div className="position-absolute top-0 end-0 w-50 h-100" style={{ background: "radial-gradient(circle at top right, rgba(230,57,70,0.15) 0%, transparent 60%)" }} />
        <div className="position-absolute bottom-0 start-0 w-50 h-100" style={{ background: "radial-gradient(circle at bottom left, rgba(59,130,246,0.1) 0%, transparent 60%)" }} />
        
        <div className="container position-relative z-2">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 mb-4 px-3 py-1 rounded-pill" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="badge bg-danger rounded-pill px-2 py-1">PREMIUM COURSE</span>
                <span className="small fw-bold text-white-50 tracking-wide">LEARNING PLATFORM</span>
              </div>
              
              <h1 className="fw-black text-white mb-4" style={{ fontSize: "3.5rem", lineHeight: 1.1, letterSpacing: "-2px" }}>
                {product.title}
              </h1>
              
              {product.description && (
                <p className="fs-5 text-white-50 mb-5" style={{ maxWidth: 700, lineHeight: 1.6 }}>
                  {product.description}
                </p>
              )}

              {/* Stats Bar */}
              <div className="d-flex flex-wrap align-items-center gap-4 bg-white bg-opacity-10 p-3 rounded-4 backdrop-blur shadow-sm d-inline-flex">
                <div className="d-flex align-items-center gap-2">
                  <PlayCircle size={20} className="text-danger" />
                  <div>
                    <div className="text-white-50 small fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>LESSONS</div>
                    <div className="fw-bolder fs-5 lh-1">{totalLessons}</div>
                  </div>
                </div>
                <div className="border-start border-white border-opacity-25" style={{ height: 30 }} />
                <div className="d-flex align-items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  <div>
                    <div className="text-white-50 small fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>DURATION</div>
                    <div className="fw-bolder fs-5 lh-1">{totalMins} <span className="fs-6">min</span></div>
                  </div>
                </div>
                <div className="border-start border-white border-opacity-25" style={{ height: 30 }} />
                <div className="d-flex align-items-center gap-2">
                  <BookOpen size={20} className="text-warning" />
                  <div>
                    <div className="text-white-50 small fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>CHAPTERS</div>
                    <div className="fw-bolder fs-5 lh-1">{product.courseChapters.length}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action / Progress Card */}
            <div className="col-lg-4 mt-5 mt-lg-0">
              <div className="bg-white rounded-4 p-4 shadow-lg position-relative overflow-hidden">
                <div className="position-absolute top-0 start-0 w-100" style={{ height: 6, background: "linear-gradient(90deg, #e63946, #ef4444)" }} />
                
                {hasAccess ? (
                  <div>
                    <h5 className="fw-black text-dark mb-3">Your Progress</h5>
                    <div className="d-flex justify-content-between align-items-end mb-2">
                      <div className="fw-bolder text-dark" style={{ fontSize: "2.5rem", lineHeight: 1 }}>{progressPercent}%</div>
                      <div className="text-muted fw-bold small pb-1">{totalCompleted} / {totalLessons} done</div>
                    </div>
                    
                    <div className="progress mb-4 bg-light" style={{ height: 8, borderRadius: 10 }}>
                      <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${progressPercent}%`, borderRadius: 10 }} />
                    </div>

                    {totalCompleted === totalLessons && totalLessons > 0 ? (
                      <div className="bg-success bg-opacity-10 text-success p-3 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold mb-3">
                        <Award size={20} />
                        Course Completed!
                      </div>
                    ) : (
                      nextLesson && (
                        <Link
                          href={`/course/${productId}/lesson/${nextLesson.id}`}
                          className="btn btn-danger w-100 rounded-pill py-3 fw-bold fs-5 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        >
                          <Play size={20} fill="currentColor" />
                          {totalCompleted === 0 ? "Start Course" : "Continue Learning"}
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                      <Lock size={32} className="text-muted" />
                    </div>
                    <h5 className="fw-black text-dark mb-2">Course Locked</h5>
                    <p className="text-muted small mb-4">Enroll in this course to access the lessons and resources.</p>
                    <Link
                      href={`/product/${productId}`}
                      className="btn btn-dark w-100 rounded-pill py-3 fw-bold fs-5 shadow-sm"
                    >
                      View Details & Enroll
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            
            <h3 className="fw-black text-dark mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-journal-text text-danger"></i> Course Syllabus
            </h3>

            {/* Chapters Accordion-Style List */}
            <div className="d-flex flex-column gap-4">
              {product.courseChapters.map((ch, ci) => {
                const chDone = ch.lessons.filter((l) => l.progress[0]?.completed).length;
                const chTotal = ch.lessons.length;
                const isChCompleted = chTotal > 0 && chDone === chTotal;

                return (
                  <div key={ch.id} className="bg-white rounded-4 shadow-sm border border-light overflow-hidden">
                    {/* Chapter Header */}
                    <div className={`p-4 d-flex flex-wrap justify-content-between align-items-center gap-3 border-bottom ${isChCompleted ? 'bg-success bg-opacity-10' : 'bg-white'}`}>
                      <div className="d-flex align-items-center gap-3">
                        <div className={`rounded-3 d-flex align-items-center justify-content-center fw-bolder fs-5 shadow-sm ${isChCompleted ? 'bg-success text-white' : 'bg-light text-dark'}`} style={{ width: 48, height: 48 }}>
                          {ci + 1}
                        </div>
                        <div>
                          <div className="text-muted small fw-bold tracking-wide text-uppercase mb-1">CHAPTER {ci + 1}</div>
                          <h4 className="fw-bold text-dark m-0">{ch.title}</h4>
                        </div>
                      </div>
                      
                      <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-sm-block">
                          <div className="small fw-bold text-muted">{chDone} / {chTotal}</div>
                          <div className="progress mt-1" style={{ width: 80, height: 4, borderRadius: 2 }}>
                            <div className={`progress-bar ${isChCompleted ? 'bg-success' : 'bg-primary'}`} style={{ width: `${chTotal ? (chDone/chTotal)*100 : 0}%` }}></div>
                          </div>
                        </div>
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
                            className="list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 hover-bg-light transition-all"
                            style={{ background: done ? "rgba(16, 185, 129, 0.03)" : "transparent" }}
                          >
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                              {done ? (
                                <CheckCircle size={24} className="text-success" />
                              ) : (
                                <div className="rounded-circle border border-2 border-secondary border-opacity-25" style={{ width: 24, height: 24 }}></div>
                              )}
                            </div>

                            {/* Type Icon & Title */}
                            <div className="flex-grow-1 d-flex align-items-center gap-3 min-width-0">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${canAccess ? 'bg-danger bg-opacity-10 text-danger' : 'bg-light text-muted'}`} style={{ width: 40, height: 40 }}>
                                <Icon size={18} />
                              </div>
                              <div className="text-truncate">
                                <div className={`fw-bold text-truncate ${canAccess ? 'text-dark' : 'text-muted'}`} style={{ fontSize: "1.05rem" }}>
                                  {lesson.title}
                                </div>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                  {lesson.duration && lesson.duration > 0 && (
                                    <span className="text-muted fw-semibold small d-flex align-items-center gap-1">
                                      <Clock size={12} /> {Math.round(lesson.duration / 60)} min
                                    </span>
                                  )}
                                  {lesson.isFree && !hasAccess && (
                                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill" style={{ fontSize: "0.65rem" }}>FREE PREVIEW</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex-shrink-0 ps-3">
                              {!canAccess ? (
                                <Lock size={18} className="text-muted" />
                              ) : (
                                <ChevronRight size={20} className="text-muted" />
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

            {/* Resources Section */}
            {product.digitalAssets.length > 0 && (
              <div className="mt-5 pt-4 border-top">
                <h3 className="fw-black text-dark mb-4 d-flex align-items-center gap-2">
                  <i className="bi bi-folder text-warning"></i> Additional Resources
                </h3>
                <div className="row g-3">
                  {product.digitalAssets.map((asset) => (
                    <div key={asset.id} className="col-sm-6">
                      <div className="bg-white rounded-4 p-4 shadow-sm border h-100 d-flex flex-column transition-all hover-lift">
                        <div className="d-flex align-items-center gap-3 mb-4">
                          <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <div className="fw-bold text-dark fs-5">
                              {asset.assetType === "PDF" ? "PDF Document" : asset.assetType === "EBOOK" ? "eBook" : "Resource"}
                            </div>
                            <div className="text-muted small">Supplementary Material</div>
                          </div>
                        </div>
                        <a 
                          href={hasAccess ? asset.fileUrl : `/product/${productId}`}
                          target={hasAccess ? "_blank" : "_self"}
                          className={`btn ${hasAccess ? 'btn-outline-dark' : 'btn-light text-muted'} w-100 mt-auto rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2`}
                        >
                          {hasAccess ? <><i className="bi bi-download"></i> Download</> : <><Lock size={16} /> Locked</>}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      <style>{`
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
        .hover-bg-light:hover { background-color: #f8fafc !important; }
        .transition-all { transition: all 0.3s ease; }
        .backdrop-blur { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      `}</style>
    </div>
  );
}
