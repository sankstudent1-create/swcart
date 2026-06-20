import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updateCategoryAction } from "@/app/actions/crm";
import { resolveImageUrl } from "@/lib/utils";

export default async function CategoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        include: { seller: { include: { user: true } }, variants: true }
      }
    }
  });

  if (!category) return <div className="p-5 text-center">Category not found</div>;

  return (
    <div>
      <div className="mb-4">
        <a href="/spr/admin/categories" className="text-muted text-decoration-none small fw-semibold hover-text-danger transition-all"><i className="bi bi-arrow-left me-1"></i> Back to Categories</a>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <i className="bi bi-tag-fill me-3" style={{ color: "var(--red)" }}></i> {category.name}
          </h2>
          <p className="text-muted mb-0">Detailed view of all products in this category.</p>
        </div>
        <div className="d-flex gap-2">
          {/* Edit Category Form trigger could go here, but for simplicity we can use a dedicated modal or inline form. 
              Let's add a quick form directly below the header instead of a complex client component for now. */}
        </div>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0 mb-4">
        <h5 className="fw-bold mb-3"><i className="bi bi-pencil-square me-2 text-primary"></i> Edit Category Identity</h5>
        <form action={updateCategoryAction} className="row g-3">
          <input type="hidden" name="id" value={category.id} />
          <div className="col-md-5">
            <input name="name" className="form-control rounded-pill bg-light border-0 fw-semibold" defaultValue={category.name} required />
          </div>
          <div className="col-md-5">
            <input name="image" className="form-control rounded-pill bg-light border-0 fw-semibold" placeholder="Category Image URL" defaultValue={category.image || ""} />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-dark w-100 rounded-pill fw-bold hover-scale transition-all">Save</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <h5 className="fw-bold mb-4">Products in {category.name}</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border-light">
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
              <tr>
                <th className="fw-bold border-0 rounded-start py-3">Product</th>
                <th className="fw-bold border-0 py-3">Seller</th>
                <th className="fw-bold border-0 py-3">Base Price</th>
                <th className="fw-bold border-0 py-3">Variants</th>
                <th className="fw-bold border-0 rounded-end py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {category.products.map(p => (
                <tr key={p.id} className="hover-bg-light transition-all">
                  <td className="py-3">
                    <div className="d-flex align-items-center gap-3">
                      <img src={resolveImageUrl(p.images[0])} alt={p.title} className="rounded-3 shadow-sm border" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                      <div className="fw-bold text-dark">{p.title}</div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="fw-semibold text-dark">{p.seller.companyName}</div>
                    <div className="small text-muted">{p.seller.user.email}</div>
                  </td>
                  <td className="fw-bold text-dark py-3">₹{p.basePrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-muted fw-semibold">{p.variants.length} options</td>
                  <td className="py-3">
                    <Link href={`/spr/admin/products/${p.id}/edit`} className="btn btn-sm btn-light rounded-pill px-3 fw-semibold border shadow-sm hover-scale transition-all"><i className="bi bi-pencil me-1"></i> Edit Product</Link>
                  </td>
                </tr>
              ))}
              {category.products.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-5 fw-semibold">No products in this category yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .hover-text-danger:hover { color: var(--red) !important; }
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
