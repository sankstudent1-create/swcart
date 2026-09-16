"use client";

import Link from "next/link";
import { loginSupabase } from "../../actions/authSupabase";
import { useState, useTransition } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginSupabase(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="auth-left" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80')" }}>
        <div className="auth-left-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80')" }}></div>
        <div className="auth-overlay">
          <h2>Welcome Back.</h2>
          <p>Discover the latest trends in fashion, electronics, and home essentials. Shop smarter with Swcart.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          <Link href="/" className="btn-back fade-up-element">
            <i className="bi bi-arrow-left"></i> Back to Home
          </Link>
          <Link href="/" className="brand fade-up-element delay-1">
            <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart" />
            <div className="name">Sw<span>cart</span></div>
          </Link>
          
          <div className="fade-up-element delay-1">
            <h1>Log In</h1>
            <p className="subtitle">Enter your details to access your account.</p>
          </div>

          {error && (
            <div className="fade-up-element" style={{
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

          <form onSubmit={handleSubmit} className="fade-up-element delay-2">
            <div className="form-group">
              <input type="email" name="email" id="email" placeholder=" " required />
              <label htmlFor="email">Email Address</label>
            </div>
            <div className="form-group">
              <input type="password" name="password" id="password" placeholder=" " required />
              <label htmlFor="password">Password</label>
            </div>
            
            <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
            
            <button type="submit" className="btn-submit" disabled={isPending}>
              {isPending ? (
                <span style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"}}>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>
          
          <div className="auth-footer fade-up-element delay-3">
            Don&apos;t have an account? <Link href="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </>
  );
}
