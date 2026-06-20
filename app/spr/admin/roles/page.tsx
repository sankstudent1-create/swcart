import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CreateRoleForm from "@/components/admin/CreateRoleForm";
import { deleteRoleAction } from "@/app/actions/crm";

export default async function RolesManager() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const roles = await prisma.role.findMany({
    include: {
      users: { include: { user: true } }
    }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Role Manager</h2>
          <p className="text-muted mb-0">Control system access and permissions.</p>
        </div>
        <CreateRoleForm />
      </div>

      <div className="row g-4">
        {roles.map(role => (
          <div key={role.id} className="col-md-6 col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 hover-lift transition-all position-relative">
              {role.name === 'SUPER_ADMIN' && (
                <div className="position-absolute top-0 end-0 mt-3 me-3">
                  <i className="bi bi-star-fill text-warning fs-4"></i>
                </div>
              )}
              <h4 className="fw-bold text-dark mb-2 d-flex align-items-center">
                <i className={`bi ${role.name === 'SUPER_ADMIN' ? 'bi-shield-shaded text-danger' : 'bi-shield-check text-primary'} me-2`}></i>
                {role.name}
              </h4>
              <p className="text-muted small mb-4" style={{ minHeight: "40px" }}>{role.description || "No description provided for this role."}</p>
              
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="bg-light px-3 py-2 rounded-3 border w-100 text-center">
                  <div className="fw-black text-dark fs-4">{role.users.length}</div>
                  <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.65rem" }}>Assigned Users</div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-dark rounded-pill flex-grow-1 fw-semibold shadow-sm hover-scale transition-all">Edit Privileges</button>
                {role.name !== 'SUPER_ADMIN' && (
                  <form action={deleteRoleAction.bind(null, role.id) as any} className="m-0">
                    <button type="submit" className="btn btn-sm btn-outline-danger shadow-sm px-3 hover-scale rounded-pill fw-semibold">
                      <i className="bi bi-trash-fill"></i> Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="col-12 text-center py-5">
            <h5 className="text-muted">No roles found. Ensure DB is seeded.</h5>
          </div>
        )}
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
        .hover-bg-danger:hover { background-color: var(--red) !important; color: white !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
