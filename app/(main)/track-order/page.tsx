export default function TrackOrderPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "600px" }}>
      <h1 className="fw-bold mb-4 text-center">Track Your Order</h1>
      <p className="text-muted text-center mb-5">Enter your tracking number or order ID below to see real-time updates on your shipment.</p>
      
      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <div className="form-group mb-4">
          <label className="fw-semibold mb-2">Order ID or Tracking Number</label>
          <input type="text" className="form-control form-control-lg bg-light" placeholder="e.g. TRK123456789" />
        </div>
        <button className="btn w-100 py-3 fw-bold rounded-3 text-white" style={{background: "var(--red)"}}>Track Package</button>
      </div>
    </div>
  );
}
