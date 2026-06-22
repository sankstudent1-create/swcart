import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { submitSellerApplicationAction } from "@/app/actions/seller";
import Link from "next/link";

export default async function SellPage() {
  const userId = await getSessionUserId();

  let isSeller = false;
  let applicationStatus: string | null = null;
  let applicationDetails: any = null;

  if (userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (seller) {
      isSeller = true;
    } else {
      const app = await prisma.sellerApplication.findUnique({ where: { userId } });
      if (app) {
        applicationStatus = app.status;
        applicationDetails = app;
      }
    }
  }

  return (
    <div className="container py-5" style={{ minHeight: "75vh" }}>
      {/* Banner */}
      <div className="text-center py-5 text-white rounded-4 shadow mb-5" style={{ background: "linear-gradient(135deg, var(--red) 0%, #aa0000 100%)" }}>
        <h1 className="fw-bold display-4 mb-3">Sell on Swcart</h1>
        <p className="fs-5 opacity-75 mx-auto" style={{maxWidth: "600px"}}>
          Reach millions of customers and grow your business globally with our powerful seller tools.
        </p>
      </div>

      <div className="row g-4 justify-content-center">
        {/* Form or Status Card */}
        <div className="col-lg-6">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light">
            {!userId ? (
              <div className="text-center py-4">
                <i className="bi bi-person-lock text-danger mb-3" style={{ fontSize: "3rem" }}></i>
                <h4 className="fw-bold text-dark">Sign In to Start Selling</h4>
                <p className="text-muted">You must be logged in to apply for a seller account.</p>
                <Link href="/login" className="btn btn-danger rounded-pill px-4 py-2 mt-3 fw-bold">
                  Log In Now
                </Link>
              </div>
            ) : isSeller ? (
              <div className="text-center py-4">
                <i className="bi bi-patch-check-fill text-success mb-3" style={{ fontSize: "4rem" }}></i>
                <h3 className="fw-bold text-dark">You are a Seller!</h3>
                <p className="text-muted">Your account is fully verified. You can now manage your store, upload products, and process orders.</p>
                <a href="/seller/dashboard" className="btn btn-success rounded-pill px-4 py-2 mt-3 fw-bold">
                  Go to Seller Dashboard <i className="bi bi-arrow-right ms-1"></i>
                </a>
              </div>
            ) : applicationStatus === "PENDING" ? (
              <div className="text-center py-4">
                <i className="bi bi-hourglass-split text-warning mb-3" style={{ fontSize: "4rem" }}></i>
                <h3 className="fw-bold text-dark">Application Pending</h3>
                <p className="text-muted">
                  Your seller application for <strong>&quot;{applicationDetails?.companyName}&quot;</strong> has been received and is currently being reviewed by our administration team.
                </p>
                <p className="text-muted small">We will review your registration shortly. Thank you for your patience!</p>
              </div>
            ) : (
              <>
                <h3 className="fw-bold text-dark mb-2">Apply as a Seller</h3>
                <p className="text-muted mb-4 small">Fill in the form below to register your brand and start listing products.</p>

                {applicationStatus === "REJECTED" && (
                  <div className="alert alert-danger mb-4 border-0 rounded-3 small">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Your previous seller application was rejected. Please review your details and submit again.
                  </div>
                )}

                <form action={submitSellerApplicationAction as any}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small text-uppercase">Company / Store Name</label>
                    <input type="text" name="companyName" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., Apex Tech Originals" required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small text-uppercase">GST Number (Optional)</label>
                    <input type="text" name="gstNumber" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., 22AAAAA1111A1Z1" />
                  </div>

                  <h5 className="fw-bold text-dark mt-4 mb-3 border-bottom pb-2" style={{ fontSize: "1rem" }}>
                    <i className="bi bi-bank me-2 text-muted"></i> Bank Details for Payouts
                  </h5>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small text-uppercase">Bank Account Number</label>
                    <input type="text" name="bankAccount" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., 123456789012" required />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small text-uppercase">IFSC Code</label>
                    <input type="text" name="bankIfsc" className="form-control bg-light border-0 shadow-sm py-2 px-3 fw-semibold" placeholder="e.g., SBIN0001234" required />
                  </div>

                  <button type="submit" className="btn btn-danger w-100 py-3 rounded-pill fw-bold shadow-sm hover-scale transition-all">
                    Submit Application
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Benefits Sidebar */}
        <div className="col-lg-5">
          <div className="bg-light p-4 p-md-5 rounded-4 h-100 border border-light d-flex flex-col justify-content-center">
            <h4 className="fw-bold text-dark mb-4"><i className="bi bi-trophy-fill text-warning me-2"></i> Why Sell on Swcart?</h4>
            
            <div className="d-flex gap-3 mb-4">
              <div className="fs-3 text-danger"><i className="bi bi-cash-coin"></i></div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Low Commissions</h6>
                <p className="text-muted small mb-0">We offer industry-low commission rates so you keep more of your hard-earned profits.</p>
              </div>
            </div>

            <div className="d-flex gap-3 mb-4">
              <div className="fs-3 text-danger"><i className="bi bi-graph-up-arrow"></i></div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Advanced Sales Dashboard</h6>
                <p className="text-muted small mb-0">Real-time statistics, inventory management, and charts to keep track of your performance.</p>
              </div>
            </div>

            <div className="d-flex gap-3 mb-4">
              <div className="fs-3 text-danger"><i className="bi bi-speedometer2"></i></div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Fast & Secure Payouts</h6>
                <p className="text-muted small mb-0">Direct bank transfers processed weekly with transparent reporting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
