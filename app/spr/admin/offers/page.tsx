import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { createOfferAction, deleteOfferAction } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminOffersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const offers = await prisma.offer.findMany({
    orderBy: { validUntil: "asc" }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Promotional Offers</h2>
          <p className="text-muted mb-0">Create, schedule, and showcase marketing banner offers on the homepage.</p>
        </div>
        <Link href="/spr/admin" className="btn btn-outline-dark rounded-pill px-4 fw-bold">
          <i className="bi bi-arrow-left me-1"></i> Dashboard
        </Link>
      </div>

      <div className="row g-4">
        {/* Create Offer Form */}
        <div className="col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <h5 className="fw-bold text-dark mb-4"><i className="bi bi-gift-fill me-2 text-warning"></i> Create New Offer</h5>
            
            <form action={createOfferAction as any}>
              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Offer Title</label>
                <input type="text" name="title" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-bold" placeholder="e.g., 50% Off On Men's Shirts" required />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Description</label>
                <textarea name="description" rows={3} className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="Details or conditions of this offer..."></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Banner Image URL</label>
                <input type="text" name="bannerImage" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., /banner-offers.png" />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Valid From</label>
                  <input type="date" name="validFrom" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Valid Until</label>
                  <input type="date" name="validUntil" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" required />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-muted small text-uppercase">Status</label>
                <select name="isActive" className="form-select bg-light border-0 shadow-sm py-2 px-3 fw-semibold" required>
                  <option value="true">Active (Visible)</option>
                  <option value="false">Inactive (Hidden)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-danger w-100 py-3 rounded-pill fw-bold shadow-sm hover-scale transition-all">
                Create Offer
              </button>
            </form>
          </div>
        </div>

        {/* Offer list */}
        <div className="col-lg-8">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <h5 className="fw-bold text-dark mb-4">Promotional Banners ({offers.length})</h5>

            {offers.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-gift text-muted" style={{ fontSize: "3rem" }}></i>
                <h5 className="mt-3 fw-bold text-dark">No Offers Available</h5>
                <p className="text-muted">Generate special campaigns to display banners on the storefront.</p>
              </div>
            ) : (
              <div className="row g-4">
                {offers.map((offer) => (
                  <div className="col-md-6" key={offer.id}>
                    <div className="card h-100 border border-light rounded-4 overflow-hidden shadow-sm">
                      {offer.bannerImage && (
                        <img src={offer.bannerImage} className="card-img-top" alt={offer.title} style={{ height: "160px", objectFit: "cover" }} />
                      )}
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold text-dark mb-0">{offer.title}</h6>
                          <span className={`badge rounded-pill ${offer.isActive ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25" : "bg-secondary bg-opacity-10 text-secondary border"}`}>
                            {offer.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        
                        {offer.description && (
                          <p className="text-muted small mb-3">{offer.description}</p>
                        )}
                        
                        <div className="text-muted small border-top pt-3">
                          <div><strong>From:</strong> {new Date(offer.validFrom).toLocaleDateString()}</div>
                          <div><strong>Until:</strong> {new Date(offer.validUntil).toLocaleDateString()}</div>
                        </div>

                        <div className="text-end mt-3 border-top pt-3">
                          <form action={deleteOfferAction.bind(null, offer.id) as any}>
                            <button type="submit" className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-sm">
                              <i className="bi bi-trash me-1"></i> Delete Campaign
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
