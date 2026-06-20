import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditUserModal from "@/components/admin/EditUserModal";

export default async function UserProfile360({ params }: { params: Promise<{ id: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      customerProfile: { include: { addresses: true } },
      orders: { include: { items: { include: { variant: { include: { product: true } } } } }, orderBy: { createdAt: "desc" } },
      refunds: true,
      roles: { include: { role: true } },
      supportTickets: true,
      cart: { include: { items: true } },
      wishlist: { include: { items: true } }
    }
  });

  if (!user) return <div className="p-5 text-center">User not found</div>;

  const allRoles = await prisma.role.findMany();
  const totalSpent = user.orders.filter(o => o.status === "DELIVERED" || o.status === "PAID").reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRefunded = user.refunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link href="/spr/admin/users" className="text-muted text-decoration-none small fw-semibold hover-text-danger transition-all"><i className="bi bi-arrow-left me-1"></i> Back to Users</Link>
        <EditUserModal user={user} allRoles={allRoles} />
      </div>

      <div className="row g-4 mb-4">
        {/* User Identity Card */}
        <div className="col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden">
            <div className="position-absolute end-0 top-0 mt-4 me-4 text-dark opacity-10">
              <i className="bi bi-person-badge" style={{ fontSize: "6rem" }}></i>
            </div>
            <div className="avatar rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold shadow-sm mb-3" style={{ width: "80px", height: "80px", fontSize: "2rem" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h4 className="fw-bold text-dark mb-1 position-relative z-1">{user.name}</h4>
            <div className="text-muted small mb-3 position-relative z-1">{user.email} {user.phone && `• ${user.phone}`}</div>
            
            <div className="d-flex flex-wrap gap-2 mb-4 position-relative z-1">
              {user.roles.map(ur => (
                <span key={ur.roleId} className={`badge rounded-pill px-3 py-2 fw-bold ${ur.role.name === 'SUPER_ADMIN' ? 'bg-danger text-white' : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-50'}`}>
                  {ur.role.name}
                </span>
              ))}
              {user.roles.length === 0 && <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary rounded-pill px-3 py-2">CUSTOMER</span>}
            </div>

            <div className="text-muted small fw-semibold">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="col-lg-8">
          <div className="row g-4 h-100">
            <div className="col-sm-6">
              <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden hover-lift transition-all">
                <div className="position-absolute end-0 top-0 mt-3 me-3 text-success opacity-25">
                  <i className="bi bi-graph-up-arrow" style={{ fontSize: "3rem" }}></i>
                </div>
                <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Lifetime Value</h6>
                <h2 className="fw-black mb-1 display-6">₹{totalSpent.toLocaleString('en-IN')}</h2>
                <div className="text-success small fw-bold">From {user.orders.length} orders</div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 position-relative overflow-hidden hover-lift transition-all">
                <div className="position-absolute end-0 top-0 mt-3 me-3 text-danger opacity-25">
                  <i className="bi bi-arrow-return-left" style={{ fontSize: "3rem" }}></i>
                </div>
                <h6 className="text-muted fw-bold text-uppercase mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>Total Refunded</h6>
                <h2 className="fw-black mb-1 display-6">₹{totalRefunded.toLocaleString('en-IN')}</h2>
                <div className="text-danger small fw-bold">{user.refunds.length} total refunds</div>
              </div>
            </div>
            
            <div className="col-sm-4">
              <div className="bg-white p-4 rounded-4 shadow-sm border-0 text-center">
                <h3 className="fw-bold mb-1 text-dark">{user.cart?.items.length || 0}</h3>
                <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Cart Items</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="bg-white p-4 rounded-4 shadow-sm border-0 text-center">
                <h3 className="fw-bold mb-1 text-dark">{user.wishlist?.items.length || 0}</h3>
                <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Wishlist Items</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="bg-white p-4 rounded-4 shadow-sm border-0 text-center">
                <h3 className="fw-bold mb-1 text-dark">{user.supportTickets.length}</h3>
                <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Support Tickets</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Order History */}
        <div className="col-lg-8">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold mb-4">Order History</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 border-light">
                <thead className="table-light text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
                  <tr>
                    <th className="fw-bold border-0 rounded-start py-3">Order ID</th>
                    <th className="fw-bold border-0 py-3">Date</th>
                    <th className="fw-bold border-0 py-3">Amount</th>
                    <th className="fw-bold border-0 py-3">Items</th>
                    <th className="fw-bold border-0 rounded-end py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {user.orders.map(order => (
                    <tr key={order.id} className="hover-bg-light transition-all">
                      <td className="fw-bold text-dark py-3">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="text-muted small py-3 fw-semibold">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="fw-bold text-dark py-3">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="text-muted small py-3 fw-semibold">{order.items.length} items</td>
                      <td className="py-3">
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${order.status === 'PAID' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {user.orders.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-5 fw-semibold">No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold mb-4">Saved Addresses</h5>
            <div className="d-flex flex-column gap-3">
              {user.customerProfile?.addresses?.map(addr => (
                <div key={addr.id} className="p-3 border rounded-4 bg-light bg-opacity-50 position-relative hover-bg-white transition-all shadow-hover">
                  {addr.isDefault && <span className="position-absolute top-0 end-0 mt-3 me-3 badge bg-danger rounded-pill">Default</span>}
                  <div className="fw-bold text-dark mb-1">{addr.street}</div>
                  <div className="text-muted small">{addr.city}, {addr.state} {addr.postalCode}</div>
                  <div className="text-muted small fw-semibold mt-1">{addr.country}</div>
                </div>
              ))}
              {(!user.customerProfile?.addresses || user.customerProfile.addresses.length === 0) && (
                <div className="text-center text-muted py-4 fw-semibold border rounded-4 border-dashed bg-light">No addresses saved.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .hover-bg-white:hover { background-color: #ffffff !important; }
        .hover-text-danger:hover { color: var(--red) !important; }
        .shadow-hover:hover { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important; }
        .border-dashed { border-style: dashed !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
