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
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 90, damping: 15 } }
  };

  return (
    <section className="hero position-relative overflow-hidden" style={{ minHeight: "85vh", background: "radial-gradient(circle at 70% 30%, #2D1A10 0%, #120A06 100%)", display: "flex", alignItems: "center" }}>
      {/* Decorative Glow */}
      <div className="position-absolute end-0 top-0 opacity-30 d-none d-lg-block" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, #E8472A 0%, transparent 70%)", filter: "blur(90px)", transform: "translate(20%, -20%)" }}></div>
      <div className="position-absolute start-0 bottom-0 opacity-10" style={{ width: "300px", height: "300px", background: "radial-gradient(circle, #FF8A3D 0%, transparent 70%)", filter: "blur(60px)" }}></div>

      <div className="container position-relative z-index-1">
        <div className="row align-items-center g-5">
          <motion.div 
            className="col-lg-6 py-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Elegant pill indicator */}
            <motion.div variants={itemVariants} className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="badge bg-danger rounded-pill" style={{ fontSize: "0.65rem", padding: "4px 8px" }}>NEW</span>
              <span className="text-light small fw-semibold text-uppercase" style={{ letterSpacing: "1.5px", fontSize: "0.7rem", color: "#E0D5CE" }}>Unified Global Commerce</span>
            </motion.div>
            
            {/* Main Premium Heading */}
            <motion.h1 variants={itemVariants} className="display-4 fw-extrabold text-white mb-4" style={{ lineHeight: "1.15", letterSpacing: "-1.5px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              The Next Era of <br/>
              <span className="text-danger" style={{ background: "linear-gradient(to right, #FFF 20%, #FF8A3D 60%, #E8472A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Global Shopping.</span>
            </motion.h1>
            
            {/* Refined Subtitle */}
            <motion.p variants={itemVariants} className="lead text-light opacity-75 mb-5 fs-5" style={{ maxWidth: "520px", lineHeight: "1.6", fontWeight: "400" }}>
              Connect with verified vendors worldwide. Discover premium electronics, designer apparel, home essentials, and digital assets—all in one secure cart.
            </motion.p>
            
            {/* Call To Actions */}
            <motion.div variants={itemVariants} className="d-flex flex-wrap gap-3">
              <Link href="#shop" className="btn btn-danger btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg transition-all hover-lift" style={{ letterSpacing: "0.5px" }}>
                Explore Platform
              </Link>
              <Link href="/sell" className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold transition-all hover-lift" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
                Start Selling
              </Link>
            </motion.div>
            
            {/* Quick Metrics */}
            <motion.div variants={itemVariants} className="mt-5 pt-4 d-flex align-items-center gap-5 border-top border-light border-opacity-10">
              <div>
                <h4 className="text-white fw-bold mb-0">1.2M+</h4>
                <span className="text-muted small text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Active Customers</span>
              </div>
              <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.1)" }}></div>
              <div>
                <h4 className="text-white fw-bold mb-0">60K+</h4>
                <span className="text-muted small text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Global Brands</span>
              </div>
              <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.1)" }}></div>
              <div>
                <h4 className="text-white fw-bold mb-0">100%</h4>
                <span className="text-muted small text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Payment Protection</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Visual Column */}
          <motion.div 
            className="col-lg-6 d-none d-lg-block position-relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="position-relative d-flex justify-content-center align-items-center" style={{ height: "550px" }}>
              {/* Main Product Card */}
              <motion.div 
                animate={{ y: [0, -12, 0] }} 
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="position-absolute shadow-lg rounded-4 overflow-hidden border border-light border-opacity-10" 
                style={{ width: "65%", zIndex: 3, top: "10%", right: "5%", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}
              >
                <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop" alt="Premium Audio" className="img-fluid w-100" style={{ objectFit: "cover" }} />
                </div>
                <div className="p-4 bg-dark bg-opacity-70 text-white border-top border-light border-opacity-10">
                  <span className="badge bg-danger rounded-pill mb-2 fw-bold" style={{ fontSize: "0.6rem" }}>POPULAR</span>
                  <div className="fw-bold fs-5 font-family-poppins">Wireless Headphones</div>
                  <div className="text-danger fw-extrabold fs-6 mt-1">₹24,999</div>
                </div>
              </motion.div>
              
              {/* Secondary Floating Card */}
              <motion.div 
                animate={{ y: [0, 12, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                className="position-absolute shadow-lg rounded-4 overflow-hidden border border-light border-opacity-10" 
                style={{ width: "50%", zIndex: 2, bottom: "10%", left: "5%", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}
              >
                <div style={{ aspectRatio: "1/1", overflow: "hidden" }}>
                  <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop" alt="Smart Wearable" className="img-fluid w-100" style={{ objectFit: "cover" }} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <style>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(232, 71, 42, 0.25) !important;
        }
      `}</style>
    </section>
  );
}
