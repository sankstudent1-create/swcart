import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
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

          <form action={loginAction}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="name@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required />
            </div>
            
            <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
            
            <button type="submit" className="btn-submit">Sign In</button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link href="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </>
  );
}
