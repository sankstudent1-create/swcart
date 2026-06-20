"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.55rem 1.5rem",
        background: "linear-gradient(135deg, #e63946, #c1121f)",
        color: "#fff",
        border: "none",
        borderRadius: "2rem",
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(230,57,70,0.35)",
        letterSpacing: "0.3px",
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
