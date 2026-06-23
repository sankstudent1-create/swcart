import { prisma } from "@/lib/db";
import Link from "next/link";
import "./track.css"; // We'll add this below for custom animations
import PrintTrackingBtn from "./PrintTrackingBtn";

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const orderId = sp.id || null;

  let order = null;
  let errorMsg = "";

  if (orderId) {
    try {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: { equals: orderId } },
            { id: { endsWith: orderId, mode: 'insensitive' } }
          ]
        },
        include: {
          user: true,
          trackingHistory: { orderBy: { timestamp: "desc" } },
          sellerOrders: {
            include: {
              items: {
                include: {
                  variant: {
                    include: {
                      product: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      if (!order) {
        errorMsg = `Order ID "${orderId}" not found. Please verify the code.`;
      }
    } catch (e) {
      errorMsg = "An error occurred while tracking your package. Please try again.";
    }
  }

  // Get current status index
  const statusSteps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStatusIndex = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <>
      {/* Vibrant Hero Section */}
      <div className="track-hero position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(230,57,70,0.05) 0%, rgba(29,53,87,0.05) 100%)", padding: "4rem 0 3rem", marginTop: "-1.5rem" }}>
        <div className="position-absolute top-0 start-50 translate-middle" style={{ width: "800px", height: "800px", background: "radial-gradient(circle, rgba(230,57,70,0.08) 0%, transparent 60%)", zIndex: 0 }}></div>
        <div className="container position-relative z-2 text-center" style={{ maxWidth: "800px" }}>
          <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-3" style={{ width: "64px", height: "64px", border: "2px solid rgba(230,57,70,0.1)" }}>
            <i className="bi bi-box-seam text-danger fs-3"></i>
          </div>
          <h1 className="font-jakarta fw-bolder text-dark mb-2" style={{ letterSpacing: "-1px", fontSize: "2.5rem" }}>Track Your Package</h1>
          <p className="font-jakarta text-muted mb-4 fs-5">Enter your Order ID to get real-time tracking updates.</p>

          {/* Glassmorphic Search Form */}
          <div className="glass-panel p-3 p-md-4 mx-auto shadow-lg" style={{ maxWidth: "600px", borderRadius: "20px" }}>
            <form method="GET" action="/track-order">
              <div className="d-flex flex-column flex-md-row gap-3">
                <div className="flex-grow-1 position-relative">
                  <i className="bi bi-search position-absolute text-muted" style={{ left: "20px", top: "50%", transform: "translateY(-50%)" }}></i>
                  <input 
                    type="text" 
                    name="id"
                    className="form-control form-control-lg border-0 shadow-none font-jakarta"
                    style={{ background: "rgba(255,255,255,0.8)", paddingLeft: "50px", borderRadius: "14px", height: "56px" }}
                    placeholder="e.g. clx123456789..."
                    defaultValue={orderId || ""}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-danger btn-lg fw-bold font-jakarta text-white border-0 shadow-sm px-4" style={{ borderRadius: "14px", height: "56px", background: "linear-gradient(135deg, #e63946 0%, #c1121f 100%)" }}>
                  Track Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container py-5 font-jakarta" style={{ minHeight: "50vh", maxWidth: "800px" }}>
        {errorMsg && (
          <div className="alert alert-danger border-0 rounded-4 p-4 text-center shadow-sm glass-panel font-jakarta fade-in d-flex flex-column align-items-center" style={{ background: "rgba(255,235,238,0.8)" }}>
            <i className="bi bi-exclamation-triangle text-danger fs-1 mb-2"></i>
            <span className="fw-semibold text-danger">{errorMsg}</span>
          </div>
        )}

        {/* Tracking results */}
        {order && (
          <div className="fade-in">
            {/* Header Status Chip */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div>
                <span className="text-muted small text-uppercase fw-bold tracking-wide">Tracking Reference</span>
                <div className="font-jakarta fw-bolder fs-4 text-dark">#{order.id.toUpperCase()}</div>
              </div>
              <div className="glass-panel px-4 py-2 rounded-pill border-0 shadow-sm d-flex align-items-center gap-2" style={{ background: "rgba(255,255,255,0.9)" }}>
                <div className="pulse-dot bg-danger rounded-circle" style={{ width: "10px", height: "10px" }}></div>
                <span className="fw-bold text-dark font-jakarta text-uppercase tracking-wide" style={{ fontSize: "0.85rem" }}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Premium Timeline Visual Progress */}
            <div className="glass-panel p-4 p-md-5 mb-5 shadow-sm border-0 position-relative overflow-hidden">
              {/* Subtle background flair */}
              <div className="position-absolute top-0 end-0 bg-danger bg-opacity-10 rounded-circle" style={{ width: "150px", height: "150px", transform: "translate(50%, -50%)", filter: "blur(40px)" }}></div>
              
              <div className="position-relative d-flex justify-content-between align-items-center mb-2" style={{ minHeight: "80px", zIndex: 2 }}>
                {/* Progress Track Background */}
                <div 
                  className="position-absolute start-0 end-0 rounded-pill" 
                  style={{ height: "6px", zIndex: 1, top: "22px", background: "rgba(0,0,0,0.05)" }}
                />
                
                {/* Glowing Active Progress Bar */}
                <div 
                  className="position-absolute start-0 rounded-pill progress-glow" 
                  style={{ 
                    height: "6px", 
                    zIndex: 2, 
                    top: "22px",
                    width: `${(Math.max(0, currentStatusIndex) / (statusSteps.length - 1)) * 100}%`,
                    background: "linear-gradient(90deg, #e63946 0%, #ffb703 100%)",
                    transition: "width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  }}
                />

                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStatusIndex;
                  const isActive = idx === currentStatusIndex;
                  return (
                    <div key={step} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3, width: "25%" }}>
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm step-icon-container ${
                          isActive ? "active pulse-glow" : ""
                        }`} 
                        style={{ 
                          width: "48px", 
                          height: "48px", 
                          fontSize: "1.2rem",
                          background: isCompleted ? (isActive ? "#ffb703" : "#e63946") : "#fff",
                          color: isCompleted ? "#fff" : "#adb5bd",
                          border: isCompleted ? "none" : "2px solid #e9ecef",
                          transition: "all 0.4s ease"
                        }}
                      >
                        <i className={`bi ${
                          step === "PENDING" ? "bi-cart-check-fill" :
                          step === "PROCESSING" ? "bi-gear-fill" :
                          step === "SHIPPED" ? "bi-truck" : "bi-house-check-fill"
                        }`}></i>
                      </div>
                      <span className={`font-jakarta fw-bold mt-3 text-center ${isCompleted ? "text-dark" : "text-muted opacity-50"}`} style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
                        {step === "PENDING" ? "Order Placed" :
                         step === "PROCESSING" ? "Processing" :
                         step === "SHIPPED" ? "Shipped" : "Delivered"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="row g-4">
              {/* Package Details */}
              <div className="col-md-6">
                <div className="glass-panel p-4 h-100 shadow-sm border-0">
                  <h6 className="font-jakarta fw-bolder mb-4 text-dark d-flex align-items-center">
                    <div className="bg-danger bg-opacity-10 text-danger rounded p-2 me-3"><i className="bi bi-box-seam"></i></div>
                    Package Contents
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {order.sellerOrders.flatMap((so: any) => so.items).map((item: any, i: number) => (
                      <div key={i} className="d-flex align-items-center gap-3 bg-white bg-opacity-50 p-3 rounded-4 border border-light">
                        {item.variant.product.images?.[0] ? (
                          <img src={item.variant.product.images[0]} alt={item.variant.product.title} className="rounded-3 object-fit-cover shadow-sm" style={{width: "50px", height: "50px"}} />
                        ) : (
                          <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{width: "50px", height: "50px"}}>
                            <i className="bi bi-image text-muted"></i>
                          </div>
                        )}
                        <div className="flex-grow-1 min-width-0">
                          <div className="font-jakarta fw-bold text-dark text-truncate" style={{ fontSize: "0.9rem" }}>{item.variant.product.title}</div>
                          <div className="text-muted small mt-1" style={{ fontSize: "0.75rem" }}>
                            {item.variant.size && `Size: ${item.variant.size}`}
                            {item.variant.color && ` • Color: ${item.variant.color}`}
                          </div>
                        </div>
                        <div className="bg-light rounded-pill px-3 py-1 text-dark fw-bold font-jakarta shadow-sm" style={{ fontSize: "0.8rem" }}>
                          x{item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracking History Timeline */}
              <div className="col-md-6">
                <div className="glass-panel p-4 h-100 shadow-sm border-0">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="font-jakarta fw-bolder text-dark d-flex align-items-center m-0">
                      <div className="bg-dark bg-opacity-10 text-dark rounded p-2 me-3"><i className="bi bi-clock-history"></i></div>
                      Detailed History
                    </h6>
                    <div style={{ width: "180px" }}>
                      <PrintTrackingBtn order={order} />
                    </div>
                  </div>
                  
                  {order.trackingHistory && order.trackingHistory.length > 0 ? (
                    <div className="position-relative ms-2 mt-3 pb-3">
                      {/* Vertical Dashed Line */}
                      <div className="position-absolute border-start border-2 border-dashed border-secondary border-opacity-25" style={{ top: "10px", bottom: "0", left: "9px" }}></div>
                      
                      <div className="d-flex flex-column gap-4">
                        {order.trackingHistory.map((history: any, i: number) => {
                          const isLatest = i === 0;
                          return (
                            <div key={i} className="position-relative ps-4 ms-2">
                              {/* Timeline Dot */}
                              <div className={`position-absolute rounded-circle shadow-sm ${isLatest ? 'bg-danger pulse-dot-small border border-2 border-white' : 'bg-white border border-2 border-secondary border-opacity-50'}`} style={{ width: "16px", height: "16px", left: "-6px", top: "4px" }}></div>
                              
                              <div className="d-flex flex-column bg-white bg-opacity-50 p-3 rounded-4 border border-light">
                                <span className={`font-jakarta fw-bold ${isLatest ? 'text-danger' : 'text-dark'}`}>{history.status}</span>
                                <div className="d-flex align-items-center text-muted small gap-2 mt-2">
                                  <i className="bi bi-clock"></i>
                                  <span>{new Date(history.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                                </div>
                                {history.location && (
                                  <div className="d-flex align-items-center text-muted small gap-2 mt-1">
                                    <i className="bi bi-geo-alt-fill text-secondary opacity-50"></i>
                                    <span>{history.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5 opacity-50">
                      <i className="bi bi-hourglass-split fs-1 text-muted mb-3 d-block"></i>
                      <p className="font-inter small text-muted">Tracking details are currently pending. Check back soon.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
