import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateProductAction } from "@/app/actions/crm";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/utils";

export default async function ProductMasterEdit({ params }: { params: Promise<{ id: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { include: { user: true } },
      variants: { include: { inventory: true } }
    }
  });

  if (!product) return <div className="p-5 text-center">Product not found</div>;

  const categories = await prisma.category.findMany();

  return (
    <div>
      <div className="mb-4">
        <Link href="/spr/admin/categories" className="text-muted text-decoration-none small fw-semibold hover-text-danger transition-all"><i className="bi bi-arrow-left me-1"></i> Back</Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Master Product Editor</h2>
          <p className="text-muted mb-0">Directly modify listing details and imagery.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold mb-4">Core Details</h5>
            <form action={updateProductAction}>
              <input type="hidden" name="id" value={product.id} />
              
              <div className="mb-4">
                <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Product Title</label>
                <input name="title" className="form-control form-control-lg bg-light border-0 shadow-sm fw-semibold" defaultValue={product.title} required />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Description</label>
                <textarea name="description" className="form-control bg-light border-0 shadow-sm" rows={4} defaultValue={product.description} required></textarea>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Base Price (₹)</label>
                  <input type="number" name="basePrice" className="form-control form-control-lg bg-light border-0 shadow-sm fw-semibold text-success" defaultValue={product.basePrice} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Category</label>
                  <select name="categoryId" className="form-select form-select-lg bg-light border-0 shadow-sm fw-semibold" defaultValue={product.categoryId} required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Images (Comma separated URLs)</label>
                <textarea name="images" className="form-control bg-light border-0 shadow-sm" rows={3} defaultValue={product.images.join(", ")}></textarea>
              </div>

              <div className="d-flex justify-content-end border-top pt-4">
                <button type="submit" className="btn text-white rounded-pill px-5 shadow-sm fw-bold hover-scale transition-all" style={{ backgroundColor: "var(--red)" }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border-0 text-center">
              <h5 className="fw-bold mb-3">Live Preview</h5>
              <img src={resolveImageUrl(product.images[0])} alt="Preview" className="img-fluid rounded-4 shadow-sm border mb-3" style={{ maxHeight: "250px", objectFit: "cover" }} />
              <div className="fw-bold text-dark fs-5">{product.title}</div>
              <div className="text-success fw-black fs-4">₹{product.basePrice}</div>
            </div>

            <div className="bg-primary bg-opacity-10 p-4 rounded-4 border border-primary border-opacity-25">
              <h5 className="fw-bold text-primary mb-3"><i className="bi bi-box-seam me-2"></i> Variants & Stock</h5>
              <ul className="list-unstyled mb-0">
                {product.variants.map(v => {
                  const stock = v.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                  return (
                    <li key={v.id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-primary border-opacity-25">
                      <div className="fw-semibold text-dark">{v.size || "Standard"} {v.color && `(${v.color})`}</div>
                      <div className={`fw-bold ${stock < 10 ? 'text-danger' : 'text-success'}`}>{stock} in stock</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .hover-scale:hover { transform: scale(1.02); }
        .hover-text-danger:hover { color: var(--red) !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
