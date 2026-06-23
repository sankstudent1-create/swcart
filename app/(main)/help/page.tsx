export default function HelpPage() {
  const categories = [
    {
      title: "Order & Deliveries",
      icon: "bi-truck",
      questions: [
        { q: "How can I track my shipment?", a: "Go to the 'Track Order' link in the top bar or inside your profile order history, and enter your order tracking ID." },
        { q: "Do you ship internationally?", a: "Yes, we support international shipping to selected destinations. Timelines range from 7 to 15 business days depending on customs." }
      ]
    },
    {
      title: "Payments & Refunds",
      icon: "bi-credit-card",
      questions: [
        { q: "What payment methods are supported?", a: "We support major credit cards, debit cards, UPI, net banking, and Cash on Delivery (COD)." },
        { q: "How long does a refund take?", a: "Once approved, refunds are processed and credited back to your original source of payment within 5-7 business days." }
      ]
    },
    {
      title: "Sellers & KYC",
      icon: "bi-shop",
      questions: [
        { q: "How do I start selling on Swcart?", a: "Click on 'Sell on Swcart' in the top utility bar, complete the registration form, and submit your GST/PAN details." },
        { q: "What is the KYC approval process?", a: "Administrators verify your submitted documentation within 24-48 business hours, after which your store goes live." }
      ]
    }
  ];

  return (
    <div className="container py-5" style={{ minHeight: "70vh", maxWidth: "900px" }}>
      <h1 className="fw-bold mb-2">Help Center & Knowledge Base</h1>
      <p className="text-muted fs-5 mb-5">Have a question? Browse our help categories or search below.</p>

      {/* Categories Grid */}
      <div className="row g-4 mb-5">
        {categories.map((cat, idx) => (
          <div key={idx} className="col-md-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border border-light text-center h-100">
              <i className={`bi ${cat.icon} text-danger mb-3 d-block`} style={{ fontSize: "2rem" }}></i>
              <h5 className="fw-bold">{cat.title}</h5>
              <p className="text-muted small mb-0">{cat.questions.length} helper articles available.</p>
            </div>
          </div>
        ))}
      </div>

      {/* Accordion FAQ */}
      <div className="bg-white p-5 rounded-4 shadow-sm border border-light">
        <h3 className="fw-bold mb-4 text-center">Frequently Asked Questions</h3>
        <div className="accordion accordion-flush" id="faqAccordion">
          {categories.flatMap(c => c.questions).map((item, idx) => (
            <div className="accordion-item border-bottom py-2" key={idx}>
              <h2 className="accordion-header" id={`heading-${idx}`}>
                <button 
                  className="accordion-button collapsed fw-bold text-dark bg-transparent shadow-none" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target={`#collapse-${idx}`} 
                  aria-expanded="false" 
                  aria-controls={`collapse-${idx}`}
                >
                  {item.q}
                </button>
              </h2>
              <div 
                id={`collapse-${idx}`} 
                className="collapse" 
                aria-labelledby={`heading-${idx}`} 
                data-bs-parent="#faqAccordion"
              >
                <div className="accordion-body text-muted small">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
