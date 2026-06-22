import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { createCouponAction, deleteCouponAction } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminCouponsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const coupons = await prisma.coupon.findMany({
    orderBy: { validUntil: "asc" }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Coupon Management</h2>
          <p className="text-muted mb-0">Create, manage, and distribute discount coupons.</p>
        </div>
        <Link href="/spr/admin" className="btn btn-outline-dark rounded-pill px-4 fw-bold">
          <i className="bi bi-arrow-left me-1"></i> Dashboard
        </Link>
      </div>

      <div className="row g-4">
        {/* Create Coupon Form */}
        <div className="col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <h5 className="fw-bold text-dark mb-4"><i className="bi bi-tag-fill me-2 text-danger"></i> Create New Coupon</h5>
            
            <form action={createCouponAction as any}>
              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Coupon Code</label>
                <input type="text" name="code" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-bold" placeholder="e.g., WINTER50" required style={{ letterSpacing: "1px" }} />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Type</label>
                  <select name="discountType" className="form-select bg-light border-0 shadow-sm py-2 px-3 fw-semibold" required>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Value</label>
                  <input type="number" name="discountVal" step="0.01" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., 10 or 150" required />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Min Spend (₹)</label>
                  <input type="number" name="minSpend" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., 499" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Max Discount (₹)</label>
                  <input type="number" name="maxDiscount" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., 200" />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Valid Until</label>
                <input type="date" name="validUntil" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" required />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-muted small text-uppercase">Usage Limit (per user)</label>
                <input type="number" name="usageLimit" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., 100" />
              </div>

              <button type="submit" className="btn btn-danger w-100 py-3 rounded-pill fw-bold shadow-sm hover-scale transition-all">
                Create Coupon
              </button>
            </form>
          </div>
        </div>

        {/* Coupon list */}
        <div className="col-lg-8">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <h5 className="fw-bold text-dark mb-4">Active Coupons ({coupons.length})</h5>

            {coupons.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-tag text-muted" style={{ fontSize: "3rem" }}></i>
                <h5 className="mt-3 fw-bold text-dark">No Coupons Created</h5>
                <p className="text-muted">Generate discount codes to encourage sales.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 border-light">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th className="fw-bold border-0 py-3">Code</th>
                      <th className="fw-bold border-0 py-3">Discount</th>
                      <th className="fw-bold border-0 py-3">Min Spend</th>
                      <th className="fw-bold border-0 py-3">Valid Until</th>
                      <th className="fw-bold border-0 py-3">Used</th>
                      <th className="fw-bold border-0 py-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="py-3">
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-2 fw-bold" style={{ letterSpacing: "0.5px" }}>
                            {coupon.code}
                          </span>
                        </td>
                        <td className="py-3 fw-bold text-dark">
                          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountVal}%` : `₹${coupon.discountVal}`}
                        </td>
                        <td className="py-3 text-muted">
                          {coupon.minSpend ? `₹${coupon.minSpend}` : "None"}
                        </td>
                        <td className="py-3 text-muted small fw-semibold">
                          {new Date(coupon.validUntil).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span className="text-dark fw-bold">{coupon.usedCount}</span>
                          {coupon.usageLimit ? <span className="text-muted"> / {coupon.usageLimit}</span> : null}
                        </td>
                        <td className="py-3 text-end">
                          <form action={deleteCouponAction.bind(null, coupon.id) as any}>
                            <button type="submit" className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-sm">
                              <i className="bi bi-trash me-1"></i> Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
