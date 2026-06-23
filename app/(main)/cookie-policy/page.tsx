export default function CookiePolicyPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Cookie Policy</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. What are Cookies?</h4>
        <p className="text-muted mb-4">
          Cookies are small text files stored on your computer or mobile device when you visit a website. They help us remember your actions, preferences, and details to give you a smoother browsing experience.
        </p>

        <h4 className="fw-bold mb-3">2. How We Use Cookies</h4>
        <p className="text-muted mb-4">
          We use cookies to keep you signed in, remember your cart items, analyze traffic patterns, and show personalized marketing content.
        </p>

        <h4 className="fw-bold mb-3">3. Types of Cookies We Use</h4>
        <ul className="text-muted mb-4">
          <li><strong>Essential Cookies:</strong> Required to access secure account features and complete checkouts.</li>
          <li><strong>Performance Cookies:</strong> Collect anonymous data about how users interact with the platform.</li>
          <li><strong>Targeting/Advertising Cookies:</strong> Used to deliver ads relevant to your shopping preferences.</li>
        </ul>

        <h4 className="fw-bold mb-3">4. Managing Your Preferences</h4>
        <p className="text-muted">
          You can modify your browser settings to decline cookies if you prefer. However, please note that some sections of Swcart may not function properly if cookies are disabled.
        </p>
      </div>
    </div>
  );
}
