export default function ShippingPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Shipping and Delivery Policy</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. Shipping Coverage & Partners</h4>
        <p className="text-muted mb-4">
          We ship to addresses within India and to selected international destinations. We partner with reliable shipping aggregators and premium courier services (such as DHL, FedEx, and Blue Dart) to ensure safe and timely delivery.
        </p>

        <h4 className="fw-bold mb-3">2. Processing & Dispatch Timelines</h4>
        <p className="text-muted mb-4">
          All orders are processed within 1-2 business days. Orders placed during weekends or national holidays will be processed on the next business day. You will receive an email confirmation with tracking details once your order is dispatched.
        </p>

        <h4 className="fw-bold mb-3">3. Delivery Timelines</h4>
        <ul className="text-muted mb-4">
          <li><strong>Domestic Deliveries:</strong> Standard shipping typically takes 3-5 business days across major cities. Delivery to remote regions may take up to 7 business days.</li>
          <li><strong>International Deliveries:</strong> International shipments typically take 7-15 business days depending on destination customs clearance times and carrier speed.</li>
        </ul>

        <h4 className="fw-bold mb-3">4. Shipping Charges & Free Shipping</h4>
        <p className="text-muted mb-4">
          Domestic orders over ₹499 qualify for free standard shipping. Shipping charges for orders below ₹499, as well as all international delivery options, are calculated dynamically at checkout based on destination weight and dimensions.
        </p>

        <h4 className="fw-bold mb-3">5. Customs, Duties & Taxes</h4>
        <p className="text-muted">
          For international orders, customers are responsible for paying any import duties, taxes, or local customs clearance fees levied at the destination country. Swcart is not responsible for delays caused by customs processes in international zones.
        </p>
      </div>
    </div>
  );
}
