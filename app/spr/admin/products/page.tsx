import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminProductsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, seller: { include: { user: true } }, variants: true }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Products Directory</h2>
        <button className="btn btn-dark rounded-pill px-4 shadow-sm fw-semibold hover-scale transition-all">
          <i className="bi bi-plus-lg me-2"></i> Add Product
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border-light">
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
              <tr>
                <th className="fw-bold border-0 rounded-start py-3">Product</th>
                <th className="fw-bold border-0 py-3">Category</th>
                <th className="fw-bold border-0 py-3">Base Price</th>
                <th className="fw-bold border-0 py-3">Variants</th>
                <th className="fw-bold border-0 rounded-end py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {products.map(p => (
                <tr key={p.id} className="hover-bg-light transition-all">
                  <td className="py-3">
                    <div className="d-flex align-items-center gap-3">
                      <img src={p.images[0] || "https://placehold.co/100x100?text=No+Image"} alt={p.title} className="rounded-3 shadow-sm border" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                      <div>
                        <div className="fw-bold text-dark">{p.title}</div>
                        <div className="text-muted small">By {p.seller.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted py-3">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary rounded-pill px-3 py-2 fw-semibold">{p.category.name}</span>
                  </td>
                  <td className="fw-bold text-dark py-3">₹{p.basePrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 fw-semibold text-muted">{p.variants.length} options</td>
                  <td className="py-3">
                    <button className="btn btn-sm btn-light rounded-pill px-3 me-2 fw-semibold text-dark shadow-sm border"><i className="bi bi-pencil-square me-1"></i> Edit</button>
                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold shadow-sm"><i className="bi bi-trash me-1"></i> Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5 fw-semibold">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
