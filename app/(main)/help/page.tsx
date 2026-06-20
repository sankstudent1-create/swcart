export default function HelpPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh" }}>
      <h1 className="fw-bold mb-4">Help Center</h1>
      <p className="text-muted fs-5 mb-5">How can we assist you today?</p>
      
      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <i className="bi bi-box-seam text-danger mb-3 d-block" style={{fontSize: "2rem"}}></i>
            <h5 className="fw-bold">Where is my order?</h5>
            <p className="text-muted small">Learn how to track your package and what to do if it's delayed.</p>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <i className="bi bi-arrow-return-left text-danger mb-3 d-block" style={{fontSize: "2rem"}}></i>
            <h5 className="fw-bold">Returns & Refunds</h5>
            <p className="text-muted small">Our policies on returning items and getting your money back.</p>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="bg-white p-4 rounded-4 shadow-sm border border-light h-100">
            <i className="bi bi-credit-card text-danger mb-3 d-block" style={{fontSize: "2rem"}}></i>
            <h5 className="fw-bold">Payment Issues</h5>
            <p className="text-muted small">Troubleshoot failed payments and billing inquiries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
