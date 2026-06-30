"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface MarkCompleteButtonProps {
  lessonId: string;
  isCompleted: boolean;
}

export default function MarkCompleteButton({ lessonId, isCompleted }: MarkCompleteButtonProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);

  const markComplete = async () => {
    if (completed || loading) return;
    setLoading(true);

    try {
      await fetch("/api/lesson-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: true }),
      });
      setCompleted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <button className="btn btn-success" disabled style={{ borderRadius: 12, display: "flex", alignItems: "center", gap: 6, margin: "0 auto", padding: "10px 20px" }}>
        <CheckCircle size={18} />
        Completed
      </button>
    );
  }

  return (
    <button 
      onClick={markComplete} 
      disabled={loading}
      className="btn btn-outline-success" 
      style={{ borderRadius: 12, display: "flex", alignItems: "center", gap: 6, margin: "0 auto", padding: "10px 20px" }}
    >
      {loading ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle size={18} />}
      Mark as Complete
    </button>
  );
}
