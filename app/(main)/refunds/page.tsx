export default function RefundsPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Refund and Cancellation Policy</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. Return Window</h4>
        <p className="text-muted mb-4">
          We offer a 7-day hassle-free return window. If you are not completely satisfied with your purchase, you can initiate a return request within 7 days of receiving the package.
        </p>

        <h4 className="fw-bold mb-3">2. Return Conditions</h4>
        <ul className="text-muted mb-4">
          <li>Items must be unused, unwashed, and in their original packaging.</li>
          <li>Product tags, booklets, warranty cards, and accessories must remain intact.</li>
          <li>For electronics, seals must not be broken or tampered with.</li>
        </ul>

        <h4 className="fw-bold mb-3">3. Cancellations</h4>
        <p className="text-muted mb-4">
          Orders can be cancelled at any time before they are shipped. Once shipped, cancellations cannot be processed; however, you may refuse the shipment at the door or request a return upon delivery.
        </p>

        <h4 className="fw-bold mb-3">4. Refund Processing Timeline</h4>
        <p className="text-muted mb-4">
          Once your return item is received and inspected at our fulfillment center, we will send an email notifying you of approval or rejection. If approved, your refund will be processed automatically back to the original method of payment (via Razorpay) within <strong>5-7 business days</strong>.
        </p>

        <h4 className="fw-bold mb-3">5. International Orders & Shipping Costs</h4>
        <p className="text-muted">
          For international orders, return shipping charges, import customs duties, and local taxes paid at destination are non-refundable. Customers are responsible for safe shipping of returned goods back to our central warehouse.
        </p>
      </div>
    </div>
  );
}
