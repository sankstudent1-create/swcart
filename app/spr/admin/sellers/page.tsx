import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SellersDashboard() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sellers = await prisma.seller.findMany({
    include: {
      user: true,
      products: { include: { variants: true } }
    }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Seller ERP Dashboard</h2>
        <div className="d-flex gap-2">
          <input type="text" className="form-control rounded-pill px-4 shadow-sm border-0" placeholder="Search sellers..." />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border-light">
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
              <tr>
                <th className="fw-bold border-0 rounded-start py-3">Company</th>
                <th className="fw-bold border-0 py-3">Owner</th>
                <th className="fw-bold border-0 py-3">Products</th>
                <th className="fw-bold border-0 py-3">Status</th>
                <th className="fw-bold border-0 rounded-end py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {sellers.map(s => (
                <tr key={s.id} className="hover-bg-light transition-all">
                  <td className="py-3">
                    <Link href={`/spr/admin/sellers/${s.id}`} className="text-decoration-none">
                      <div className="d-flex align-items-center gap-3 hover-scale d-inline-flex transition-all">
                        <div className="avatar rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "40px", height: "40px" }}>
                          {s.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="fw-bold text-dark">{s.companyName}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3">
                    <div className="fw-semibold text-dark">{s.user.name}</div>
                    <div className="text-muted small">{s.user.email}</div>
                  </td>
                  <td className="py-3 fw-bold text-dark">{s.products.length}</td>
                  <td className="py-3">
                    {s.isVerified ? 
                      <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">Verified</span> : 
                      <span className="badge bg-warning bg-opacity-10 text-warning border border-warning px-3 py-2 rounded-pill">Pending</span>
                    }
                  </td>
                  <td className="py-3">
                    <Link href={`/spr/admin/sellers/${s.id}`} className="btn btn-sm btn-light rounded-pill px-3 fw-semibold text-dark border shadow-sm me-2 hover-scale transition-all">Analytics</Link>
                  </td>
                </tr>
              ))}
              {sellers.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-5 fw-semibold">No sellers registered yet.</td></tr>
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
