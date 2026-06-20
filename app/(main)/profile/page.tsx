import Link from "next/link";
import { getSessionUserId, logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { deleteAddressAction } from "@/app/actions/profile";
import AddressForm from "@/components/AddressForm";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string, success?: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: { include: { addresses: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { variant: { include: { product: true } } } } }
      }
    }
  });

  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = params.tab || "orders";

  return (
    <div className="container py-5" style={{ minHeight: "70vh" }}>
      {params.success === "true" && (
        <div className="alert alert-success mb-4 border-0 shadow-sm" style={{background: "#e8f7ec", color: "#1c7430"}}>
          <i className="bi bi-check-circle-fill me-2"></i> Your order has been placed successfully!
        </div>
      )}

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light text-center mb-4">
            <div className="avatar-placeholder mx-auto mb-3" style={{width: "80px", height: "80px", borderRadius: "50%", background: "var(--red)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold"}}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h5 className="fw-bold mb-1">{user.name}</h5>
            <p className="text-muted small mb-0">{user.email}</p>
          </div>

          <div className="bg-white rounded-4 shadow-sm border border-light overflow-hidden">
            <div className="list-group list-group-flush profile-nav">
              <Link href="/profile?tab=orders" className={`list-group-item list-group-item-action py-3 px-4 ${tab === 'orders' ? 'bg-light border-start border-4 border-danger fw-bold text-dark' : 'text-muted border-start border-4 border-transparent'}`}>
                <i className="bi bi-box-seam me-2"></i> My Orders
              </Link>
              <Link href="/profile?tab=account" className={`list-group-item list-group-item-action py-3 px-4 ${tab === 'account' ? 'bg-light border-start border-4 border-danger fw-bold text-dark' : 'text-muted border-start border-4 border-transparent'}`}>
                <i className="bi bi-person me-2"></i> Account Details
              </Link>
              <Link href="/profile?tab=address" className={`list-group-item list-group-item-action py-3 px-4 ${tab === 'address' ? 'bg-light border-start border-4 border-danger fw-bold text-dark' : 'text-muted border-start border-4 border-transparent'}`}>
                <i className="bi bi-geo-alt me-2"></i> Saved Addresses
              </Link>
              <form action={logoutAction} className="list-group-item list-group-item-action py-3 px-4 text-danger" style={{cursor: "pointer"}}>
                <button type="submit" className="bg-transparent border-0 text-danger p-0 w-100 text-start fw-semibold">
                  <i className="bi bi-box-arrow-right me-2"></i> Log Out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-lg-9">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light h-100">
            {tab === "orders" && (
              <>
                <h3 className="fw-bold mb-4">Order History</h3>
                {user.orders.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-receipt text-muted" style={{fontSize: "3rem"}}></i>
                    <h5 className="mt-3">No orders yet</h5>
                    <p className="text-muted">When you buy something, it will appear here.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {user.orders.map(order => (
                      <div key={order.id} className="border border-light rounded-4 p-4 bg-light bg-opacity-50">
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-light pb-3">
                          <div>
                            <div className="fw-bold">Order #{order.id.slice(-8).toUpperCase()}</div>
                            <div className="text-muted small">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold fs-5">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                            <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 mt-1 border border-success border-opacity-25">{order.status}</span>
                          </div>
                        </div>
                        <div className="d-flex gap-3 overflow-auto pb-2">
                          {order.items.map(item => (
                            <div key={item.id} className="d-flex align-items-center gap-2 bg-white border border-light rounded-3 p-2 shadow-sm" style={{minWidth: "220px"}}>
                              <div className="text-truncate flex-grow-1 small">
                                <span className="fw-bold text-dark">{item.quantity}x</span> <span className="text-muted">{item.variant.product.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "account" && (
              <>
                <h3 className="fw-bold mb-4">Account Details</h3>
                <div className="row g-4" style={{maxWidth: "600px"}}>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1 text-uppercase fw-semibold" style={{letterSpacing: ".5px"}}>Full Name</label>
                    <div className="fw-bold fs-5">{user.name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1 text-uppercase fw-semibold" style={{letterSpacing: ".5px"}}>Email Address</label>
                    <div className="fw-bold fs-5">{user.email}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1 text-uppercase fw-semibold" style={{letterSpacing: ".5px"}}>Member Since</label>
                    <div className="fw-bold fs-5">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1 text-uppercase fw-semibold" style={{letterSpacing: ".5px"}}>Account Status</label>
                    <div className="text-success fw-bold fs-5"><i className="bi bi-patch-check-fill me-1"></i> Active</div>
                  </div>
                </div>
              </>
            )}

            {tab === "address" && (
              <>
                <h3 className="fw-bold mb-4">Saved Addresses</h3>
                {user.customerProfile?.addresses && user.customerProfile.addresses.length > 0 ? (
                  <div className="row g-4 mb-4">
                    {user.customerProfile.addresses.map(address => (
                      <div className="col-md-6" key={address.id}>
                        <div className="border rounded-4 p-4 h-100 position-relative">
                          {address.isDefault && (
                            <span className="badge bg-danger position-absolute top-0 end-0 mt-3 me-3">Default</span>
                          )}
                          <div className="fw-bold mb-2">{user.name}</div>
                          <div className="text-muted small mb-1">{address.street}</div>
                          <div className="text-muted small mb-1">{address.city}, {address.state} {address.postalCode}</div>
                          <div className="text-muted small mb-3">{address.country}</div>
                          <form action={deleteAddressAction}>
                            <input type="hidden" name="addressId" value={address.id} />
                            <button className="btn btn-sm btn-outline-danger px-3 rounded-pill"><i className="bi bi-trash"></i> Remove</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                
                <AddressForm />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
