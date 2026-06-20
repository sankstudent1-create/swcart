export default function DealBanner() {
  return (
    <section className="container mb-4">
      <div className="deal-banner">
        <div>
          <h3>Deal of the Day</h3>
          <p className="mb-0" style={{color: "#7a5c45"}}>Flat 40% off on Home &amp; Kitchen essentials. Ends soon.</p>
        </div>
        <div className="deal-timer" id="dealTimer">
          <div><span id="th">12</span><small>HRS</small></div>
          <div><span id="tm">00</span><small>MIN</small></div>
          <div><span id="ts">00</span><small>SEC</small></div>
        </div>
        <a href="#shop" className="btn btn-hero" style={{background: "var(--ink)", color: "#fff"}}>Grab the Deal</a>
      </div>
    </section>
  );
}
