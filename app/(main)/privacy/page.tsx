export default function PrivacyPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Privacy Policy</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. Information We Collect</h4>
        <p className="text-muted mb-4">
          We collect personal identification information (such as name, email address, shipping address, billing address, and contact number) when you register on our site, place an order, or subscribe to our newsletter.
        </p>

        <h4 className="fw-bold mb-3">2. How We Use Your Information</h4>
        <p className="text-muted mb-4">
          We use the information we collect to process transactions, manage accounts, personalize your shopping experience, and communicate order tracking status or support responses.
        </p>

        <h4 className="fw-bold mb-3">3. Data Sharing & Security</h4>
        <p className="text-muted mb-4">
          We prioritize transaction safety. All online payments are securely handled by PCI-DSS compliant processors (like Razorpay). We do not store credit card details or bank credentials on our systems. Your shipping address is shared exclusively with our logistics partners for delivery purposes.
        </p>

        <h4 className="fw-bold mb-3">4. Cookies Policy</h4>
        <p className="text-muted mb-4">
          We use cookies to keep track of items in your shopping cart, remember user preferences, and understand browser usage statistics to continuously improve Swcart.
        </p>

        <h4 className="fw-bold mb-3">5. Your Rights</h4>
        <p className="text-muted">
          You have the right to request access to the personal data we hold about you or request correction/deletion of your personal records. Contact us at <a href="mailto:support@swinfosystems.online" className="text-decoration-none text-danger">support@swinfosystems.online</a> to make such requests.
        </p>
      </div>
    </div>
  );
}
