"use client";

import Link from "next/link";
import { registerSupabase } from "../../actions/authSupabase";
import { useState, useTransition, useEffect } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [referredBy, setReferredBy] = useState<string | null>(null);

  useEffect(() => {
    // Read the swcart_ref cookie to show the referral banner
    const match = document.cookie.match(/(?:^|;\s*)swcart_ref=([^;]+)/);
    if (match) setReferredBy(match[1]);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerSupabase(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="auth-left" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80')" }}>
        <div className="auth-overlay">
          <h2>Join the Community.</h2>
          <p>Get exclusive access to members-only drops, free shipping on big orders, and more.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <Link href="/" className="text-muted text-decoration-none mb-3 d-inline-block" style={{fontSize: ".9rem"}}>
            <i className="bi bi-arrow-left"></i> Back to Home
          </Link>
          <Link href="/" className="brand">
            <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart" />
            <div className="name">Sw<span>cart</span></div>
          </Link>
          
          <h1>Create an account</h1>
          <p className="subtitle">Join Swcart to start shopping.</p>

          {/* Referral Banner */}
          {referredBy && (
            <div style={{
              background: "linear-gradient(135deg, #fff7ed, #fff3e0)",
              border: "1px solid #f59e0b40",
              borderLeft: "4px solid #f59e0b",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "1.3rem" }}>🎉</span>
              <div>
                <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.9rem" }}>
                  You were invited by a friend!
                </div>
                <div style={{ color: "#a16207", fontSize: "0.78rem", marginTop: "2px" }}>
                  Sign up now — your friend earns ₹100 when you place your first order.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: "#fff3f3",
              border: "1px solid #ffcdd2",
              borderLeft: "4px solid #e63946",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              color: "#c62828",
              fontSize: "0.9rem",
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="John Doe" required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="name@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Create a strong password" required />
            </div>
            
            <button type="submit" className="btn-submit" disabled={isPending}>
              {isPending ? (
                <span style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"}}>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Creating account...
                </span>
              ) : "Sign Up"}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
