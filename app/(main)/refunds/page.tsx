export default function RefundsPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Returns & Refunds</h1>
      
      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">7-Day Hassle-Free Returns</h4>
        <p className="text-muted mb-4">If you are not completely satisfied with your purchase, you can return it within 7 days of delivery for a full refund or exchange.</p>

        <h4 className="fw-bold mb-3">Conditions</h4>
        <ul className="text-muted mb-4">
          <li>Items must be unused and in their original packaging.</li>
          <li>Electronics must have all seals intact.</li>
          <li>Clothing must have tags attached.</li>
        </ul>

        <h4 className="fw-bold mb-3">How to initiate a return?</h4>
        <p className="text-muted">Go to your Profile &gt; Order History, and click "Return Item" next to the eligible product.</p>
      </div>
    </div>
  );
}
