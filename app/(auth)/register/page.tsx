import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
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

          <form action={registerAction}>
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
            
            <button type="submit" className="btn-submit">Sign Up</button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
