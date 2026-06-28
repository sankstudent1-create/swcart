import { prisma } from "@/lib/db";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function ReferralsAdminPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  // 1. Fetch Referrals with Referrer, Referred User and Referred User's orders
  const referrals = await prisma.referral.findMany({
    include: {
      referrer: true,
      referred: {
        include: {
          orders: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // 2. Fetch Affiliate Links & Clicks
  const affiliateLinks = await prisma.affiliateLink.findMany({
    include: {
      clicks: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch creators for affiliate links in memory
  const linkCreatorIds = Array.from(new Set(affiliateLinks.map(l => l.userId)));
  const creators = await prisma.user.findMany({
    where: { id: { in: linkCreatorIds } },
    select: { id: true, name: true, email: true }
  });
  const creatorsMap = new Map(creators.map(c => [c.id, c]));

  // 3. Calculate Analytics
  const totalInvited = referrals.length;
  const completedInvited = referrals.filter(r => r.status === "COMPLETED").length;
  const pendingInvited = referrals.filter(r => r.status === "PENDING").length;
  const totalClicks = affiliateLinks.reduce((acc, l) => acc + l.clicks.length, 0);

  return (
    <div className="container-fluid font-jakarta text-dark">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Referral & Affiliate Tracking</h2>
          <div className="text-muted small">Monitor invite links, clicks, and referred user purchase conversion.</div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-bold text-uppercase mb-1">Total Invited Signups</div>
            <div className="fs-3 fw-bold text-primary">{totalInvited}</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center" style={{ borderBottom: "4px solid var(--bs-success) !important" }}>
            <div className="text-muted small fw-bold text-uppercase mb-1">Completed Purchases</div>
            <div className="fs-3 fw-bold text-success">{completedInvited}</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center" style={{ borderBottom: "4px solid var(--bs-warning) !important" }}>
            <div className="text-muted small fw-bold text-uppercase mb-1">Pending Purchases</div>
            <div className="fs-3 fw-bold text-warning">{pendingInvited}</div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-bold text-uppercase mb-1">Total Link Clicks</div>
            <div className="fs-3 fw-bold text-dark">{totalClicks}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Referred Users Table */}
        <div className="col-12 col-xl-7">
          <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
            <h5 className="fw-bold mb-4"><i className="bi bi-people-fill text-danger me-2"></i> Invited Users & Activity</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Invited By (Referrer)</th>
                    <th className="border-0">Joined User</th>
                    <th className="border-0">Joined Date</th>
                    <th className="border-0">Status</th>
                    <th className="border-0">First Order Done?</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => {
                    const orderCount = r.referred.orders.length;
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="fw-bold text-dark">{r.referrer.name}</div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{r.referrer.email}</div>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{r.referred.name}</div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{r.referred.email}</div>
                        </td>
                        <td className="small text-muted">
                          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${r.status === "COMPLETED" ? "bg-success" : "bg-warning text-dark"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {orderCount > 0 ? (
                            <span className="text-success fw-bold small"><i className="bi bi-check-circle-fill me-1"></i> Yes ({orderCount} orders)</span>
                          ) : (
                            <span className="text-muted small"><i className="bi bi-hourglass-split me-1"></i> No orders placed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-muted text-center py-5 small">No referral signups tracked yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Affiliate Links Table */}
        <div className="col-12 col-xl-5">
          <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
            <h5 className="fw-bold mb-4"><i className="bi bi-share-fill text-primary me-2"></i> User Affiliate Shares</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Shared By</th>
                    <th className="border-0">Link Code</th>
                    <th className="border-0 text-center">Clicks</th>
                    <th className="border-0 text-center">Signups</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliateLinks.map((l) => {
                    const creator = creatorsMap.get(l.userId);
                    const linkSignups = referrals.filter(r => r.affiliateLinkId === l.id).length;
                    return (
                      <tr key={l.id}>
                        <td>
                          <div className="fw-bold text-dark">{creator?.name || "Unknown"}</div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{creator?.email || l.userId}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark font-monospace border px-2 py-1">
                            {l.code}
                          </span>
                        </td>
                        <td className="text-center font-semibold text-primary">{l.clicks.length}</td>
                        <td className="text-center font-semibold text-success">{linkSignups}</td>
                      </tr>
                    );
                  })}
                  {affiliateLinks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-muted text-center py-5 small">No affiliate links created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
