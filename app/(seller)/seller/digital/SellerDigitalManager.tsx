"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Lesson { id: string; title: string; order: number; type: string; isFree: boolean; duration: number | null; }
interface Chapter { id: string; title: string; order: number; lessons: Lesson[]; }
interface DigitalAsset { id: string; fileUrl: string; assetType: string; }
interface Product {
  id: string; title: string; basePrice: number; productType: string;
  isPublished: boolean; createdAt: string;
  digitalAssets: DigitalAsset[];
  courseChapters: Chapter[];
  _count: { courseEnrollments: number };
}
interface Enrollment {
  id: string; userId: string; productId: string; enrolledAt: string;
  user: { name: string; email: string; avatar: string | null };
  product: { id: string; title: string; courseChapters: Array<{ lessons: Array<{ id: string }> }> };
}
interface ProgressRecord {
  id: string; userId: string; completed: boolean; watchedSecs: number;
  lesson: { id: string; chapter: { productId: string }; };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},55%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 800, flexShrink: 0 }}>{name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</div>;
}

// ─── Progress Ring ──────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 40, color = "#10b981" }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.4s ease" }} />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function SellerDigitalManager({ products, enrollments, progressRecords, sellerId, sellerName }: {
  products: Product[]; enrollments: Enrollment[]; progressRecords: ProgressRecord[];
  sellerId: string; sellerName: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"products" | "consumers">("products");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startT] = useTransition();

  // Build a user-progress map: { userId_productId: { completed, total } }
  const progressMap: Record<string, { completed: number; total: number; watchedSecs: number }> = {};
  enrollments.forEach(e => {
    const totalLessons = e.product.courseChapters.flatMap(c => c.lessons).length;
    const key = `${e.userId}_${e.productId}`;
    const userProgress = progressRecords.filter(p => p.userId === e.userId && p.lesson.chapter.productId === e.productId);
    const completed = userProgress.filter(p => p.completed).length;
    const watchedSecs = userProgress.reduce((a, b) => a + (b.watchedSecs ?? 0), 0);
    progressMap[key] = { completed, total: totalLessons, watchedSecs };
  });

  // Stats for a specific product
  const getProductEnrollments = (productId: string) =>
    enrollments.filter(e => e.productId === productId);

  const totalEnrolled = enrollments.length;
  const totalRevenue = products.reduce((a, p) => a + (p.basePrice * p._count.courseEnrollments), 0);
  const avgCompletion = enrollments.length === 0 ? 0 :
    Math.round(enrollments.reduce((a, e) => {
      const pm = progressMap[`${e.userId}_${e.productId}`];
      return a + (pm && pm.total > 0 ? (pm.completed / pm.total) * 100 : 0);
    }, 0) / enrollments.length);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .dg-tab { transition: all 0.15s; border: none; background: none; cursor: pointer; }
        .dg-card { transition: all 0.18s; }
        .dg-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08) !important; }
        .dg-pill { transition: all 0.15s; cursor: pointer; }
        .dg-pill:hover { opacity: 0.85; }
        .dg-table tr { transition: background 0.12s; }
        .dg-table tr:hover { background: #f8f9fb; }
        .dg-scrollbar::-webkit-scrollbar { width: 4px; }
        .dg-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 900, margin: 0, fontSize: "1.4rem", color: "#fff" }}>Digital Products</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>Manage your courses, eBooks, and track how learners consume your content.</p>
        </div>
        <button onClick={() => router.push("/seller/digital/studio")} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: "0.83rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="bi bi-plus-lg" /> Create Digital Product
        </button>
      </div>

      {/* Overview stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Digital Products", value: products.length, icon: "bi-collection-play", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
          { label: "Total Enrolled", value: totalEnrolled, icon: "bi-people", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
          { label: "Est. Revenue", value: fmt(totalRevenue), icon: "bi-currency-rupee", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
          { label: "Avg Completion", value: `${avgCompletion}%`, icon: "bi-graph-up-arrow", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px 18px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: "1.1rem" }} />
              </div>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[
          { key: "products", label: "My Digital Products", icon: "bi-collection-play" },
          { key: "consumers", label: "Learner Analytics", icon: "bi-bar-chart-line" }
        ].map(t => (
          <button key={t.key} className="dg-tab" onClick={() => setTab(t.key as any)}
            style={{ padding: "8px 18px", borderRadius: 9, fontWeight: 700, fontSize: "0.83rem", color: tab === t.key ? "#fff" : "rgba(255,255,255,0.4)", background: tab === t.key ? "linear-gradient(135deg,#ef4444,#dc2626)" : "none" }}>
            <i className={`bi ${t.icon} me-2`} />{t.label}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {tab === "products" && (
        <div>
          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "2px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="bi bi-collection-play" style={{ fontSize: "1.8rem", color: "#8b5cf6" }} />
              </div>
              <h5 style={{ fontWeight: 800, color: "#fff", marginBottom: 6 }}>No digital products yet</h5>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 20 }}>
                Create your first video course or eBook using the Digital Studio.
              </p>
              <button onClick={() => router.push("/seller/digital/studio")} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                <i className="bi bi-plus-lg me-2" />Open Digital Studio
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {products.map(p => {
                const totalLessons = p.courseChapters.reduce((a, c) => a + c.lessons.length, 0);
                const isCourse = p.courseChapters.length > 0;
                const enrolled = p._count.courseEnrollments;
                const lastEnrolled = getProductEnrollments(p.id)[0];
                return (
                  <div key={p.id} className="dg-card" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    {/* Type bar */}
                    <div style={{ height: 4, background: isCourse ? "linear-gradient(90deg,#8b5cf6,#6d28d9)" : "linear-gradient(90deg,#ef4444,#dc2626)" }} />
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h6 style={{ fontWeight: 800, color: "#fff", margin: 0, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</h6>
                          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{fmt(p.basePrice)} · {timeAgo(p.createdAt)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          <button onClick={() => router.push(`/seller/digital/studio?id=${p.id}`)} style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer" }}>
                            <i className="bi bi-pencil-fill me-1"/> Edit
                          </button>
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: isCourse ? "rgba(139,92,246,0.2)" : "rgba(239,68,68,0.2)", color: isCourse ? "#a78bfa" : "#fca5a5" }}>
                            {isCourse ? "COURSE" : "EBOOK"}
                          </span>
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: p.isPublished ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)", color: p.isPublished ? "#6ee7b7" : "#9ca3af" }}>
                            {p.isPublished ? "LIVE" : "DRAFT"}
                          </span>
                        </div>
                      </div>

                      {/* Course structure */}
                      {isCourse && (
                        <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 10, marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                            <span><i className="bi bi-collection me-1" />{p.courseChapters.length} Chapters</span>
                            <span><i className="bi bi-play-circle me-1" />{totalLessons} Lessons</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {p.courseChapters.slice(0, 3).map((ch, ci) => (
                              <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: "#a78bfa", flexShrink: 0 }}>{ci + 1}</span>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</span>
                                <span style={{ marginLeft: "auto", flexShrink: 0, color: "rgba(255,255,255,0.25)" }}>{ch.lessons.length}L</span>
                              </div>
                            ))}
                            {p.courseChapters.length > 3 && <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", paddingLeft: 24 }}>+{p.courseChapters.length - 3} more chapters</div>}
                          </div>
                        </div>
                      )}

                      {/* eBook assets */}
                      {!isCourse && p.digitalAssets.length > 0 && (
                        <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 10, marginBottom: 12 }}>
                          {p.digitalAssets.map(a => (
                            <div key={a.id} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 6 }}>
                              <i className="bi bi-file-earmark-pdf" style={{ color: "#ef4444" }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.assetType} — {a.fileUrl.split("/").pop()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Enrollment stat */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ display: "flex", gap: -4 }}>
                            {getProductEnrollments(p.id).slice(0, 4).map((e, ei) => (
                              <div key={ei} style={{ marginLeft: ei > 0 ? -8 : 0, border: "2px solid rgba(255,255,255,0.1)", borderRadius: "50%", overflow: "hidden" }}>
                                <Avatar name={e.user.name} size={22} />
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                            {enrolled} enrolled
                          </span>
                        </div>
                        <button onClick={() => { setSelectedProduct(p); setTab("consumers"); }}
                          style={{ padding: "5px 12px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                          <i className="bi bi-bar-chart me-1" />Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONSUMERS / LEARNER ANALYTICS TAB ── */}
      {tab === "consumers" && (
        <div>
          {/* Product filter */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 18, scrollbarWidth: "none" }}>
            <button className="dg-pill" onClick={() => setSelectedProduct(null)}
              style={{ padding: "5px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, background: !selectedProduct ? "linear-gradient(135deg,#ef4444,#dc2626)" : "rgba(255,255,255,0.08)", color: "#fff", border: "none", whiteSpace: "nowrap" }}>
              All Products
            </button>
            {products.map(p => (
              <button key={p.id} className="dg-pill" onClick={() => setSelectedProduct(p)}
                style={{ padding: "5px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, background: selectedProduct?.id === p.id ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "rgba(255,255,255,0.08)", color: "#fff", border: "none", whiteSpace: "nowrap" }}>
                {p.title.length > 24 ? p.title.slice(0, 22) + "…" : p.title}
              </button>
            ))}
          </div>

          {/* If a product is selected — show detailed per-user progress */}
          {selectedProduct ? (
            <div>
              <div style={{ marginBottom: 16, padding: "14px 18px", background: "rgba(139,92,246,0.1)", borderRadius: 14, border: "1.5px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
                <i className="bi bi-collection-play" style={{ fontSize: "1.5rem", color: "#a78bfa" }} />
                <div>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{selectedProduct.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                    {selectedProduct.courseChapters.length} chapters · {selectedProduct.courseChapters.reduce((a, c) => a + c.lessons.length, 0)} lessons · {selectedProduct._count.courseEnrollments} enrolled
                  </div>
                </div>
              </div>

              {/* Chapter structure summary */}
              {selectedProduct.courseChapters.length > 0 && (
                <div style={{ marginBottom: 18, padding: "14px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 10 }}>COURSE STRUCTURE</div>
                  {selectedProduct.courseChapters.map((ch, ci) => {
                    const lessonIds = ch.lessons.map(l => l.id);
                    const completedByAny = progressRecords.filter(p => lessonIds.includes(p.lesson.id) && p.completed).length;
                    const totalCompletions = lessonIds.length * getProductEnrollments(selectedProduct.id).length;
                    const chPct = totalCompletions > 0 ? Math.round((completedByAny / totalCompletions) * 100) : 0;
                    return (
                      <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: ci < selectedProduct.courseChapters.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 800, color: "#a78bfa", flexShrink: 0 }}>{ci + 1}</span>
                        <span style={{ flex: 1, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</span>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{ch.lessons.length}L</span>
                        <div style={{ width: 80, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${chPct}%`, height: "100%", background: chPct > 66 ? "#10b981" : chPct > 33 ? "#f59e0b" : "#ef4444", borderRadius: 99, transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", width: 32, textAlign: "right" }}>{chPct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Per-learner table */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Learner Progress</span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>{getProductEnrollments(selectedProduct.id).length} learners</span>
                </div>
                <div className="dg-scrollbar" style={{ overflowY: "auto", maxHeight: 440 }}>
                  <table className="dg-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.15)" }}>
                        {["Learner", "Enrolled", "Progress", "Lessons Done", "Watch Time", "Status"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getProductEnrollments(selectedProduct.id).map(e => {
                        const pm = progressMap[`${e.userId}_${e.productId}`] ?? { completed: 0, total: 0, watchedSecs: 0 };
                        const pct = pm.total > 0 ? Math.round((pm.completed / pm.total) * 100) : 0;
                        const statusColor = pct === 100 ? "#10b981" : pct > 50 ? "#f59e0b" : "#ef4444";
                        const statusLabel = pct === 100 ? "Completed" : pct > 50 ? "In Progress" : pct > 0 ? "Started" : "Not Started";
                        const hrs = Math.floor(pm.watchedSecs / 3600);
                        const mins = Math.floor((pm.watchedSecs % 3600) / 60);
                        return (
                          <tr key={e.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Avatar name={e.user.name} size={28} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#fff" }}>{e.user.name}</div>
                                  <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.35)" }}>{e.user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{timeAgo(e.enrolledAt)}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <ProgressRing pct={pct} size={36} color={statusColor} />
                                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#fff" }}>{pct}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{pm.completed}<span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>/{pm.total}</span></div>
                              <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: statusColor, borderRadius: 99 }} />
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                              {pm.watchedSecs > 0 ? `${hrs}h ${mins}m` : "—"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}30` }}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {getProductEnrollments(selectedProduct.id).length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.25)", fontSize: "0.82rem" }}>No enrollments yet for this product.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* All Products — enrollment overview */
            <div>
              {enrollments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "2px dashed rgba(255,255,255,0.1)" }}>
                  <i className="bi bi-people" style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }} />
                  <h5 style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>No learners yet</h5>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Once users purchase your courses, their progress will appear here.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {enrollments.slice(0, 50).map(e => {
                    const pm = progressMap[`${e.userId}_${e.productId}`] ?? { completed: 0, total: 0, watchedSecs: 0 };
                    const pct = pm.total > 0 ? Math.round((pm.completed / pm.total) * 100) : 0;
                    const statusColor = pct === 100 ? "#10b981" : pct > 50 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={e.id} style={{ padding: "14px 18px", background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <Avatar name={e.user.name} size={36} />
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>{e.user.name}</div>
                          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{e.user.email}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Course</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.product.title}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ProgressRing pct={pct} size={40} color={statusColor} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#fff" }}>{pct}%</div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>{pm.completed}/{pm.total} lessons</div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{timeAgo(e.enrolledAt)}</div>
                        <button onClick={() => { setSelectedProduct(products.find(p => p.id === e.productId) ?? null); }}
                          style={{ padding: "5px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
                          Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
