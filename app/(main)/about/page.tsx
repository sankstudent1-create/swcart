export default function AboutPage() {
  return (
    <div className="container py-5" style={{ minHeight: "60vh", maxWidth: "800px" }}>
      <h1 className="fw-bold mb-4">About Us</h1>
      <p className="text-muted fs-5 mb-5">Learn more about Swcart and our mission.</p>

      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h4 className="fw-bold mb-3">Welcome to Swcart</h4>
        <p className="text-muted mb-4">
          Swcart is a premium, multi-category e-commerce platform dedicated to providing customers with a seamless, secure, and delightful online shopping experience. We bring together a diverse range of products across electronics, fashion, home essentials, groceries, beauty, and more under one digital roof.
        </p>

        <h4 className="fw-bold mb-3">Our Mission</h4>
        <p className="text-muted mb-4">
          Our mission is to simplify digital retail for both consumers and merchants. By enabling smooth transaction flows, offering curated product selections, and maintaining robust customer support channels, we aim to bridge the gap between quality manufacturers and eager buyers worldwide.
        </p>

        <h4 className="fw-bold mb-3">Our Core Values</h4>
        <ul className="text-muted mb-0">
          <li className="mb-2"><strong>Customer First:</strong> We continuously innovate our UX and backend systems to serve our customers better.</li>
          <li className="mb-2"><strong>Security & Reliability:</strong> We partner with leading financial processors (like Razorpay) to ensure every transaction is secure and seamless.</li>
          <li><strong>Global Reach:</strong> We connect domestic excellence with global consumers, building pathways for reliable international trade and deliveries.</li>
        </ul>
      </div>
    </div>
  );
}
