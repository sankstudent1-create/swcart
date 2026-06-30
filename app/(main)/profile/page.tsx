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
    <div style={{ background: "var(--profile-bg)", minHeight: "100vh" }}>
      {/* Ambient Gradient Hero Section */}
      <div className="profile-hero">
        <div className="container position-relative z-2 pt-4 pb-2">
          <div className="d-flex align-items-center gap-3 mb-2">
            <h1 className="font-jakarta fw-bolder text-dark mb-0" style={{ fontSize: "2.5rem", letterSpacing: "-1px" }}>My Profile</h1>
            <span className="badge rounded-pill bg-white text-danger border border-danger border-opacity-25 shadow-sm px-3 py-2">Verified</span>
          </div>
          <p className="font-jakarta text-muted fs-5" style={{ maxWidth: 500 }}>Manage your account, track orders, and update your personal preferences.</p>
        </div>
      </div>

      <div className="container pb-5 font-jakarta" style={{ marginTop: "-2rem", position: "relative", zIndex: 10 }}>
        {params.success === "true" && (
          <div className="alert mb-4 rounded-4 shadow-sm border-0 d-flex align-items-center fade-in font-jakarta" style={{background: "#e8f7ec", color: "#1c7430"}}>
            <i className="bi bi-check-circle-fill me-3 fs-4"></i> 
            <strong>Success!</strong>&nbsp;Your order has been placed successfully.
          </div>
        )}

        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="glass-panel p-4 text-center mb-4">
              <div className="avatar-pulse-container mb-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-img d-flex align-items-center justify-content-center text-white fw-bolder shadow-sm" style={{background: "linear-gradient(135deg, var(--primary-red) 0%, #c1121f 100%)", fontSize: "2.5rem"}}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="font-jakarta fw-bold text-dark mb-1" style={{ letterSpacing: "-0.5px" }}>{user.name}</h4>
              <p className="text-muted small mb-0 fw-semibold">{user.email}</p>
            </div>
            
            {/* Wallet & Rewards Widget (Credit Card Style) */}
            <div className="premium-card-widget p-4 mb-4">
              <div className="d-flex align-items-center justify-content-between mb-4 position-relative z-1">
                <span className="text-white-50 small fw-bold tracking-wide">SWCART WALLET</span>
                <i className="bi bi-wallet2 fs-5 text-white-50"></i>
              </div>
              <div className="fw-bolder text-white mb-4 position-relative z-1 font-jakarta" style={{ fontSize: "2.2rem", letterSpacing: "-1px" }}>
                ₹{(user.wallet?.balance || 0).toLocaleString('en-IN')}
              </div>
              
              <div className="d-flex align-items-center justify-content-between border-top border-light border-opacity-10 pt-3 position-relative z-1">
                <span className="text-white-50 small fw-bold tracking-wide">REWARDS</span>
                <span className="fw-bold text-warning font-jakarta d-flex align-items-center gap-1" style={{ fontSize: "1.05rem" }}>
                  <i className="bi bi-star-fill"></i>
                  {user.rewardPoints?.points || 0} pts
                </span>
              </div>
            </div>

            <div className="glass-panel p-2">
              <nav className="d-flex flex-column">
                <Link href="/profile?tab=orders" className={`nav-pill-animated ${tab === 'orders' ? 'active' : ''}`}>
                  <i className="bi bi-box-seam"></i> Order Ledger
                </Link>
                <Link href="/library" className="nav-pill-animated">
                  <i className="bi bi-collection-play"></i> Digital Library
                </Link>
                <Link href="/profile?tab=account" className={`nav-pill-animated ${tab === 'account' ? 'active' : ''}`}>
                  <i className="bi bi-person-badge"></i> Profile Settings
                </Link>
                <Link href="/profile?tab=address" className={`nav-pill-animated ${tab === 'address' ? 'active' : ''}`}>
                  <i className="bi bi-geo-alt"></i> Address Book
                </Link>
                <Link href="/profile?tab=support" className={`nav-pill-animated ${tab === 'support' ? 'active' : ''}`}>
                  <i className="bi bi-headset"></i> Help Center
                </Link>
                {isReferralEnabled && (
                  <Link href="/profile?tab=referral" className={`nav-pill-animated ${tab === 'referral' ? 'active' : ''}`}>
                    <i className="bi bi-share"></i> Referral Program
                  </Link>
                )}
                <div className="my-2" style={{ height: 1, background: "var(--glass-border)", opacity: 0.5 }} />
                <form action={logoutAction as any}>
                  <button type="submit" className="nav-pill-animated bg-transparent border-0 w-100 text-start text-danger hover-red">
                    <i className="bi bi-box-arrow-right"></i> Secure Logout
                  </button>
                </form>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-lg-9">
            <div className="glass-panel p-4 p-md-5 h-100">
              
              {/* ORDERS TAB */}
              {tab === "orders" && (
                <div className="fade-in">
                  <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-bag-check fs-4"></i>
                    </div>
                    <div>
                      <h3 className="font-jakarta fw-bolder text-dark mb-0">Order History</h3>
                      <p className="text-muted small mb-0 mt-1">Track your recent purchases and view invoices</p>
                    </div>
                  </div>
                  
                  {user.orders.length === 0 ? (
                    <div className="text-center py-5 my-4">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-4" style={{width: 120, height: 120}}>
                        <i className="bi bi-cart-x text-muted" style={{fontSize: "3.5rem"}}></i>
                      </div>
                      <h4 className="font-jakarta fw-bold text-dark mb-2">Your cart is empty</h4>
                      <p className="text-muted max-w-md mx-auto mb-4">You haven't made any purchases yet. Discover our premium collections and find something you love.</p>
                      <Link href="/categories" className="btn btn-danger rounded-pill px-5 py-3 fw-bold shadow-sm" style={{ letterSpacing: "0.5px" }}>Explore Catalog</Link>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-4">
                      {user.orders.map((order: any) => (
                        <div key={order.id} className="order-card">
                          <div className="order-card-header d-flex flex-wrap justify-content-between align-items-start gap-3">
                            <div>
                              <div className="text-muted small fw-bold tracking-wide mb-1 text-uppercase">Order Details</div>
                              <div className="fw-bolder font-jakarta text-dark fs-5">#{order.id.slice(-8).toUpperCase()}</div>
                              <div className="text-muted small mt-1 fw-medium"><i className="bi bi-calendar3 me-1"></i> {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                            <div className="text-md-end">
                              <div className="text-muted small fw-bold tracking-wide mb-1 text-uppercase">Total Amount</div>
                              <div className="fw-bolder font-jakarta text-dark fs-4">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                              <div className="d-flex align-items-center gap-2 mt-2 flex-wrap justify-content-md-end">
                                <span className={`badge rounded-pill px-3 py-2 border font-jakarta ${order.status === 'PAID' || order.status === 'DELIVERED' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25' : 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-50'}`}>
                                  {order.status}
                                </span>
                                <Link href={`/track-order?id=${order.id}`} className="btn btn-sm btn-dark rounded-pill px-3 fw-bold"><i className="bi bi-geo-alt-fill me-1 text-danger"></i> Track</Link>
                                <Link href={`/orders/${order.id}/invoice`} className="btn btn-sm btn-light rounded-pill px-3 fw-bold border" target="_blank"><i className="bi bi-download me-1 text-primary"></i> Invoice</Link>
                              </div>
                            </div>
                          </div>
                          
                          <div className="order-items-scroll bg-light bg-opacity-50 p-3">
                            {order.sellerOrders.map((so: any) => {
                              const isDigitalOnly = so.items.every((item: any) => item.variant.product.productType === "DIGITAL" || item.variant.product.productType === "SERVICE");
                              return (
                                <div key={so.id} className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                                    <div className="text-muted small fw-bold tracking-wide text-uppercase">
                                      <i className="bi bi-shop me-1 text-danger"></i> Package from {so.seller?.companyName || "Seller"}
                                      {so.trackingNumber && <span className="ms-3 badge bg-light text-dark border text-none text-lowercase" style={{textTransform: 'none'}}><i className="bi bi-truck text-primary me-1"></i>TRK: <span className="text-uppercase">{so.trackingNumber}</span></span>}
                                    </div>
                                    {!isDigitalOnly && <RequestReturnBtn sellerOrderId={so.id} currentStatus={so.status} />}
                                  </div>
                                {so.items.map((item: any) => (
                                  <div key={item.id} className="order-item-chip d-flex align-items-center gap-3">
                                    {item.variant.product.images?.[0] ? (
                                      <img src={item.variant.product.images[0]} alt={item.variant.product.title} className="rounded-3 object-fit-cover shadow-sm" style={{width: "60px", height: "60px"}} />
                                    ) : (
                                      <div className="bg-light rounded-3 d-flex align-items-center justify-content-center border" style={{width: "60px", height: "60px"}}>
                                        <i className="bi bi-image text-muted fs-4"></i>
                                      </div>
                                    )}
                                    <div className="text-truncate flex-grow-1">
                                      <div className="fw-bold text-dark font-jakarta text-truncate" style={{ fontSize: "1.05rem" }} title={item.variant.product.title}>{item.variant.product.title}</div>
                                      <div className="text-muted small mt-1 fw-medium">
                                        Qty: <span className="fw-bold text-dark">{item.quantity}</span> &bull; {item.variant.size} {item.variant.color}
                                        {order.status === "DELIVERED" && (
                                          <Link 
                                            href={`/product/${item.variant.product.id}#reviews`} 
                                            className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold text-decoration-none ms-3"
                                            style={{ fontSize: "0.75rem" }}
                                          >
                                            <i className="bi bi-star-fill me-1"></i> Review
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-danger fw-bolder ms-auto fs-5">₹{(item.priceAtBuy * item.quantity).toLocaleString('en-IN')}</div>
                                  </div>
                                ))}
                              </div>
                            );
                            })}
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
                  <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-person-lines-fill fs-4"></i>
                    </div>
                    <div>
                      <h3 className="font-jakarta fw-bolder text-dark mb-0">Profile Settings</h3>
                      <p className="text-muted small mb-0 mt-1">Manage your personal information and preferences</p>
                    </div>
                  </div>
                  
                  <div className="row g-4 mb-5">
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1"><i className="bi bi-person me-1"></i> Full Name</label>
                        <div className="fw-bolder text-dark font-jakarta fs-5">{user.name}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1"><i className="bi bi-envelope me-1"></i> Email Address</label>
                        <div className="fw-bolder text-dark font-jakarta fs-5">{user.email}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1"><i className="bi bi-calendar-event me-1"></i> Member Since</label>
                        <div className="fw-bolder text-dark font-jakarta fs-5">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="modern-input h-100">
                        <label className="text-muted small text-uppercase fw-bold tracking-wide d-block mb-1"><i className="bi bi-shield-lock me-1"></i> Account Status</label>
                        <div className="text-success fw-bolder font-jakarta fs-5 d-flex align-items-center gap-2">
                          <div className="bg-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>
                            <i className="bi bi-check text-white fs-5"></i>
                          </div>
                          Verified
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-4">
                    <AvatarUpload
                      currentAvatar={user.avatar}
                      userName={user.name}
                    />
                  </div>
                </div>
              )}

              {/* ADDRESS TAB */}
              {tab === "address" && (
                <div className="fade-in">
                  <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-geo-alt fs-4"></i>
                    </div>
                    <div>
                      <h3 className="font-jakarta fw-bolder text-dark mb-0">Address Book</h3>
                      <p className="text-muted small mb-0 mt-1">Manage your delivery locations</p>
                    </div>
                  </div>
                  
                  {user.customerProfile?.addresses && user.customerProfile.addresses.length > 0 ? (
                    <div className="row g-4 mb-5">
                      {user.customerProfile.addresses.map(address => (
                        <div className="col-md-6" key={address.id}>
                          <div className="order-card p-4 h-100 position-relative">
                            {address.isDefault && (
                              <span className="badge bg-danger position-absolute top-0 end-0 mt-4 me-4 rounded-pill px-3 py-2 shadow-sm font-jakarta">Default</span>
                            )}
                            <div className="d-flex align-items-center gap-3 mb-4">
                              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-danger border" style={{width: "48px", height: "48px"}}>
                                <i className="bi bi-house-door-fill fs-5"></i>
                              </div>
                              <div className="fw-bolder font-jakarta fs-5 text-dark">{user.name}</div>
                            </div>
                            
                            <div className="text-muted mb-2 fw-medium"><i className="bi bi-building me-2 text-secondary"></i>{address.street}</div>
                            <div className="text-muted mb-2 fw-medium"><i className="bi bi-map me-2 text-secondary"></i>{address.city}, {address.state} {address.postalCode}</div>
                            <div className="text-muted mb-4 fw-medium"><i className="bi bi-globe me-2 text-secondary"></i>{address.country}</div>
                            
                            <div className="d-flex gap-2">
                              <form action={deleteAddressAction as any} className="flex-grow-1">
                                <input type="hidden" name="addressId" value={address.id} />
                                <button className="btn btn-outline-danger w-100 rounded-pill py-2 fw-bold"><i className="bi bi-trash3"></i></button>
                              </form>
                              {!address.isDefault && (
                                <form action={setDefaultAddressAction as any} className="flex-grow-1">
                                  <input type="hidden" name="addressId" value={address.id} />
                                  <button className="btn btn-outline-primary w-100 rounded-pill py-2 fw-bold"><i className="bi bi-check-circle"></i> Default</button>
                                </form>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 mb-4 bg-light rounded-4 border border-dashed">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm mb-3" style={{width: 80, height: 80}}>
                        <i className="bi bi-geo text-muted fs-2 d-block"></i>
                      </div>
                      <h5 className="font-jakarta fw-bold">No saved addresses</h5>
                      <p className="text-muted mb-0">Add a delivery address below.</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-top">
                    <h5 className="font-jakarta fw-bolder text-dark mb-4 d-flex align-items-center gap-2"><i className="bi bi-plus-circle-fill text-danger fs-4"></i> Add New Address</h5>
                    <div className="bg-white border rounded-4 p-4 shadow-sm">
                      <AddressForm />
                    </div>
                  </div>
                </div>
              )}

              {/* SUPPORT TAB */}
              {tab === "support" && (
                <div className="fade-in">
                  <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                    <div className="bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-headset fs-4"></i>
                    </div>
                    <div>
                      <h3 className="font-jakarta fw-bolder text-dark mb-0">Support Helpdesk</h3>
                      <p className="text-muted small mb-0 mt-1">Get help with orders and track tickets</p>
                    </div>
                  </div>
                  <ProfileSupportManager tickets={serializedTickets} userId={userId} />
                </div>
              )}
              
              {/* REFERRAL TAB */}
              {tab === "referral" && isReferralEnabled && (
                <div className="fade-in">
                  <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                    <div className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-share-fill fs-4"></i>
                    </div>
                    <div>
                      <h3 className="font-jakarta fw-bolder text-dark mb-0">Referral Program</h3>
                      <p className="text-muted small mb-0 mt-1">Invite friends and earn rewards</p>
                    </div>
                  </div>
                  <ReferralLink />
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
