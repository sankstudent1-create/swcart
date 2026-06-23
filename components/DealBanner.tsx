export default function DealBanner() {
  return (
    <section className="container mb-5">
      <div className="deal-banner shadow-sm hover-shadow transition-all border border-light" style={{ background: "linear-gradient(135deg, #FFF5ED 0%, #FFFDFB 100%)", borderRadius: "24px", padding: "50px 40px" }}>
        <div>
          <span className="badge bg-danger rounded-pill mb-2 px-3 py-2 fw-bold text-uppercase" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Limited Offer</span>
          <h3 className="fw-bolder text-dark mb-2" style={{ fontSize: "2rem" }}>Deal of the Day</h3>
          <p className="mb-0 text-muted" style={{ fontSize: "0.95rem" }}>Flat 40% off on Home &amp; Kitchen essentials. Ends soon.</p>
        </div>
        <div className="deal-timer d-flex gap-3" id="dealTimer">
          <div className="bg-dark text-white rounded-3 p-3 text-center" style={{ minWidth: "70px" }}>
            <span className="fs-3 fw-bold d-block" id="th">12</span>
            <small className="text-muted small text-uppercase" style={{ fontSize: "0.6rem" }}>Hours</small>
          </div>
          <div className="bg-dark text-white rounded-3 p-3 text-center" style={{ minWidth: "70px" }}>
            <span className="fs-3 fw-bold d-block" id="tm">00</span>
            <small className="text-muted small text-uppercase" style={{ fontSize: "0.6rem" }}>Mins</small>
          </div>
          <div className="bg-dark text-white rounded-3 p-3 text-center" style={{ minWidth: "70px" }}>
            <span className="fs-3 fw-bold d-block" id="ts">00</span>
            <small className="text-muted small text-uppercase" style={{ fontSize: "0.6rem" }}>Secs</small>
          </div>
        </div>
        <a href="#shop" className="btn btn-danger rounded-pill px-5 py-3 fw-bold shadow-lg transition-all hover-lift">
          Grab the Deal <i className="bi bi-arrow-right ms-2"></i>
        </a>
      </div>
      <style>{`
        .hover-shadow:hover {
          box-shadow: 0 20px 40px rgba(232, 71, 42, 0.08) !important;
        }
      `}</style>
    </section>
  );
}
