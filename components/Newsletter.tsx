"use client";

import { useState } from "react";
import { subscribeNewsletterAction } from "@/app/actions/newsletter";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    const result = await subscribeNewsletterAction(email);
    
    if (result.success) {
      setStatus("success");
      setMessage(result.message || "Subscribed successfully!");
      setEmail("");
    } else {
      setStatus("error");
      setMessage(result.error || "Failed to subscribe.");
    }
  };

  return (
    <section className="container mb-5">
      <div className="newsletter">
        <h3>Get deals before everyone else</h3>
        <p className="mb-0" style={{opacity: ".95"}}>Sign up for the Swcart newsletter — no spam, just real discounts.</p>
        
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
          />
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
        
        {message && (
          <div className={`mt-3 small fw-bold ${status === "success" ? "text-white" : "text-danger"}`}>
            {status === "success" && <i className="bi bi-check-circle me-1"></i>}
            {status === "error" && <i className="bi bi-exclamation-circle me-1"></i>}
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
