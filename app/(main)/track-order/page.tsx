import { prisma } from "@/lib/db";
import Link from "next/link";

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
    <div className="container py-5" style={{ minHeight: "70vh", maxWidth: "800px" }}>
      <div className="text-center mb-5">
        <h1 className="fw-bold mb-2">Track Your Package</h1>
        <p className="text-muted">Enter your Swcart Order ID below to get real-time tracking information.</p>
      </div>

      {/* Input tracker Form */}
      <div className="bg-white p-4 rounded-4 shadow-sm border border-light mb-4">
        <form method="GET" action="/track-order">
          <div className="row g-2 align-items-center">
            <div className="col-md-9">
              <input 
                type="text" 
                name="id"
                className="form-control form-control-lg bg-light border-0 shadow-sm px-4 rounded-pill"
                placeholder="Paste Order ID here (e.g. clx123456789...)"
                defaultValue={orderId || ""}
                required
              />
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-danger btn-lg w-100 rounded-pill fw-bold py-2 shadow-sm text-white" style={{ background: "var(--red)" }}>
                Track Order
              </button>
            </div>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="alert alert-danger border-0 rounded-4 p-3 text-center shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
        </div>
      )}

      {/* Tracking results */}
      {order && (
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light">
          {/* Summary */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-2">
            <div>
              <span className="text-muted small">Tracking Order: </span>
              <strong className="text-dark small">#{order.id.toUpperCase()}</strong>
            </div>
            <div>
              <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold" style={{ fontSize: "0.8rem" }}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Timeline Visual Progress */}
          <div className="my-5">
            <div className="position-relative d-flex justify-content-between align-items-center" style={{ minHeight: "80px" }}>
              {/* Progress Line */}
              <div 
                className="position-absolute start-0 end-0 bg-light" 
                style={{ height: "4px", zIndex: 1, top: "25px" }}
              />
              <div 
                className="position-absolute start-0 bg-danger" 
                style={{ 
                  height: "4px", 
                  zIndex: 2, 
                  top: "25px",
                  width: `${(Math.max(0, currentStatusIndex) / (statusSteps.length - 1)) * 100}%`,
                  transition: "width 0.5s ease"
                }}
              />

              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIndex;
                const isActive = idx === currentStatusIndex;
                return (
                  <div key={step} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3, width: "25%" }}>
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center border-3 ${
                        isCompleted 
                          ? "bg-danger text-white border-danger" 
                          : "bg-white text-muted border-light shadow-sm"
                      }`} 
                      style={{ 
                        width: "50px", 
                        height: "50px", 
                        fontSize: "1.2rem",
                        transform: isActive ? "scale(1.15)" : "scale(1)"
                      }}
                    >
                      <i className={`bi ${
                        step === "PENDING" ? "bi-cart-check" :
                        step === "PROCESSING" ? "bi-gear-wide-connected" :
                        step === "SHIPPED" ? "bi-truck" : "bi-house-check"
                      }`}></i>
                    </div>
                    <span className={`small fw-bold mt-2 text-center ${isCompleted ? "text-dark" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                      {step === "PENDING" ? "Placed" :
                       step === "PROCESSING" ? "Processed" :
                       step === "SHIPPED" ? "Shipped" : "Delivered"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-light p-4 rounded-4 border-light mt-4">
            <h6 className="fw-bold mb-3 text-dark"><i className="bi bi-box-seam text-danger me-2"></i> Shipment Items</h6>
            <div className="d-flex flex-column gap-2">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary border-opacity-10 last-border-0">
                  <div>
                    <span className="fw-bold small text-dark">{item.variant.product.title}</span>
                    <div className="text-muted small" style={{ fontSize: "0.75rem" }}>Size: {item.variant.size || "Default"}, Color: {item.variant.color || "Default"}</div>
                  </div>
                  <span className="text-muted small">Qty: <strong>{item.quantity}</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking History Timeline */}
          {order.trackingHistory && order.trackingHistory.length > 0 && (
            <div className="bg-light p-4 rounded-4 border-light mt-4">
              <h6 className="fw-bold mb-4 text-dark"><i className="bi bi-clock-history text-danger me-2"></i> Detailed Tracking Updates</h6>
              <div className="position-relative ms-2">
                {/* Vertical Line */}
                <div className="position-absolute bg-secondary bg-opacity-25" style={{ width: "2px", top: "10px", bottom: "10px", left: "6px" }}></div>
                
                <div className="d-flex flex-column gap-4">
                  {order.trackingHistory.map((history: any, i: number) => (
                    <div key={i} className="position-relative ps-4">
                      {/* Timeline Dot */}
                      <div className="position-absolute bg-white border border-danger border-2 rounded-circle" style={{ width: "14px", height: "14px", left: "0", top: "4px" }}></div>
                      
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-dark">{history.status}</span>
                        <div className="d-flex align-items-center text-muted small gap-2 mt-1">
                          {history.location && <><i className="bi bi-geo-alt-fill text-secondary"></i> {history.location}</>}
                          <span className="text-secondary opacity-50">&bull;</span>
                          <span>{new Date(history.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
