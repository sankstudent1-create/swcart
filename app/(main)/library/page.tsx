import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { BookOpen, PlayCircle, Lock } from "lucide-react";

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
                  product: { include: { digitalAssets: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // De-duplicate ebook products
  const ebookProducts = new Map<string, any>();
  for (const order of ebookOrders) {
    for (const sellerOrder of order.sellerOrders) {
      for (const item of sellerOrder.items) {
        const p = item.variant.product;
        if ((p.productType === "DIGITAL" || p.productType === "EBOOK") && !ebookProducts.has(p.id)) {
          ebookProducts.set(p.id, p);
        }
      }
    }
  }
  const ebooks = Array.from(ebookProducts.values());

  // Compute course progress
  const courseItems = enrollments.map((e) => {
    const allLessons = e.product.courseChapters.flatMap((c) => c.lessons);
    const completedCount = allLessons.filter((l) => l.progress.some((p) => p.completed)).length;
    const total = allLessons.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { enrollment: e, product: e.product, pct, total, completedCount };
  });

  const isEmpty = ebooks.length === 0 && courseItems.length === 0;

  return (
    <div className="container py-5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="fw-black" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
          My Library
        </h1>
        <p className="text-muted mb-0">Your purchased eBooks and courses — read or watch anytime.</p>
      </div>

      {isEmpty && (
        <div
          className="text-center py-5"
          style={{
            background: "linear-gradient(135deg,#f8f9fa,#e9ecef)",
            borderRadius: 20,
            border: "2px dashed #dee2e6",
          }}
        >
          <BookOpen size={56} strokeWidth={1.2} className="text-muted mb-3" />
          <h5 className="fw-bold text-muted">No digital products yet</h5>
          <p className="text-muted small">Browse our eBooks and courses to get started.</p>
          <Link href="/product?type=digital" className="btn btn-danger mt-2">
            Explore Digital Products
          </Link>
        </div>
      )}

      {/* eBooks */}
      {ebooks.length > 0 && (
        <section className="mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "1.2rem" }}>
            <BookOpen size={20} className="me-2 text-danger" />
            eBooks
          </h2>
          <div className="row g-3">
            {ebooks.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{ borderRadius: 16, overflow: "hidden", transition: "transform .15s" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.transform = "none")
                  }
                >
                  {/* Cover */}
                  <div
                    style={{
                      height: 160,
                      background: "linear-gradient(135deg,#e63946,#c1121f)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen size={48} color="rgba(255,255,255,0.8)" />
                  </div>
                  <div className="card-body p-3">
                    <p className="fw-bold mb-1 small" style={{ lineClamp: 2 }}>
                      {p.title}
                    </p>
                    <Link
                      href={`/read/${p.id}`}
                      className="btn btn-sm btn-danger w-100 mt-2"
                      style={{ borderRadius: 8 }}
                    >
                      Read Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Courses */}
      {courseItems.length > 0 && (
        <section>
          <h2 className="fw-bold mb-3" style={{ fontSize: "1.2rem" }}>
            <PlayCircle size={20} className="me-2 text-danger" />
            Courses
          </h2>
          <div className="row g-3">
            {courseItems.map(({ product: p, pct, total, completedCount }) => (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{ borderRadius: 16, overflow: "hidden" }}
                >
                  <div
                    style={{
                      height: 140,
                      background: "linear-gradient(135deg,#1d3557,#457b9d)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <PlayCircle size={48} color="rgba(255,255,255,0.8)" />
                    {/* Progress badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {pct}% done
                    </span>
                  </div>
                  <div className="card-body p-3">
                    <p className="fw-bold mb-1 small">{p.title}</p>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: 5,
                        background: "#e9ecef",
                        borderRadius: 4,
                        marginBottom: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: pct === 100 ? "#2a9d8f" : "#e63946",
                          borderRadius: 4,
                          transition: "width .4s",
                        }}
                      />
                    </div>
                    <p className="text-muted" style={{ fontSize: "0.72rem", marginBottom: 10 }}>
                      {completedCount} of {total} lessons complete
                    </p>
                    <Link
                      href={`/course/${p.id}`}
                      className="btn btn-sm w-100"
                      style={{
                        borderRadius: 8,
                        background: pct === 100 ? "#2a9d8f" : "#1d3557",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {pct === 0 ? "Start Course" : pct === 100 ? "Revisit" : "Continue"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
