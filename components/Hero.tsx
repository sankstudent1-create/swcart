"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="hero position-relative overflow-hidden" style={{ minHeight: "85vh", background: "linear-gradient(135deg, #1A1410 0%, #2A1F18 100%)", display: "flex", alignItems: "center" }}>
      {/* Abstract Background Shapes */}
      <div className="position-absolute top-0 end-0 p-5 opacity-25" style={{ transform: "translate(20%, -20%)" }}>
        <div style={{ width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, var(--red) 0%, transparent 70%)", filter: "blur(80px)" }}></div>
      </div>
      
      <div className="container position-relative z-index-1">
        <div className="row align-items-center g-5">
          <motion.div 
            className="col-lg-6 py-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="badge bg-danger rounded-pill">NEW</span>
              <span className="text-light small fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Global Shipping Now Live</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="display-3 fw-bolder text-white mb-4" style={{ lineHeight: "1.1", letterSpacing: "-1px" }}>
              The Everything <br/>
              <span className="text-danger" style={{ textShadow: "0 0 30px rgba(232,71,42,0.4)" }}>Marketplace.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="lead text-light opacity-75 mb-5 fs-5" style={{ maxWidth: "500px" }}>
              Millions of products from verified sellers worldwide. Electronics, fashion, home, and digital assets—all in one seamless cart.
            </motion.p>
            
            <motion.div variants={itemVariants} className="d-flex flex-wrap gap-3">
              <Link href="#shop" className="btn btn-danger btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg transition-all hover-lift">
                Explore Products
              </Link>
              <Link href="/sell" className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold transition-all hover-lift">
                Become a Seller
              </Link>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-5 pt-3 d-flex align-items-center gap-4 border-top border-light border-opacity-10">
              <div>
                <h3 className="text-white fw-bold mb-0">1M+</h3>
                <span className="text-muted small text-uppercase">Active Users</span>
              </div>
              <div>
                <h3 className="text-white fw-bold mb-0">50K+</h3>
                <span className="text-muted small text-uppercase">Verified Sellers</span>
              </div>
              <div>
                <h3 className="text-white fw-bold mb-0">100%</h3>
                <span className="text-muted small text-uppercase">Secure Escrow</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="col-lg-6 d-none d-lg-block position-relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          >
            <div className="position-relative" style={{ height: "600px", perspective: "1000px" }}>
              <motion.div 
                animate={{ y: [0, -20, 0] }} 
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="position-absolute shadow-lg rounded-4 overflow-hidden" 
                style={{ top: "10%", right: "10%", width: "70%", border: "1px solid rgba(255,255,255,0.1)", zIndex: 3 }}
              >
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop" alt="Premium Headphones" className="img-fluid w-100" />
                <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                  <div className="text-white fw-bold">Sony WH-1000XM5</div>
                  <div className="text-danger fw-bolder">$348.00</div>
                </div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 20, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="position-absolute shadow-lg rounded-4 overflow-hidden" 
                style={{ bottom: "10%", left: "0", width: "60%", border: "1px solid rgba(255,255,255,0.1)", zIndex: 2 }}
              >
                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" alt="Smart Watch" className="img-fluid w-100" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </section>
  );
}
