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
      <div className="auth-left">
        <div className="auth-overlay">
          <h2>Welcome Back.</h2>
          <p>Discover the latest trends in fashion, electronics, and home essentials. Shop smarter with Swcart.</p>
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
          
          <h1>Log In</h1>
          <p className="subtitle">Enter your details to access your account.</p>

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
              <label>Email Address</label>
              <input type="email" name="email" placeholder="name@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required />
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
          
          <div className="auth-footer">
            Don&apos;t have an account? <Link href="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </>
  );
}
