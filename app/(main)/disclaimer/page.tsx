export default function DisclaimerPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">Disclaimer</h1>
      <p className="text-muted mb-4">Last updated: June 20, 2026</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">1. General Information Only</h4>
        <p className="text-muted mb-4">
          All content, product lists, blogs, reviews, and specifications available on Swcart are for general information purposes only. While we attempt to verify content correctness, we make no representations or warranties of any kind regarding completeness or accuracy.
        </p>

        <h4 className="fw-bold mb-3">2. Third-Party Products & Links</h4>
        <p className="text-muted mb-4">
          As a multi-vendor marketplace, many listings and services are managed by independent sellers. Swcart does not guarantee the performance, quality, or safety of products listed by third-party sellers. Clicking links to external domains is at your own discretion.
        </p>

        <h4 className="fw-bold mb-3">3. Limitation of Liabilities</h4>
        <p className="text-muted">
          Under no circumstances shall SW Infosystems or Swcart be held liable for any loss or damage (including indirect or consequential loss) arising from database interruptions, logistics delays, or products purchased on the platform.
        </p>
      </div>
    </div>
  );
}
