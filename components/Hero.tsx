export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <span className="eyebrow">Mid-year mega sale is live</span>
            <h1>One cart.<br />Every category<br />you need.</h1>
            <p className="lead">Electronics, fashion, home, grocery and more — Swcart brings it all to one checkout, with deals refreshed every day.</p>
            <a href="#shop" className="btn btn-hero">Start Shopping</a>
          </div>
          <div className="col-lg-6 d-none d-lg-block">
            <div className="hero-art" style={{height: "300px"}}>
              <div className="hero-card">
                <div className="hero-badge">Up to 60% off</div>
                <img id="heroImg1" src="/images/hero-1.png" alt="Featured product" />
              </div>
              <div className="hero-card two">
                <img id="heroImg2" src="/images/hero-2.png" alt="Featured product" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
