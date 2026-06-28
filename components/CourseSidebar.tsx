"use client";

import Link from "next/link";
import { CheckCircle, Circle, Lock, ChevronDown, ChevronRight, PlayCircle, FileText, HelpCircle } from "lucide-react";
import { useState } from "react";

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isFree: boolean;
  completed: boolean;
  watchedSecs: number;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseSidebarProps {
  productId: string;
  chapters: Chapter[];
  currentLessonId?: string;
  enrolled: boolean;
  totalCompleted: number;
  totalLessons: number;
}

const ICONS: Record<string, React.ReactNode> = {
  VIDEO: <PlayCircle size={14} />,
  PDF: <FileText size={14} />,
  QUIZ: <HelpCircle size={14} />,
  TEXT: <FileText size={14} />,
};

const fmt = (s: number) => {
  if (!s) return "";
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m` : `${s}s`;
};

export default function CourseSidebar({
  productId,
  chapters,
  currentLessonId,
  enrolled,
  totalCompleted,
  totalLessons,
}: CourseSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans',system-ui",
        position: "sticky",
        top: 80,
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
      }}
    >
      {/* Overall progress */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.8rem" }}>
          <span style={{ fontWeight: 700, color: "#1a1a2e" }}>Course Progress</span>
          <span style={{ fontWeight: 800, color: pct === 100 ? "#2a9d8f" : "#e63946" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: pct === 100 ? "#2a9d8f" : "linear-gradient(90deg,#e63946,#c1121f)",
              borderRadius: 4,
              transition: "width 0.4s",
            }}
          />
        </div>
        <p style={{ fontSize: "0.72rem", color: "#888", marginTop: 5 }}>
          {totalCompleted} of {totalLessons} lessons
        </p>
      </div>

      {/* Chapters */}
      {chapters.map((chapter, ci) => {
        const chapterCompleted = chapter.lessons.filter((l) => l.completed).length;
        const isOpen = !collapsed[chapter.id];

        return (
          <div key={chapter.id} style={{ borderBottom: "1px solid #f8f8f8" }}>
            {/* Chapter header */}
            <button
              onClick={() => toggle(chapter.id)}
              style={{
                width: "100%",
                padding: "12px 18px",
                background: "#fafafa",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textAlign: "left",
              }}
            >
              {isOpen ? <ChevronDown size={15} color="#888" /> : <ChevronRight size={15} color="#888" />}
              <span style={{ fontWeight: 700, fontSize: "0.82rem", flex: 1, color: "#1a1a2e" }}>
                {ci + 1}. {chapter.title}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#888", flexShrink: 0 }}>
                {chapterCompleted}/{chapter.lessons.length}
              </span>
            </button>

            {/* Lessons */}
            {isOpen && (
              <div>
                {chapter.lessons.map((lesson, li) => {
                  const isActive = lesson.id === currentLessonId;
                  const canAccess = enrolled || lesson.isFree;

                  return (
                    <Link
                      key={lesson.id}
                      href={
                        canAccess
                          ? `/course/${productId}/lesson/${lesson.id}`
                          : `/course/${productId}`
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 18px 9px 28px",
                        background: isActive ? "rgba(230,57,70,0.06)" : "transparent",
                        borderLeft: isActive ? "3px solid #e63946" : "3px solid transparent",
                        textDecoration: "none",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Completion icon */}
                      {lesson.completed ? (
                        <CheckCircle size={14} color="#2a9d8f" />
                      ) : canAccess ? (
                        <span style={{ color: "#ddd" }}>{ICONS[lesson.type] || <Circle size={14} />}</span>
                      ) : (
                        <Lock size={12} color="#bbb" />
                      )}

                      {/* Lesson title */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: "0.8rem",
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#e63946" : canAccess ? "#333" : "#bbb",
                          lineHeight: 1.3,
                        }}
                      >
                        {lesson.title}
                        {lesson.isFree && !enrolled && (
                          <span
                            style={{
                              marginLeft: 5,
                              fontSize: "0.62rem",
                              background: "#e9f7f6",
                              color: "#2a9d8f",
                              borderRadius: 4,
                              padding: "1px 5px",
                              fontWeight: 700,
                            }}
                          >
                            FREE
                          </span>
                        )}
                      </span>

                      {/* Duration */}
                      {lesson.duration && (
                        <span style={{ fontSize: "0.68rem", color: "#bbb", flexShrink: 0 }}>
                          {fmt(lesson.duration)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
