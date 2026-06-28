import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateSettingsAction } from "@/app/actions/admin-modules";

export default async function SettingsPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  let settings = await prisma.siteSetting.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSetting.create({
      data: { id: "GLOBAL", brandName: "Swcart", defaultGst: 18, deliveryFee: 50, freeShippingThresh: 499 }
    });
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Global Settings</h2>
      </div>
      
      <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0">
        <form action={updateSettingsAction as any}>
          <div className="row g-4">
            <div className="col-12">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Brand Identity</h5>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Brand Name</label>
              <input type="text" name="brandName" className="form-control rounded-3" defaultValue={settings.brandName} required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Support Email</label>
              <input type="email" name="contactEmail" className="form-control rounded-3" defaultValue={settings.contactEmail || ""} />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Support Phone</label>
              <input type="text" name="contactPhone" className="form-control rounded-3" defaultValue={settings.contactPhone || ""} />
            </div>

            <div className="col-12 mt-5">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Fees & Logistics</h5>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Default GST (%)</label>
              <input type="number" name="defaultGst" step="0.1" className="form-control rounded-3" defaultValue={settings.defaultGst} required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Base Delivery Fee (₹)</label>
              <input type="number" name="deliveryFee" className="form-control rounded-3" defaultValue={settings.deliveryFee} required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Free Shipping Threshold (₹)</label>
              <input type="number" name="freeShippingThresh" className="form-control rounded-3" defaultValue={settings.freeShippingThresh} required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase text-danger">Platform Commission (%)</label>
              <input type="number" name="platformCommission" step="0.1" className="form-control rounded-3 border-danger bg-danger bg-opacity-10" defaultValue={settings.platformCommission} required />
            </div>

            <div className="col-12 mt-5">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Referrals & Affiliates</h5>
            </div>
            <div className="col-md-6">
              <div className="form-check form-switch mt-2">
                <input 
                  type="checkbox" 
                  name="referralEnabled" 
                  id="referralEnabled"
                  className="form-check-input"
                  defaultChecked={settings.referralEnabled}
                  value="true"
                />
                <label className="form-check-label fw-semibold text-dark ms-2" htmlFor="referralEnabled">
                  Enable Referral & Affiliate System
                </label>
              </div>
              <p className="text-muted small mt-1">When enabled, users can generate affiliate invite invite links, and referral signups will earn wallet credits upon their first purchase.</p>
            </div>
          </div>

          <div className="mt-5 d-flex justify-content-end">
            <button type="submit" className="btn btn-danger rounded-pill px-5 fw-bold shadow-sm">Save Settings</button>
          </div>
        </form>
      </div>
    </div>
  );
}
