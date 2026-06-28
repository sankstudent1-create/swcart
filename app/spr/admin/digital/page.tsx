import { prisma } from "@/lib/db";
import { PlayCircle, FileText, CheckCircle, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Digital Products — Admin" };

export default async function AdminDigitalProductsPage() {
  const products = await prisma.product.findMany({
    where: { productType: { in: ["DIGITAL", "SERVICE"] } },
    include: {
      seller: { select: { companyName: true, user: { select: { name: true } } } },
      digitalAssets: true,
      courseChapters: {
        include: { lessons: true },
      },
      _count: {
        select: { courseEnrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-fluid py-4" style={{ fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1" style={{ color: "#1a1a2e" }}>Digital Products</h2>
          <p className="text-muted mb-0">Manage eBooks, Courses, and enrollments across the platform.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Product</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Type</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Seller</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Content</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Enrollments</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No digital products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isCourse = p.courseChapters.length > 0;
                  const totalLessons = p.courseChapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
                  const isEbook = p.digitalAssets.some(a => a.assetType === "EBOOK" || a.assetType === "PDF");

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="fw-bold" style={{ color: "#1a1a2e" }}>{p.title}</div>
                        <div className="text-muted small">₹{p.basePrice}</div>
                      </td>
                      <td>
                        <span className={`badge bg-${isCourse ? 'primary' : 'danger'} rounded-pill px-3 py-2`}>
                          {isCourse ? "COURSE" : isEbook ? "EBOOK" : p.productType}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{p.seller?.companyName || p.seller?.user?.name || "Unknown"}</div>
                      </td>
                      <td>
                        {isCourse ? (
                          <div className="small text-muted">
                            <span className="me-2"><PlayCircle size={14} className="me-1" />{totalLessons} Lessons</span>
                            <span>({p.courseChapters.length} Chapters)</span>
                          </div>
                        ) : isEbook ? (
                          <div className="small text-muted">
                            <FileText size={14} className="me-1" /> 1 PDF File
                          </div>
                        ) : (
                          <span className="text-muted small">No assets</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-success rounded-pill px-3 py-2">
                          {p._count.courseEnrollments} Enrolled
                        </span>
                      </td>
                      <td>
                        <Link href={`/product/${p.id}`} className="btn btn-sm btn-light border" target="_blank">
                          View Store
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
