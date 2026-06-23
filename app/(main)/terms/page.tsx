export default function TermsPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Terms and Conditions</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. Agreement to Terms</h4>
        <p className="text-muted mb-4">
          By accessing or using the Swcart platform (provided by SW Infosystems), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
        </p>

        <h4 className="fw-bold mb-3">2. Account Registration & Safety</h4>
        <p className="text-muted mb-4">
          You may need to create an account to access certain features. You are solely responsible for maintaining account confidentiality and all activities occurring under your credentials.
        </p>

        <h4 className="fw-bold mb-3">3. Payments, Pricing & Currencies</h4>
        <p className="text-muted mb-4">
          All payments are processed securely through authorized partners, including Razorpay. Prices listed on the platform are in Indian Rupees (INR). For international customers paying in external currencies, dynamic conversions and transaction charges may be applied by the payment gateway and card issuer.
        </p>

        <h4 className="fw-bold mb-3">4. Intellectual Property</h4>
        <p className="text-muted mb-4">
          All original platform designs, software code, logos, and features are intellectual property of SW Infosystems. You may not copy, modify, or distribute any part without prior written permission.
        </p>

        <h4 className="fw-bold mb-3">5. Limitation of Liability</h4>
        <p className="text-muted mb-4">
          Swcart provides services on an "as is" and "as available" basis. We do not warrant that product descriptions are completely error-free or that delivery carriers will not experience unexpected delays.
        </p>

        <h4 className="fw-bold mb-3">6. Governing Law & Jurisdiction</h4>
        <p className="text-muted">
          These Terms are governed by and construed in accordance with the laws of India. Any legal actions or proceedings arising out of these terms shall be subject to the exclusive jurisdiction of the courts in Noida, Uttar Pradesh, India.
        </p>
      </div>
    </div>
  );
}
