import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id, userId },
    include: {
      user: true,
      shippingAddress: true,
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h2>Order Not Found</h2>
        <Link href="/profile" className="btn btn-dark mt-3 rounded-pill px-4">Back to Profile</Link>
      </div>
    );
  }

  const subtotal = order.items.reduce((acc, item) => acc + item.priceAtBuy * item.quantity, 0);
  const tax = order.taxAmount;
  const total = order.totalAmount;

  return (
    <>
      {/* ── Global print override ── hides everything except .inv-root */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');

        .inv-root {
          font-family: 'Inter', sans-serif;
          max-width: 860px;
          margin: 0 auto;
          padding: 1rem 1rem 2rem;
        }

        @media print {
          /* Hide everything on the page first */
          body > * { display: none !important; }

          /* Then show ONLY the main content wrapper */
          body > #__next { display: block !important; }

          /* Hide layout shells – header, footer, util bar, navbars */
          .util-bar,
          .site-header,
          header,
          nav,
          footer,
          .no-print { display: none !important; }

          /* Show only the invoice subtree */
          main, .inv-root { display: block !important; }

          /* Clean print background */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; margin: 0 !important; }
          .inv-root { padding: 0 !important; max-width: 100% !important; }
          .inv-card { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <div className="inv-root">
        {/* Action Bar */}
        <div className="no-print d-flex justify-content-between align-items-center mb-4">
          <Link
            href="/profile"
            className="btn btn-light rounded-pill fw-bold shadow-sm px-4"
            style={{ color: "#444", border: "1px solid #e9ecef" }}
          >
            ← Back to Orders
          </Link>
          <PrintButton />
        </div>

        {/* Invoice Card */}
        <div className="inv-card bg-white rounded-4 overflow-hidden shadow" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>

          {/* Dark Header */}
          <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", padding: "2rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img
                src="https://tools.swinfosystems.online/icon-192.png"
                alt="Swcart"
                style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#fff", padding: "4px", objectFit: "contain" }}
              />
              <div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.9rem", fontWeight: 900, color: "#e63946", letterSpacing: "-1.5px", lineHeight: 1 }}>
                  Swcart<span style={{ color: "#fff" }}>.</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", marginTop: "3px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  The Ultimate Shopping Experience
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Tax Invoice</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", color: "#fff", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
                #{order.id.slice(-8).toUpperCase()}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginTop: "4px" }}>
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Gradient accent bar */}
          <div style={{ height: "4px", background: "linear-gradient(to right, #e63946, #ff6b6b, #ffd166)" }} />

          {/* Body */}
          <div style={{ padding: "2rem 2.5rem" }}>

            {/* Addresses */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#e63946", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0.75rem" }}>Billed To</div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#1a1a2e", marginBottom: "4px" }}>{order.user.name}</div>
                <div style={{ color: "#666", fontSize: "0.85rem" }}>{order.user.email}</div>
                {order.user.phone && <div style={{ color: "#666", fontSize: "0.85rem" }}>{order.user.phone}</div>}
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#e63946", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0.75rem" }}>Delivered To</div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#1a1a2e", marginBottom: "4px" }}>{order.user.name}</div>
                <div style={{ color: "#666", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <span style={{ padding: "0.35rem 1rem", borderRadius: "2rem", fontSize: "0.78rem", fontWeight: 700, background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba" }}>
                Status: {order.status}
              </span>
              <span style={{ padding: "0.35rem 1rem", borderRadius: "2rem", fontSize: "0.78rem", fontWeight: 700, background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" }}>
                💳 Cash on Delivery (COD)
              </span>
              <span style={{ padding: "0.35rem 1rem", borderRadius: "2rem", fontSize: "0.78rem", fontWeight: 700, background: "#e8f4fd", color: "#0c5460", border: "1px solid #bee5eb" }}>
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" }}>
              <thead>
                <tr style={{ background: "#f8f9ff" }}>
                  {["#", "Item Description", "Qty", "Unit Price", "Amount"].map((h, i) => (
                    <th key={h} style={{
                      padding: "0.6rem 0.75rem",
                      textAlign: i === 1 ? "left" : i <= 1 ? "left" : i === 2 ? "center" : "right",
                      fontSize: "0.68rem", fontWeight: 700, color: "#888",
                      letterSpacing: "1.5px", textTransform: "uppercase",
                      borderBottom: "2px solid #e9ecef"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "0.75rem 0.75rem", color: "#bbb", fontSize: "0.85rem" }}>{i + 1}</td>
                    <td style={{ padding: "0.75rem 0.75rem" }}>
                      <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: "0.95rem", marginBottom: "2px" }}>{item.variant.product.title}</div>
                      <div style={{ color: "#aaa", fontSize: "0.78rem" }}>
                        {[item.variant.size && `Size: ${item.variant.size}`, item.variant.color && `Color: ${item.variant.color}`].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.75rem", textAlign: "center", fontWeight: 600, color: "#555" }}>{item.quantity}</td>
                    <td style={{ padding: "0.75rem 0.75rem", textAlign: "right", color: "#888", fontSize: "0.9rem" }}>₹{item.priceAtBuy.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "0.75rem 0.75rem", textAlign: "right", fontWeight: 700, color: "#1a1a2e" }}>₹{(item.priceAtBuy * item.quantity).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ minWidth: "300px" }}>
                {[
                  { label: "Subtotal", value: `₹${subtotal.toLocaleString("en-IN")}`, green: false },
                  { label: "Shipping", value: "Free", green: true },
                  { label: "GST (18%)", value: `₹${tax.toLocaleString("en-IN")}`, green: false },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "#666", fontSize: "0.9rem" }}>
                    <span>{row.label}</span>
                    <span style={{ fontWeight: 600, color: row.green ? "#2ecc71" : "#1a1a2e" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ height: "1px", background: "#e9ecef", margin: "0.75rem 0" }} />
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "1rem 1.25rem",
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  borderRadius: "0.75rem"
                }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: "#fff", fontSize: "1rem" }}>Total Payable</span>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, color: "#e63946", fontSize: "1.25rem" }}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Thank you note */}
            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#f8f9ff", borderRadius: "0.75rem", borderLeft: "4px solid #e63946" }}>
              <div style={{ fontWeight: 600, color: "#1a1a2e", marginBottom: "4px", fontSize: "0.9rem" }}>Thank you for shopping with Swcart!</div>
              <div style={{ color: "#888", fontSize: "0.8rem", lineHeight: 1.6 }}>
                This is a system-generated invoice and does not require a signature. For support, email support@swcart.com.
              </div>
            </div>
          </div>

          {/* Footer Strip */}
          <div style={{ background: "#f8f9fa", padding: "1rem 2.5rem", display: "flex", justify-content: "space-between", alignItems: "center", borderTop: "1px solid #e9ecef", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, color: "#e63946", fontSize: "1.1rem" }}>Swcart.</div>
            <div style={{ color: "#aaa", fontSize: "0.75rem" }}>swcart.com · support@swcart.com</div>
            <div style={{ color: "#aaa", fontSize: "0.75rem" }}>© {new Date().getFullYear()} Swcart. All rights reserved.</div>
          </div>
        </div>
      </div>
    </>
  );
}
