"use client";

export default function PrintButton() {
  return (
    <button 
      className="btn text-white rounded-pill fw-bold shadow-sm px-4" 
      style={{ backgroundColor: "var(--red)" }} 
      onClick={() => window.print()}
    >
      <i className="bi bi-printer me-2"></i> Print Invoice
    </button>
  );
}
