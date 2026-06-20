export default function ShippingPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Shipping Policy</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. Delivery Times</h4>
        <p className="text-muted mb-4">We strive to deliver your orders as quickly as possible. Standard shipping usually takes 3-5 business days. Expedited options are available at checkout.</p>

        <h4 className="fw-bold mb-3">2. Free Shipping</h4>
        <p className="text-muted mb-4">Orders over ₹499 qualify for free standard shipping within eligible regions.</p>

        <h4 className="fw-bold mb-3">3. International Shipping</h4>
        <p className="text-muted">Currently, we only ship domestically. International shipping features will be rolled out later this year.</p>
      </div>
    </div>
  );
}
