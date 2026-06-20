export default function Newsletter() {
  return (
    <section className="container mb-5">
      <div className="newsletter">
        <h3>Get deals before everyone else</h3>
        <p className="mb-0" style={{opacity: ".95"}}>Sign up for the Swcart newsletter — no spam, just real discounts.</p>
        <form className="newsletter-form" id="newsletterForm">
          <input type="email" id="newsletterEmail" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
        <div className="newsletter-msg" id="newsletterMsg"></div>
      </div>
    </section>
  );
}
