import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <Link href="/" className="brand" style={{display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "30px"}}>
          <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart" style={{height: "46px", width: "46px", borderRadius: "12px"}} />
          <div className="name" style={{fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "var(--ink)", lineHeight: 1}}>Sw<span style={{color: "var(--red)"}}>cart</span></div>
        </Link>
        
        <h1>Reset Password</h1>
        <p>Enter your email to receive a reset link.</p>

        <form action="/login">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="name@example.com" required />
          </div>
          
          <button type="submit" className="btn-submit" style={{backgroundColor: "var(--red)"}}>Send Reset Link</button>
        </form>
        
        <div className="auth-footer">
          Remember your password? <Link href="/login" style={{color: "var(--red)", fontWeight: 600}}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
