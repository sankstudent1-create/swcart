import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditSellerModal from "@/components/admin/EditSellerModal";
import { verifySellerAction } from "@/app/actions/crm";
import { deleteRecordAction } from "@/app/actions/db";
import { resolveImageUrl } from "@/lib/utils";

export default async function SellerErpDetail({ params }: { params: Promise<{ id: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { id } = await params;
  const seller = await prisma.seller.findUnique({
    where: { id },
    include: {
      user: true,
      products: { include: { variants: { include: { inventory: true } }, category: true } }
    }
  });

  if (!seller) return <div className="p-5 text-center">Seller not found</div>;

  let totalStock = 0;
  let lowStockProducts = 0;

  seller.products.forEach(p => {
    p.variants.forEach(v => {
      totalStock += v.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
      if (v.inventory && v.inventory.reduce((sum, inv) => sum + inv.quantity, 0) < 10) {
        lowStockProducts++;
      }
    });
  });

  return (
    <div>
      <div className="mb-4">
        <Link href="/spr/admin/sellers" className="text-muted text-decoration-none small fw-semibold hover-text-danger transition-all"><i className="bi bi-arrow-left me-1"></i> Back to Sellers</Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <i className="bi bi-shop me-3" style={{ color: "var(--red)" }}></i> {seller.companyName}
          </h2>
          <p className="text-muted mb-0">Operational dashboard and inventory metrics.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <EditSellerModal seller={seller} />
          {seller.isVerified ? 
            <form action={verifySellerAction.bind(null, seller.id, false) as any} className="m-0">
              <button type="submit" className="btn btn-outline-warning rounded-pill px-4 fw-semibold shadow-sm hover-scale transition-all">Revoke Verification</button>
            </form> :
            <form action={verifySellerAction.bind(null, seller.id, true) as any} className="m-0">
              <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm hover-scale transition-all">Approve Seller</button>
            </form>
          }
          <form action={deleteRecordAction as any} className="m-0">
            <input type="hidden" name="model" value="seller" />
            <input type="hidden" name="id" value={seller.id} />
            <button type="submit" className="btn btn-outline-danger rounded-pill px-4 fw-semibold shadow-sm hover-scale transition-all">Delete Seller</button>
          </form>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden hover-lift transition-all">
            <div className="position-absolute end-0 top-0 mt-3 me-3 text-primary opacity-25">
              <i className="bi bi-box-seam" style={{ fontSize: "3rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Active Products</h6>
            <h2 className="fw-black mb-1 display-6">{seller.products.length}</h2>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden hover-lift transition-all">
            <div className="position-absolute end-0 top-0 mt-3 me-3 text-info opacity-25">
              <i className="bi bi-stack" style={{ fontSize: "3rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Total Stock</h6>
            <h2 className="fw-black mb-1 display-6">{totalStock.toLocaleString()}</h2>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden hover-lift transition-all">
            <div className="position-absolute end-0 top-0 mt-3 me-3 text-danger opacity-25">
              <i className="bi bi-exclamation-triangle" style={{ fontSize: "3rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Low Stock Alerts</h6>
            <h2 className="fw-black mb-1 display-6 text-danger">{lowStockProducts}</h2>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden hover-lift transition-all">
            <div className="position-absolute end-0 top-0 mt-3 me-3 text-success opacity-25">
              <i className="bi bi-tags" style={{ fontSize: "3rem" }}></i>
            </div>
            <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Active Variants</h6>
            <h2 className="fw-black mb-1 display-6">{seller.products.reduce((sum, p) => sum + p.variants.length, 0)}</h2>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Inventory Matrix</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 border-light">
                <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
                  <tr>
                    <th className="fw-bold border-0 rounded-start py-3">Product Title</th>
                    <th className="fw-bold border-0 py-3">Category</th>
                    <th className="fw-bold border-0 py-3">Variants</th>
                    <th className="fw-bold border-0 py-3">Total Stock</th>
                    <th className="fw-bold border-0 rounded-end py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {seller.products.map(p => {
                    const stock = p.variants.reduce((acc: number, v: any) => acc + (v.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0), 0);
                    return (
                      <tr key={p.id} className="hover-bg-light transition-all">
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-3">
                            <img src={resolveImageUrl(p.images[0])} alt={p.title} className="rounded-3 shadow-sm border" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                            <div className="fw-bold text-dark">{p.title}</div>
                          </div>
                        </td>
                        <td className="text-muted small py-3 fw-semibold">{p.category.name}</td>
                        <td className="fw-bold text-dark py-3">{p.variants.length}</td>
                        <td className="fw-bold text-dark py-3">
                          {stock < 10 ? <span className="text-danger"><i className="bi bi-exclamation-circle-fill me-1"></i> {stock}</span> : stock}
                        </td>
                        <td className="py-3">
                          {stock > 0 ? 
                            <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1 rounded-pill">In Stock</span> : 
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1 rounded-pill">Out of Stock</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                  {seller.products.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-5 fw-semibold">No products registered by this seller.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .hover-text-danger:hover { color: var(--red) !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
