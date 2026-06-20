export default function SellPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh" }}>
      <div className="text-center py-5 text-white rounded-4 shadow-sm mb-5" style={{ background: "linear-gradient(135deg, var(--red) 0%, #aa0000 100%)" }}>
        <h1 className="fw-bold display-4 mb-3">Sell on Swcart</h1>
        <p className="fs-5 opacity-75 mx-auto" style={{maxWidth: "600px"}}>Reach millions of customers and grow your business globally with our powerful seller tools.</p>
        <button className="btn btn-light rounded-pill px-5 py-3 fw-bold mt-4" style={{color: "var(--red)"}}>Start Selling Today</button>
      </div>

      <div className="row g-5 mt-2">
        <div className="col-md-4 text-center">
          <i className="bi bi-cash-coin text-muted mb-3 d-block" style={{fontSize: "3rem"}}></i>
          <h4 className="fw-bold">Low Fees</h4>
          <p className="text-muted">Keep more of what you earn with our competitive commission rates.</p>
        </div>
        <div className="col-md-4 text-center">
          <i className="bi bi-graph-up-arrow text-muted mb-3 d-block" style={{fontSize: "3rem"}}></i>
          <h4 className="fw-bold">Powerful Analytics</h4>
          <p className="text-muted">Track your sales and customer behavior in real-time.</p>
        </div>
        <div className="col-md-4 text-center">
          <i className="bi bi-headset text-muted mb-3 d-block" style={{fontSize: "3rem"}}></i>
          <h4 className="fw-bold">24/7 Support</h4>
          <p className="text-muted">Our seller success team is always here to help you scale.</p>
        </div>
      </div>
    </div>
  );
}
