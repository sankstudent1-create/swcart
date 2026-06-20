import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminUsersPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { roles: { include: { role: true } } }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">User Management</h2>
        <div className="d-flex gap-2">
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input type="text" className="form-control rounded-pill ps-5 pe-4 shadow-sm border-0 bg-white" placeholder="Search users..." />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-4 shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border-light">
            <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
              <tr>
                <th className="fw-bold border-0 rounded-start py-3">User</th>
                <th className="fw-bold border-0 py-3">Email</th>
                <th className="fw-bold border-0 py-3">Role</th>
                <th className="fw-bold border-0 py-3">Joined Date</th>
                <th className="fw-bold border-0 rounded-end py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {users.map(u => (
                <tr key={u.id} className="hover-bg-light transition-all">
                  <td className="py-3">
                    <Link href={`/spr/admin/users/${u.id}`} className="text-decoration-none">
                      <div className="d-flex align-items-center gap-3 hover-scale d-inline-flex transition-all">
                        <div className="avatar rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "40px", height: "40px" }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="fw-bold text-dark">{u.name}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="text-muted py-3">{u.email}</td>
                  <td className="py-3">
                    {u.roles.map(ur => (
                      <span key={ur.roleId} className={`badge rounded-pill px-3 py-2 fw-bold ${ur.role.name === 'SUPER_ADMIN' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-50' : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-50'}`}>
                        {ur.role.name}
                      </span>
                    ))}
                    {u.roles.length === 0 && <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary rounded-pill px-3 py-2">NONE</span>}
                  </td>
                  <td className="text-muted small py-3 fw-semibold">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <button className="btn btn-sm btn-light rounded-pill px-3 me-2 fw-semibold text-dark shadow-sm border"><i className="bi bi-pencil-square me-1"></i> Edit</button>
                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold shadow-sm"><i className="bi bi-slash-circle me-1"></i> Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
      `}</style>
    </div>
  );
}
