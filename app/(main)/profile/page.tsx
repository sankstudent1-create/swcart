import Link from "next/link";
import { getSessionUserId, logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/profile";
import AddressForm from "@/components/AddressForm";
import ProfileSupportManager from "./ProfileSupportManager";
import RequestReturnBtn from "./RequestReturnBtn";
import "./profile.css";
import ReferralLink from "@/components/ReferralLink";
import AvatarUpload from "@/components/AvatarUpload";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string, success?: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: { include: { addresses: true } },
      wallet: true,
      rewardPoints: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { sellerOrders: { include: { seller: true, items: { include: { variant: { include: { product: true } } } } } } }
      }
    }
  });

  if (!user) redirect("/login");

  const params = await searchParams;
  
  // 1. Fetch site settings to check if referral module is enabled
  const siteSettings = await prisma.siteSetting.findUnique({ where: { id: "GLOBAL" } });
  const isReferralEnabled = siteSettings?.referralEnabled !== false;

  let tab = params.tab || "orders";
  if (tab === "referral" && !isReferralEnabled) {
    tab = "orders"; // Redirect to orders tab if referral is disabled
  }

  // Fetch support tickets for this user
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: true }
          }
        }
      }
    }
  });

  const serializedTickets = JSON.parse(JSON.stringify(tickets));

  return (
    <>
      {/* Ambient Gradient Hero Section */}
      <div className="profile-hero">
        <div className="container text-center pt-4 pb-2">
          <h1 className="font-jakarta fw-bolder text-dark mb-2">My Profile</h1>
          <p className="font-jakarta text-muted">Manage your account, orders, and preferences.</p>
        </div>
      </div>

      <div className="container pb-5 font-jakarta" style={{ minHeight: "60vh", marginTop: "-1rem" }}>
        {params.success === "true" && (
          <div className="alert alert-success mb-4 rounded-4 shadow-sm border-0 d-flex align-items-center font-jakarta" style={{background: "#e8f7ec", color: "#1c7430"}}>
            <i className="bi bi-check-circle-fill me-3 fs-4"></i> 
            <strong>Success!</strong>&nbsp;Your order has been placed successfully.
          </div>
        )}

        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="glass-panel p-4 text-center mb-4 position-relative z-2">
              <div className="avatar-pulse-container mb-3">
                <div className="avatar-pulse"></div>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="profile-avatar-img position-relative z-1" />
                ) : (
                  <div className="profile-avatar-img position-relative z-1 d-flex align-items-center justify-content-center text-white font-jakarta fw-bolder fs-1 shadow-sm" style={{background: "var(--red)"}}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h5 className="font-jakarta fw-bold text-dark mb-1">{user.name}</h5>
              <p className="text-muted small mb-0">{user.email}</p>
            </div>
            
            {/* Wallet & Rewards Widget (Credit Card Style) */}
            <div className="premium-card-widget p-4 mb-4">
              <div className="d-flex align-items-center justify-content-between mb-4 position-relative z-1">
                <span className="text-white-50 small fw-semibold text-uppercase tracking-wide">Wallet Balance</span>
                <i className="bi bi-wallet2 fs-4 text-white-50"></i>
              </div>
              <div className="fw-bold text-white mb-4 position-relative z-1 font-jakarta" style={{ fontSize: "2rem" }}>
                ₹{(user.wallet?.balance || 0).toLocaleString('en-IN')}
              </div>
              
              <div className="d-flex align-items-center justify-content-between border-top border-light border-opacity-10 pt-3 position-relative z-1">
                <span className="text-white-50 small fw-semibold text-uppercase tracking-wide">Loyalty Points</span>
                <span className="fw-bold text-warning font-jakarta" style={{ fontSize: "1.1rem" }}>
                  <i className="bi bi-star-fill me-1"></i>
                  {user.rewardPoints?.points || 0}
                </span>
              </div>
            </div>

            <div className="glass-panel p-2">
              <nav className="d-flex flex-column">
                <Link href="/profile?tab=orders" className={`nav-pill-animated ${tab === 'orders' ? 'active' : ''}`}>
                  <i className="bi bi-box-seam"></i> My Orders
                </Link>
                <Link href="/library" className="nav-pill-animated">
                  <i className="bi bi-collection-play"></i> My Library
                </Link>
                <Link href="/profile?tab=account" className={`nav-pill-animated ${tab === 'account' ? 'active' : ''}`}>
                  <i className="bi bi-person-badge"></i> Account Details
                </Link>
                <Link href="/profile?tab=address" className={`nav-pill-animated ${tab === 'address' ? 'active' : ''}`}>
                  <i className="bi bi-geo-alt"></i> Saved Addresses
                </Link>
                <Link href="/profile?tab=support" className={`nav-pill-animated ${tab === 'support' ? 'active' : ''}`}><i className="bi bi-headset"></i> Support Helpdesk</Link>
                {isReferralEnabled && (
                  <Link href="/profile?tab=referral" className={`nav-pill-animated ${tab === 'referral' ? 'active' : ''}`}><i className="bi bi-share"></i> Referral</Link>
                )}
                <hr className="my-2 opacity-10" />
                <form action={logoutAction as any}>
                  <button type="submit" className="nav-pill-animated bg-transparent border-0 w-100 text-start text-danger hover-red">
                    <i className="bi bi-box-arrow-right"></i> Log Out
                  </button>
                </form>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-lg-9">
            <div className="glass-panel p-4 p-md-5 h-100 position-relative z-2">
              
              {/* ORDERS TAB */}
              {tab === "orders" && (
                <div className="fade-in">
                  <h3 className="font-jakarta fw-bolder text-dark mb-4">Order History</h3>
                  
                  {user.orders.length === 0 ? (
                    <div className="text-center py-5 my-5">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-4" style={{width: "100px", height: "100px"}}>
                        <i className="bi bi-bag-x text-muted" style={{fontSize: "3rem"}}></i>
                      </div>
                      <h4 className="font-jakarta fw-bold text-dark">No orders yet</h4>
                      <p className="text-muted max-w-md mx-auto">Looks like you haven't made your first purchase yet. Discover our latest collections and start shopping!</p>
                      <Link href="/categories" className="btn btn-danger rounded-pill px-4 py-2 fw-bold mt-2 shadow-sm">Explore Products</Link>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-4">
                      {user.orders.map((order: any) => (
                        <div key={order.id} className="order-card">
                          <div className="order-card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div>
                              <div className="text-muted small fw-semibold text-uppercase tracking-wide mb-1">Order ID</div>
                              <div className="fw-bold font-jakarta text-dark fs-5">#{order.id.slice(-8).toUpperCase()}</div>
                              <div className="text-muted small mt-1"><i className="bi bi-calendar3 me-1"></i> {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                            <div className="text-md-end">
                              <div className="fw-bold font-jakarta text-dark fs-4">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                              <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                                <span className={`badge rounded-pill px-3 py-2 border font-jakarta ${order.status === 'PAID' || order.status === 'DELIVERED' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25' : 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-50'}`}>
                                  {order.status}
                                </span>
                                <Link href={`/track-order?id=${order.id}`} className="btn btn-sm btn-dark rounded-pill px-3 fw-semibold"><i className="bi bi-geo-alt-fill me-1 text-danger"></i> Track</Link>
                                <Link href={`/orders/${order.id}/invoice`} className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold bg-white" target="_blank"><i className="bi bi-download me-1"></i> Invoice</Link>
                              </div>
                            </div>
                          </div>
                          
                          <div className="order-items-scroll bg-light bg-opacity-50">
                            {order.sellerOrders.map((so: any) => (
                              <div key={so.id} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2 px-3 pt-3">
                                  <div className="text-muted small fw-bold">Package from {so.seller?.companyName || "Seller"}</div>
                                  <RequestReturnBtn sellerOrderId={so.id} currentStatus={so.status} />
                                </div>
                                {so.items.map((item: any) => (
                                  <div key={item.id} className="order-item-chip d-flex align-items-center gap-3 border-0 rounded-0 border-bottom border-light mx-3">
                                    {item.variant.product.images?.[0] ? (
                                      <img src={item.variant.product.images[0]} alt={item.variant.product.title} className="rounded-3 object-fit-cover shadow-sm" style={{width: "50px", height: "50px"}} />
                                    ) : (
                                      <div className="bg-light rounded-3 d-flex align-items-center justify-content-center border" style={{width: "50px", height: "50px"}}>
                                        <i className="bi bi-image text-muted"></i>
                                      </div>
                                    )}
                                    <div className="text-truncate flex-grow-1">
                                      <div className="fw-bold text-dark font-jakarta text-truncate" title={item.variant.product.title}>{item.variant.product.title}</div>
                                      <div className="text-muted small mt-1">
                                        Qty: <span className="fw-bold text-dark">{item.quantity}</span> &bull; {item.variant.size} {item.variant.color}
                                        {order.status === "DELIVERED" && (
                                          <Link 
                                            href={`/product/${item.variant.product.id}#reviews`} 
                                            className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-0.5 small fw-bold text-decoration-none ms-3"
                                            style={{ fontSize: "0.75rem" }}
                                          >
                                            <i className="bi bi-star-fill me-1"></i> Submit Review
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-danger fw-bold ms-auto">₹{item.priceAtBuy.toLocaleString('en-IN')}</div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACCOUNT DETAILS TAB */}
              {tab === "account" && (
                <div className="fade-in">
                  <h3 className="font-jakarta fw-bolder text-dark mb-4">Account Details</h3>
                  
                  <div className="row g-4 mb-5">
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1">Full Name</label>
                        <div className="fw-bold text-dark font-jakarta fs-5">{user.name}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1">Email Address</label>
                        <div className="fw-bold text-dark font-jakarta fs-5">{user.email}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1">Member Since</label>
                        <div className="fw-bold text-dark font-jakarta fs-5">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1">Account Status</label>
                        <div className="text-success fw-bold font-jakarta fs-5 d-flex align-items-center">
                          <i className="bi bi-shield-check me-2 fs-4"></i> Verified
                        </div>
                      </div>
                    </div>
                  </div>

                  <AvatarUpload
                    currentAvatar={user.avatar}
                    userName={user.name}
                  />
                </div>
              )}

              {/* ADDRESS TAB */}
              {tab === "address" && (
                <div className="fade-in">
                  <h3 className="font-jakarta fw-bolder text-dark mb-4">Saved Addresses</h3>
                  
                  {user.customerProfile?.addresses && user.customerProfile.addresses.length > 0 ? (
                    <div className="row g-4 mb-5">
                      {user.customerProfile.addresses.map(address => (
                        <div className="col-md-6" key={address.id}>
                          <div className="order-card p-4 h-100 position-relative">
                            {address.isDefault && (
                              <span className="badge bg-danger position-absolute top-0 end-0 mt-3 me-3 rounded-pill px-3 py-2 shadow-sm">Default</span>
                            )}
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-danger" style={{width: "40px", height: "40px"}}>
                                <i className="bi bi-geo-alt-fill fs-5"></i>
                              </div>
                              <div className="fw-bold font-jakarta fs-5 text-dark">{user.name}</div>
                            </div>
                            
                            <div className="text-muted mb-1"><i className="bi bi-building me-2"></i>{address.street}</div>
                            <div className="text-muted mb-1"><i className="bi bi-map me-2"></i>{address.city}, {address.state} {address.postalCode}</div>
                            <div className="text-muted mb-4"><i className="bi bi-globe me-2"></i>{address.country}</div>
                            
                            <form action={deleteAddressAction as any}>
                              <input type="hidden" name="addressId" value={address.id} />
                              <button className="btn btn-sm btn-outline-danger w-100 rounded-3 py-2 fw-semibold"><i className="bi bi-trash3 me-2"></i> Remove Address</button>
                            </form>
                            {!address.isDefault && (
                              <form action={setDefaultAddressAction as any} className="mt-2">
                                <input type="hidden" name="addressId" value={address.id} />
                                <button className="btn btn-sm btn-outline-primary w-100 rounded-3 py-2 fw-semibold"><i className="bi bi-check-circle me-2"></i> Set as Default</button>
                              </form>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 mb-4 bg-light rounded-4 border border-dashed">
                      <i className="bi bi-geo text-muted fs-1 mb-2 d-block"></i>
                      <p className="text-muted mb-0">No saved addresses found.</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-top">
                    <h5 className="font-jakarta fw-bold text-dark mb-3"><i className="bi bi-plus-circle me-2 text-danger"></i> Add New Address</h5>
                    <div className="bg-light bg-opacity-50 border rounded-4 p-4">
                      <AddressForm />
                    </div>
                  </div>
                </div>
              )}

              {/* SUPPORT TAB */}
              {tab === "support" && (
                <div className="fade-in">
                  <h3 className="font-jakarta fw-bolder text-dark mb-4">Support Helpdesk</h3>
                  <ProfileSupportManager tickets={serializedTickets} userId={userId} />
                </div>
              )}
              
              {tab === "referral" && isReferralEnabled && (
                <div className="fade-in">
                  <h3 className="font-jakarta fw-bolder text-dark mb-4">Your Referral Link</h3>
                  <ReferralLink />
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
