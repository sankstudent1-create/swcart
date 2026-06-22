import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { updateUserRoleAction } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  });

  if (!user) {
    redirect("/spr/admin/users");
  }

  // Get all roles in the system to allow adding them
  const allRoles = await prisma.role.findMany();

  const userRoleIds = user.roles.map(ur => ur.roleId);
  const availableRoles = allRoles.filter(role => !userRoleIds.includes(role.id));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/spr/admin/users" className="text-decoration-none text-muted mb-2 d-inline-block small">
            <i className="bi bi-arrow-left"></i> Back to Users List
          </Link>
          <h2 className="fw-bold mb-0 text-dark">Manage User Roles</h2>
        </div>
      </div>

      <div className="row g-4">
        {/* User Card */}
        <div className="col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light text-center">
            <div className="avatar-placeholder mx-auto mb-3" style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "var(--red)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: "bold",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h5 className="fw-bold mb-1 text-dark">{user.name}</h5>
            <p className="text-muted small mb-3">{user.email}</p>
            <hr className="my-3 border-light" />
            <div className="text-start">
              <div className="text-muted small text-uppercase fw-semibold mb-1">User ID</div>
              <div className="small text-dark font-monospace mb-3">{user.id}</div>

              <div className="text-muted small text-uppercase fw-semibold mb-1">Joined Date</div>
              <div className="small text-dark fw-semibold">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Roles Management */}
        <div className="col-lg-8">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light h-100">
            <h5 className="fw-bold text-dark mb-4"><i className="bi bi-shield-lock me-2 text-danger"></i> User Privileges & Access</h5>
            
            {/* Active Roles */}
            <div className="mb-5">
              <h6 className="fw-bold text-muted small text-uppercase mb-3">Active Roles</h6>
              {user.roles.length === 0 ? (
                <div className="alert alert-secondary border-0 small">This user has no active roles assigned.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {user.roles.map((ur) => (
                    <div key={ur.roleId} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 shadow-sm">
                      <div>
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 px-3 py-2 fw-bold mr-2">
                          {ur.role.name}
                        </span>
                        <span className="text-muted small ms-2">{ur.role.description || "No description provided."}</span>
                      </div>
                      
                      <form action={updateUserRoleAction.bind(null, user.id, ur.role.name, "REMOVE") as any}>
                        <button type="submit" className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold">
                          Revoke Role
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grant New Roles */}
            <div>
              <h6 className="fw-bold text-muted small text-uppercase mb-3">Grant New Privilege</h6>
              {availableRoles.length === 0 ? (
                <p className="text-muted small">All defined system roles have been granted to this user.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {availableRoles.map((role) => (
                    <div key={role.id} className="d-flex align-items-center justify-content-between p-3 border border-light rounded-3">
                      <div>
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-3 py-2 fw-bold mr-2">
                          {role.name}
                        </span>
                        <span className="text-muted small ms-2">{role.description || "No description."}</span>
                      </div>
                      
                      <form action={updateUserRoleAction.bind(null, user.id, role.name, "ADD") as any}>
                        <button type="submit" className="btn btn-sm btn-danger rounded-pill px-3 fw-bold">
                          Grant Role
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
