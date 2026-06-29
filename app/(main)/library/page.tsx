import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { BookOpen, PlayCircle, Lock, MonitorPlay, ArrowRight } from "lucide-react";

export const metadata = {
  title: "My Library — swcart",
  description: "Access your purchased eBooks, courses and digital content.",
};

export default async function LibraryPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?next=/library");

  // Fetch all enrollments with product info and progress
  const enrollments = await prisma.userCourseEnrollment.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          digitalAssets: true,
          courseChapters: {
            include: {
              lessons: {
                include: {
                  progress: { where: { userId } },
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Also fetch eBooks purchased via orders (not enrollment)
  const ebookOrders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
      sellerOrders: {
        some: {
          items: {
            some: {
              variant: { product: { productType: { in: ["DIGITAL", "EBOOK"] } } },
            },
          },
        },
      },
    },
    include: {
      sellerOrders: {
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      digitalAssets: true,
                      courseChapters: {
                        include: {
                          lessons: {
                            include: { progress: { where: { userId } } }
                          }
                        }
                      }
                    }
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // De-duplicate digital products
  const digitalProducts = new Map<string, any>();
  for (const order of ebookOrders) {
    for (const sellerOrder of order?.sellerOrders || []) {
      for (const item of sellerOrder?.items || []) {
        const p = item?.variant?.product;
        if (p && (p.productType === "DIGITAL" || p.productType === "EBOOK") && !digitalProducts.has(p.id)) {
          digitalProducts.set(p.id, p);
        }
      }
    }
  }

  // Split into ebooks and courses based on whether they have course chapters
  const allDigitalProducts = Array.from(digitalProducts.values());
  const ebooks = allDigitalProducts.filter(p => !p.courseChapters || p.courseChapters.length === 0);
  const orderedCourses = allDigitalProducts.filter(p => p.courseChapters && p.courseChapters.length > 0);

  // Compute course progress for enrolled courses
  let courseItems = enrollments.filter(e => e.product).map((e) => {
    const allLessons = e.product.courseChapters?.flatMap((c) => c.lessons || []) || [];
    const completedCount = allLessons.filter((l) => l.progress?.some((p) => p.completed)).length || 0;
    const total = allLessons.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { product: e.product, pct, total, completedCount };
  });

  // Add courses bought via orders but not in enrollments
  const enrolledCourseIds = new Set(courseItems.map(c => c.product.id));
  for (const p of orderedCourses) {
    if (!enrolledCourseIds.has(p.id)) {
      const allLessons = p.courseChapters?.flatMap((c: any) => c.lessons || []) || [];
      const completedCount = allLessons.filter((l: any) => l.progress?.some((pr: any) => pr.completed)).length || 0;
      const total = allLessons.length;
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      courseItems.push({ product: p, pct, total, completedCount });
    }
  }

  const isEmpty = ebooks.length === 0 && courseItems.length === 0;

  return (
    <div className="container py-5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui", minHeight: "100vh" }}>
      
      {/* Header Redesign */}
      <div className="mb-5 position-relative p-5 rounded-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)", color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 60%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-50%", left: "-10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)", borderRadius: "50%", pointerEvents: "none" }} />
        
        <div className="position-relative z-1 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
          <div>
            <span className="badge mb-3 px-3 py-2" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", color: "#e9ecef", letterSpacing: "1px", fontWeight: 700 }}>YOUR DIGITAL VAULT</span>
            <h1 className="fw-black mb-2 text-white" style={{ fontSize: "2.5rem", letterSpacing: "-1px" }}>My Library</h1>
            <p className="mb-0 text-white-50 fs-5" style={{ maxWidth: 500 }}>Access your premium courses, eBooks, and digital resources anytime, anywhere.</p>
          </div>
          <div className="d-flex gap-3 bg-white bg-opacity-10 p-3 rounded-4" style={{ backdropFilter: "blur(10px)" }}>
            <div className="text-center px-3 border-end border-white border-opacity-25">
              <div className="fs-3 fw-bold text-white">{courseItems.length}</div>
              <div className="text-white-50 small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Courses</div>
            </div>
            <div className="text-center px-3">
              <div className="fs-3 fw-bold text-white">{ebooks.length}</div>
              <div className="text-white-50 small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>eBooks</div>
            </div>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="text-center py-5 rounded-4" style={{ background: "#f8fafc", border: "2px dashed #cbd5e1" }}>
          <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-4" style={{ width: 100, height: 100 }}>
            <BookOpen size={48} className="text-muted" strokeWidth={1.5} />
          </div>
          <h4 className="fw-black text-dark mb-2">Your library is empty</h4>
          <p className="text-muted mb-4" style={{ maxWidth: 400, margin: "0 auto" }}>You haven't unlocked any digital content yet. Browse our marketplace to find courses and eBooks.</p>
          <Link href="/categories" className="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-sm">
            Explore Marketplace
          </Link>
        </div>
      )}

      {/* Courses Section */}
      {courseItems.length > 0 && (
        <section className="mb-5 pb-4 border-bottom">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="fw-black text-dark m-0 d-flex align-items-center gap-2">
              <MonitorPlay size={24} className="text-danger" />
              Active Courses
            </h3>
          </div>
          
          <div className="row g-4">
            {courseItems.map(({ product: p, pct, total, completedCount }) => (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <Link href={`/course/${p.id}`} className="text-decoration-none">
                  <div className="card h-100 border-0 bg-white library-card" style={{ borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden", transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    
                    {/* Course Thumbnail */}
                    <div style={{ height: 180, background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : "linear-gradient(135deg, #1d3557, #457b9d)", position: "relative" }}>
                      <div className="position-absolute w-100 h-100" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)" }} />
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <PlayCircle size={60} color="rgba(255,255,255,0.8)" strokeWidth={1} style={{ transition: "transform 0.3s", cursor: "pointer" }} />
                      </div>
                      <span className="badge position-absolute" style={{ top: 16, right: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", borderRadius: 12, padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {pct}% COMPLETE
                      </span>
                    </div>

                    {/* Course Info */}
                    <div className="card-body p-4 d-flex flex-column">
                      <h5 className="fw-bold text-dark mb-3 line-clamp-2" style={{ lineHeight: 1.4 }}>{p.title}</h5>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small fw-bold">{completedCount} of {total} lessons</span>
                          <span className="fw-bold" style={{ color: pct === 100 ? "#10b981" : "var(--primary-red)", fontSize: "0.85rem" }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #e63946, #ef4444)", borderRadius: 10, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="bg-light px-4 py-3 border-top d-flex justify-content-between align-items-center">
                      <span className="fw-bold" style={{ color: pct === 100 ? "#10b981" : "#3b82f6", fontSize: "0.9rem" }}>
                        {pct === 0 ? "Start Learning" : pct === 100 ? "Review Course" : "Continue"}
                      </span>
                      <ArrowRight size={18} style={{ color: pct === 100 ? "#10b981" : "#3b82f6" }} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* eBooks Section */}
      {ebooks.length > 0 && (
        <section>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="fw-black text-dark m-0 d-flex align-items-center gap-2">
              <BookOpen size={24} className="text-danger" />
              eBooks Collection
            </h3>
          </div>
          
          <div className="row g-4">
            {ebooks.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <Link href={`/read/${p.id}`} className="text-decoration-none">
                  <div className="card h-100 border-0 bg-white library-card" style={{ borderRadius: 16, boxShadow: "0 8px 20px rgba(0,0,0,0.04)", overflow: "hidden", transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    
                    <div style={{ height: 200, background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : "linear-gradient(135deg, #e63946, #c1121f)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {!p.images?.[0] && <BookOpen size={64} color="rgba(255,255,255,0.5)" strokeWidth={1} />}
                    </div>
                    
                    <div className="card-body p-3">
                      <h6 className="fw-bold text-dark mb-2 line-clamp-2" style={{ lineHeight: 1.4, fontSize: "0.9rem" }}>{p.title}</h6>
                      <span className="badge bg-light text-primary border px-2 py-1" style={{ fontSize: "0.7rem", fontWeight: 700 }}>EBOOK / PDF</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .library-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important;
        }
      `}} />
    </div>
  );
}
