export default function DmcaPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">DMCA Copyright Infringement Policy</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. Notice of Infringement</h4>
        <p className="text-muted mb-4">
          Swcart respects the intellectual property rights of others. If you believe that any content hosted on our marketplace infringes your copyright, you may submit a formal notification under the Digital Millennium Copyright Act (DMCA) to our copyright agent.
        </p>

        <h4 className="fw-bold mb-3">2. Required Information</h4>
        <p className="text-muted mb-4">
          Your DMCA notice must include:
        </p>
        <ul className="text-muted mb-4">
          <li>A description of the copyrighted work you claim has been infringed.</li>
          <li>The URL or exact location on the site where the material is located.</li>
          <li>Your contact information: name, address, email, and phone number.</li>
          <li>A statement indicating your good faith belief that the disputed use is not authorized.</li>
          <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
        </ul>

        <h4 className="fw-bold mb-3">3. Submitting Your Claim</h4>
        <p className="text-muted">
          Please email your notice containing all details to our legal division at: <a href="mailto:legal@swinfosystems.online" className="text-danger text-decoration-none">legal@swinfosystems.online</a>.
        </p>
      </div>
    </div>
  );
}
