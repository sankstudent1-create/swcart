export default function ContactPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Contact Us</h1>
      <p className="text-muted fs-5 mb-5">We are here to help! Get in touch with our team.</p>

      <div className="row g-4">
        <div className="col-12">
          <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
            <h4 className="fw-bold mb-4">Support & Business Operations Details</h4>

            <div className="mb-4">
              <h6 className="fw-bold mb-1 text-danger">Registered Business Name</h6>
              <p className="text-muted">Swcart (SW Infosystems)</p>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-1 text-danger">Registered Office Address</h6>
              <p className="text-muted">
                123, Tech Plaza, Sector-62,<br />
                Noida, Uttar Pradesh, 201301,<br />
                India
              </p>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-1 text-danger">Customer Support Email</h6>
              <p className="text-muted">
                <a href="mailto:support@swinfosystems.online" className="text-decoration-none text-muted">
                  support@swinfosystems.online
                </a>
              </p>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-1 text-danger">Customer Support Hotline</h6>
              <p className="text-muted">+91 98765 43210 (Mon-Sat, 9:00 AM - 6:00 PM IST)</p>
            </div>
            
            <hr className="my-4 text-muted" />

            <h5 className="fw-bold mb-3">Send Us a Message</h5>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Full Name</label>
                <input type="text" className="form-control rounded-3" placeholder="Enter your name" required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Email Address</label>
                <input type="email" className="form-control rounded-3" placeholder="Enter your email" required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Message</label>
                <textarea className="form-control rounded-3" rows={4} placeholder="How can we help you?" required></textarea>
              </div>
              <button type="submit" className="btn btn-danger w-100 rounded-3 py-2 fw-semibold">
                Submit Query
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
