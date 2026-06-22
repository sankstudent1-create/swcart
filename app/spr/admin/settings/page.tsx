import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateSettingsAction } from "@/app/actions/admin";

export default async function AdminSettingsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const settings = await prisma.siteSetting.findUnique({ where: { id: "GLOBAL" } });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Global Settings</h2>
          <p className="text-muted mb-0">Configure your store's core parameters.</p>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0">
            <form action={updateSettingsAction as any}>
              <h5 className="fw-bold mb-4 d-flex align-items-center"><i className="bi bi-truck fs-4 me-2 text-primary"></i> Shipping & Delivery</h5>
              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Base Delivery Fee (₹)</label>
                  <input type="number" name="deliveryFee" className="form-control form-control-lg bg-light border-0 shadow-sm fw-semibold" defaultValue={settings?.deliveryFee || 50} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Free Shipping Threshold (₹)</label>
                  <input type="number" name="freeShippingThresh" className="form-control form-control-lg bg-light border-0 shadow-sm fw-semibold" defaultValue={settings?.freeShippingThresh || 499} required />
                </div>
              </div>

              <h5 className="fw-bold mb-4 d-flex align-items-center"><i className="bi bi-receipt fs-4 me-2 text-success"></i> Taxes & Support</h5>
              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Default GST (%)</label>
                  <input type="number" name="defaultGst" className="form-control form-control-lg bg-light border-0 shadow-sm fw-semibold" defaultValue={settings?.defaultGst || 18} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>Support Email</label>
                  <input type="email" name="contactEmail" className="form-control form-control-lg bg-light border-0 shadow-sm fw-semibold" defaultValue={settings?.contactEmail || "support@swcart.com"} required />
                </div>
              </div>

              <h5 className="fw-bold mb-4 d-flex align-items-center"><i className="bi bi-shop fs-4 me-2 text-warning"></i> Sellers & Vendors</h5>
              <div className="row g-4 mb-5">
                <div className="col-12">
                  <div className="form-check form-switch bg-light p-3 rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                    <div className="ms-2">
                      <label className="form-check-label fw-bold text-dark" htmlFor="autoApproveSellers">Auto-Approve Seller Applications</label>
                      <div className="text-muted small">Immediately grant seller accounts and roles upon submission without manual approval.</div>
                    </div>
                    <input className="form-check-input me-2" type="checkbox" name="autoApproveSellers" id="autoApproveSellers" value="true" defaultChecked={settings?.autoApproveSellers !== false} style={{ width: "3em", height: "1.5em", cursor: "pointer" }} />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end pt-3 border-top">
                <button type="submit" className="btn btn-dark btn-lg rounded-pill px-5 shadow-sm fw-bold hover-scale transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="bg-primary bg-opacity-10 p-4 rounded-4 border border-primary border-opacity-25 h-100">
            <h5 className="fw-bold text-primary mb-3"><i className="bi bi-info-circle-fill me-2"></i> How it works</h5>
            <p className="text-muted small">These settings instantly apply to the live storefront.</p>
            <ul className="text-muted small ps-3">
              <li className="mb-2"><strong>Base Delivery Fee</strong>: Added to all carts below the free shipping threshold.</li>
              <li className="mb-2"><strong>Free Shipping Threshold</strong>: Carts above this amount will not be charged the delivery fee.</li>
              <li className="mb-2"><strong>Default GST</strong>: The tax rate applied to products if no specific category tax is defined.</li>
            </ul>
          </div>
        </div>
      </div>
      <style>{`
        .hover-scale:hover { transform: scale(1.02); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
