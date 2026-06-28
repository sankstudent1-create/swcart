"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Trophy } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explain?: string | null;
}

interface QuizPlayerProps {
  lessonId: string;
  questions: Question[];
  onComplete?: (score: number) => void;
}

export default function QuizPlayer({ lessonId, questions, onComplete }: QuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(0);

  const totalQ = questions.length;
  const answered = Object.keys(answers).length;

  const submit = async () => {
    if (answered < totalQ) return;
    setSaving(true);

    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    const score = Math.round((correct / totalQ) * 100);

    await fetch("/api/lesson-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed: true, quizScore: score }),
    }).catch(() => {});

    setSubmitted(true);
    setSaving(false);
    onComplete?.(score);
  };

  if (questions.length === 0) {
    return (
      <div className="alert alert-warning">
        <AlertCircle size={16} className="me-2" />
        No quiz questions found.
      </div>
    );
  }

  // Results screen
  if (submitted) {
    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    const score = Math.round((correct / totalQ) * 100);
    const passed = score >= 60;

    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 24px",
          background: passed
            ? "linear-gradient(135deg,#d4edda,#c3e6cb)"
            : "linear-gradient(135deg,#f8d7da,#f5c6cb)",
          borderRadius: 20,
          fontFamily: "'Plus Jakarta Sans',system-ui",
        }}
      >
        <Trophy size={56} color={passed ? "#2a9d8f" : "#e63946"} className="mb-3" />
        <h3 className="fw-black mb-1">{score}%</h3>
        <p className="fw-bold mb-1" style={{ color: passed ? "#155724" : "#721c24" }}>
          {passed ? "🎉 Passed!" : "😞 Needs improvement"}
        </p>
        <p className="text-muted small mb-4">
          {correct} out of {totalQ} correct
        </p>

        {/* Answer review */}
        <div style={{ textAlign: "left" }}>
          {questions.map((q, i) => {
            const userAns = answers[i];
            const isCorrect = userAns === q.answer;
            return (
              <div
                key={q.id}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 10,
                  borderLeft: `4px solid ${isCorrect ? "#2a9d8f" : "#e63946"}`,
                }}
              >
                <p className="fw-bold mb-2 small">{q.question}</p>
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: "0.82rem",
                      background:
                        oi === q.answer
                          ? "rgba(42,157,143,0.15)"
                          : oi === userAns && !isCorrect
                          ? "rgba(230,57,70,0.12)"
                          : "transparent",
                      color:
                        oi === q.answer
                          ? "#155724"
                          : oi === userAns && !isCorrect
                          ? "#721c24"
                          : "#333",
                      fontWeight: oi === q.answer ? 700 : 400,
                    }}
                  >
                    {oi === q.answer && <CheckCircle size={12} className="me-1" />}
                    {oi === userAns && !isCorrect && <XCircle size={12} className="me-1" />}
                    {opt}
                  </div>
                ))}
                {q.explain && (
                  <p
                    style={{
                      fontSize: "0.76rem",
                      color: "#555",
                      marginTop: 6,
                      fontStyle: "italic",
                    }}
                  >
                    💡 {q.explain}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: 600 }}>
          Question {current + 1} of {totalQ}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {questions.map((_, i) => (
            <div
              key={i}
              style={{
                width: 28, height: 5, borderRadius: 4,
                background:
                  i in answers
                    ? "#e63946"
                    : i === current
                    ? "#dee2e6"
                    : "#f0f0f0",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          marginBottom: 16,
        }}
      >
        <h5 style={{ fontWeight: 800, marginBottom: 20, color: "#1a1a2e", lineHeight: 1.4 }}>
          {q.question}
        </h5>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, oi) => {
            const selected = answers[current] === oi;
            return (
              <button
                key={oi}
                onClick={() => setAnswers((prev) => ({ ...prev, [current]: oi }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: selected ? "2px solid #e63946" : "2px solid #e9ecef",
                  background: selected ? "rgba(230,57,70,0.06)" : "#fafafa",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: selected ? 700 : 400,
                  color: selected ? "#e63946" : "#333",
                  transition: "all 0.15s",
                  fontSize: "0.88rem",
                }}
              >
                <span
                  style={{
                    width: 26, height: 26, borderRadius: "50%",
                    border: selected ? "2px solid #e63946" : "2px solid #dee2e6",
                    background: selected ? "#e63946" : "transparent",
                    color: selected ? "#fff" : "#888",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: 800, flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn btn-outline-secondary"
          style={{ borderRadius: 10 }}
        >
          Previous
        </button>

        {current < totalQ - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="btn btn-danger"
            style={{ borderRadius: 10 }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={answered < totalQ || saving}
            className="btn btn-danger"
            style={{ borderRadius: 10, fontWeight: 700 }}
          >
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
            ) : (
              `Submit Quiz (${answered}/${totalQ})`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
