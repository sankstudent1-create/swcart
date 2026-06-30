"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveDigitalProductAction,
  saveCourseChapterAction,
  deleteCourseChapterAction,
  saveCourseLessonAction,
  deleteCourseLessonAction,
  saveDigitalAssetAction,
  deleteDigitalAssetAction
} from "@/app/actions/digital";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Lesson { id: string; title: string; order: number; type: string; isFree: boolean; duration: number | null; videoKey: string | null; pdfKey: string | null; textBody: string | null; quizQuestions?: { question: string; options: string[]; answer: number; explain: string | null }[]; }
interface Chapter { id: string; title: string; order: number; lessons: Lesson[]; }
interface DigitalAsset { id: string; fileUrl: string; assetType: string; }
interface Product { id: string; title: string; description: string; basePrice: number; discountPercent: number; categoryId: string; images: string[]; isPublished: boolean; productType: string; courseChapters: Chapter[]; digitalAssets: DigitalAsset[]; }

// ─── Component ──────────────────────────────────────────────────────────────────
export default function DigitalStudioManager({ categories, product }: { categories: any[]; product: Product | null }) {
  const router = useRouter();
  const [isPending, startT] = useTransition();

  // Local state for Product Details
  const [form, setForm] = useState({
    title: product?.title || "",
    description: product?.description || "",
    basePrice: product?.basePrice || 0,
    discountPercent: product?.discountPercent || 0,
    categoryId: product?.categoryId || (categories[0]?.id || ""),
    images: product?.images?.length ? [...product.images] : [""],
    isPublished: product?.isPublished ?? false,
    productType: (product?.productType as "DIGITAL" | "SERVICE") || "DIGITAL",
  });

  const [activeTab, setActiveTab] = useState<"details" | "curriculum" | "assets">("details");

  const handleSaveProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.title.trim() || !form.categoryId) { toast.error("Title and Category are required"); return; }
    
    startT(async () => {
      const res = await saveDigitalProductAction(product?.id || null, { ...form, images: form.images.filter(i => i.trim()) });
      if (res.success) {
        toast.success(res.message);
        if (!product?.id && res.productId) {
          window.location.href = `/seller/digital/studio?id=${res.productId}`;
        } else {
          router.refresh();
        }
      } else toast.error(res.message);
    });
  };

  // ── Chapter Actions ──
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapTitle, setChapTitle] = useState("");

  const handleSaveChapter = (id: string | null) => {
    if (!product?.id) { toast.error("Save the product first!"); return; }
    if (!chapTitle.trim()) { toast.error("Chapter title required"); return; }
    startT(async () => {
      const order = id ? (product.courseChapters.find(c => c.id === id)?.order || 0) : product.courseChapters.length;
      const res = await saveCourseChapterAction(product.id, id, { title: chapTitle, order });
      if (res.success) { toast.success(res.message); setEditingChapterId(null); setChapTitle(""); router.refresh(); }
      else toast.error(res.message);
    });
  };
  const handleDeleteChapter = (id: string) => {
    if (!confirm("Delete chapter and ALL its lessons?")) return;
    startT(async () => {
      const res = await deleteCourseChapterAction(id);
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  // ── Lesson Actions ──
  const [lessonModal, setLessonModal] = useState<{ chapterId: string, lesson: Lesson | null } | null>(null);
  const [lesForm, setLesForm] = useState({ title: "", type: "VIDEO", isFree: false, url: "", duration: 0, quizQuestions: [] as { question: string; options: string[]; answer: number; explain: string | null }[] });

  const openLessonModal = (chapterId: string, lesson: Lesson | null) => {
    if (lesson) {
      setLesForm({ title: lesson.title, type: lesson.type, isFree: lesson.isFree, duration: lesson.duration || 0, url: lesson.videoKey || lesson.pdfKey || lesson.textBody || "", quizQuestions: lesson.quizQuestions || [] });
    } else {
      setLesForm({ title: "", type: "VIDEO", isFree: false, url: "", duration: 0, quizQuestions: [] });
    }
    setLessonModal({ chapterId, lesson });
  };

  const handleSaveLesson = () => {
    if (!lessonModal) return;
    if (!lesForm.title.trim()) { toast.error("Lesson title required"); return; }
    startT(async () => {
      const chapter = product!.courseChapters.find(c => c.id === lessonModal.chapterId)!;
      const order = lessonModal.lesson ? lessonModal.lesson.order : chapter.lessons.length;
      const data: any = { title: lesForm.title, order, type: lesForm.type, isFree: lesForm.isFree };
      if (lesForm.type === "VIDEO") { data.videoKey = lesForm.url; data.duration = lesForm.duration; }
      if (lesForm.type === "PDF") data.pdfKey = lesForm.url;
      if (lesForm.type === "TEXT") data.textBody = lesForm.url;
      if (lesForm.type === "QUIZ") data.quizQuestions = lesForm.quizQuestions;

      const res = await saveCourseLessonAction(lessonModal.chapterId, lessonModal.lesson?.id || null, data);
      if (res.success) { toast.success(res.message); setLessonModal(null); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const handleDeleteLesson = (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    startT(async () => {
      const res = await deleteCourseLessonAction(id);
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  // ── Asset Actions ──
  const [assetForm, setAssetForm] = useState({ type: "EBOOK", url: "" });
  const handleAddAsset = () => {
    if (!product?.id) { toast.error("Save product first!"); return; }
    if (!assetForm.url.trim()) { toast.error("File URL required"); return; }
    startT(async () => {
      const res = await saveDigitalAssetAction(product.id, null, { fileUrl: assetForm.url, assetType: assetForm.type as any });
      if (res.success) { toast.success(res.message); setAssetForm({ type: "EBOOK", url: "" }); router.refresh(); }
      else toast.error(res.message);
    });
  };
  const handleDeleteAsset = (id: string) => {
    if (!confirm("Delete this asset?")) return;
    startT(async () => {
      const res = await deleteDigitalAssetAction(id);
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .ds-tab { border: none; background: none; color: rgba(255,255,255,0.4); font-weight: 700; font-size: 0.85rem; padding: 10px 20px; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
        .ds-tab.active { color: #ef4444; border-bottom-color: #ef4444; }
        .ds-input { background: rgba(0,0,0,0.2) !important; border: 1.5px solid rgba(255,255,255,0.1) !important; color: #fff !important; }
        .ds-input:focus { border-color: #ef4444 !important; box-shadow: none !important; }
        .ds-chapter { background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
        .ds-chapter-head { padding: 14px 18px; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: space-between; }
        .ds-lesson { padding: 12px 18px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; transition: background 0.1s; }
        .ds-lesson:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => router.push("/seller/digital")} style={{ background: "rgba(255,255,255,0.06)", border: "none", width: 40, height: 40, borderRadius: 10, color: "#fff", cursor: "pointer" }}>
            <i className="bi bi-arrow-left" />
          </button>
          <div>
            <h3 style={{ fontWeight: 800, color: "#fff", margin: 0 }}>{product ? "Edit Digital Product" : "New Digital Product"}</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", margin: "4px 0 0", fontSize: "0.8rem" }}>Configure details, pricing, and curriculum.</p>
          </div>
        </div>
        <button onClick={() => handleSaveProduct()} disabled={isPending} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          {isPending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-cloud-arrow-up-fill" />}
          {product ? "Save Changes" : "Create Product"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1.5px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
        <button className={`ds-tab ${activeTab === "details" ? "active" : ""}`} onClick={() => setActiveTab("details")}>Details & Pricing</button>
        <button className={`ds-tab ${activeTab === "curriculum" ? "active" : ""}`} onClick={() => setActiveTab("curriculum")} disabled={!product}>Course Curriculum {!product && "🔒"}</button>
        <button className={`ds-tab ${activeTab === "assets" ? "active" : ""}`} onClick={() => setActiveTab("assets")} disabled={!product}>eBooks & Downloads {!product && "🔒"}</button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
        
        {/* ── DETAILS TAB ── */}
        {activeTab === "details" && (
          <div className="row g-4">
            <div className="col-md-8">
              <label className="form-label text-muted small fw-bold text-uppercase">Title *</label>
              <input type="text" className="form-control ds-input rounded-3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Master React in 30 Days" />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Type</label>
              <select className="form-select ds-input rounded-3" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value as any })}>
                <option value="DIGITAL">Digital (Course/eBook)</option>
                <option value="SERVICE">Service (Consulting)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted small fw-bold text-uppercase">Category *</label>
              <select className="form-select ds-input rounded-3" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold text-uppercase">Base Price (₹) *</label>
              <input type="number" className="form-control ds-input rounded-3" value={form.basePrice || ""} onChange={e => setForm({ ...form, basePrice: Number(e.target.value) })} />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold text-uppercase">Discount %</label>
              <input type="number" className="form-control ds-input rounded-3" value={form.discountPercent || ""} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })} />
            </div>
            <div className="col-12">
              <label className="form-label text-muted small fw-bold text-uppercase">Description *</label>
              <textarea className="form-control ds-input rounded-3" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will they learn?" />
            </div>
            <div className="col-12">
              <label className="form-label text-muted small fw-bold text-uppercase mb-2 d-block">Cover Image URLs</label>
              {form.images.map((img, i) => (
                <div key={i} className="d-flex gap-2 mb-2">
                  <input type="url" className="form-control ds-input rounded-3" placeholder="https://..." value={img} onChange={e => { const a = [...form.images]; a[i] = e.target.value; setForm({ ...form, images: a }); }} />
                  <button className="btn btn-outline-danger" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} disabled={form.images.length === 1}><i className="bi bi-trash" /></button>
                </div>
              ))}
              <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => setForm({ ...form, images: [...form.images, ""] })}>+ Add Image URL</button>
            </div>
            <div className="col-12 mt-4 pt-3 border-top border-secondary border-opacity-25">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="publishToggle" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                <label className="form-check-label text-white fw-bold ms-2" htmlFor="publishToggle">Publish this product to the storefront</label>
              </div>
            </div>
          </div>
        )}

        {/* ── CURRICULUM TAB ── */}
        {activeTab === "curriculum" && product && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.85rem" }}>Organize your course into chapters and video/text lessons.</p>
              <button onClick={() => { setEditingChapterId("new"); setChapTitle(""); }} style={{ padding: "7px 16px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#a78bfa", fontWeight: 700, fontSize: "0.8rem" }}>
                + Add Chapter
              </button>
            </div>

            {/* New Chapter Inline Form */}
            {editingChapterId === "new" && (
              <div className="ds-chapter" style={{ padding: "16px 18px", background: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" className="form-control ds-input flex-grow-1" placeholder="Chapter Title (e.g. Introduction)" value={chapTitle} onChange={e => setChapTitle(e.target.value)} autoFocus />
                  <button onClick={() => handleSaveChapter(null)} className="btn btn-primary fw-bold" disabled={isPending}>Save</button>
                  <button onClick={() => setEditingChapterId(null)} className="btn btn-outline-light">Cancel</button>
                </div>
              </div>
            )}

            {product.courseChapters.length === 0 && editingChapterId !== "new" && (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontSize: "0.85rem" }}>No chapters created yet. Start building your curriculum.</div>
            )}

            {product.courseChapters.map((ch, ci) => (
              <div key={ch.id} className="ds-chapter">
                <div className="ds-chapter-head">
                  {editingChapterId === ch.id ? (
                    <div style={{ display: "flex", gap: 10, width: "100%" }}>
                      <input type="text" className="form-control ds-input flex-grow-1 form-control-sm" value={chapTitle} onChange={e => setChapTitle(e.target.value)} />
                      <button onClick={() => handleSaveChapter(ch.id)} className="btn btn-sm btn-primary" disabled={isPending}>Save</button>
                      <button onClick={() => setEditingChapterId(null)} className="btn btn-sm btn-outline-light">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#fff" }}>{ci + 1}</span>
                        <h6 style={{ margin: 0, fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{ch.title}</h6>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>({ch.lessons.length} lessons)</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openLessonModal(ch.id, null)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>+ Lesson</button>
                        <button onClick={() => { setEditingChapterId(ch.id); setChapTitle(ch.title); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><i className="bi bi-pencil" /></button>
                        <button onClick={() => handleDeleteChapter(ch.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }} disabled={isPending}><i className="bi bi-trash" /></button>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {ch.lessons.map((l, li) => (
                    <div key={l.id} className="ds-lesson">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <i className={`bi ${l.type === "VIDEO" ? "bi-play-circle-fill text-primary" : l.type === "PDF" ? "bi-file-earmark-pdf-fill text-danger" : "bi-card-text text-success"}`} style={{ fontSize: "1.1rem" }} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#e5e7eb", fontSize: "0.85rem" }}>{ci + 1}.{li + 1} {l.title}</div>
                          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", display: "flex", gap: 8, marginTop: 2 }}>
                            <span>{l.type}</span>
                            {l.duration ? <span>· {Math.floor(l.duration / 60)}m {l.duration % 60}s</span> : null}
                            {l.isFree ? <span style={{ color: "#10b981", fontWeight: 700 }}>· PREVIEW</span> : null}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => openLessonModal(ch.id, l)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><i className="bi bi-pencil" /></button>
                        <button onClick={() => handleDeleteLesson(l.id)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.7)", cursor: "pointer" }} disabled={isPending}><i className="bi bi-trash" /></button>
                      </div>
                    </div>
                  ))}
                  {ch.lessons.length === 0 && <div style={{ padding: "12px 18px", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>No lessons in this chapter.</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ASSETS TAB ── */}
        {activeTab === "assets" && product && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0", fontSize: "0.85rem" }}>Provide direct download links for eBooks, PDFs, or software keys.</p>
            
            <div style={{ display: "flex", gap: 12, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <select className="form-select ds-input" style={{ width: 140 }} value={assetForm.type} onChange={e => setAssetForm({ ...assetForm, type: e.target.value })}>
                <option value="EBOOK">eBook (PDF)</option>
                <option value="KEY">Software Key</option>
                <option value="COURSE">ZIP Archive</option>
              </select>
              <input type="url" className="form-control ds-input flex-grow-1" placeholder="https://drive.google.com/..." value={assetForm.url} onChange={e => setAssetForm({ ...assetForm, url: e.target.value })} />
              <button onClick={handleAddAsset} className="btn btn-danger fw-bold" disabled={isPending}>+ Add Asset</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {product.digitalAssets.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <i className="bi bi-cloud-arrow-down-fill text-danger fs-5" />
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{a.assetType} Download</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.fileUrl}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAsset(a.id)} className="btn btn-sm btn-outline-danger" disabled={isPending}><i className="bi bi-trash" /></button>
                </div>
              ))}
              {product.digitalAssets.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>No standalone downloads added.</div>}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {lessonModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border border-secondary border-opacity-25 rounded-4 shadow-lg text-white">
              <div className="modal-header border-bottom border-secondary border-opacity-25">
                <h5 className="modal-title fw-bold fs-6">{lessonModal.lesson ? "Edit Lesson" : "Add Lesson"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setLessonModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small text-muted text-uppercase fw-bold">Lesson Title *</label>
                  <input type="text" className="form-control ds-input" value={lesForm.title} onChange={e => setLesForm({ ...lesForm, title: e.target.value })} />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Content Type</label>
                    <select className="form-select ds-input" value={lesForm.type} onChange={e => setLesForm({ ...lesForm, type: e.target.value })}>
                      <option value="VIDEO">Video Stream</option>
                      <option value="PDF">PDF Document</option>
                      <option value="TEXT">Text Article</option>
                      <option value="QUIZ">Quiz</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted text-uppercase fw-bold">Duration (Seconds)</label>
                    <input type="number" className="form-control ds-input" value={lesForm.duration} onChange={e => setLesForm({ ...lesForm, duration: Number(e.target.value) })} disabled={lesForm.type !== "VIDEO"} />
                  </div>
                </div>
                {lesForm.type !== "QUIZ" && (
                  <div className="mb-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Resource URL *</label>
                    {lesForm.type === "TEXT" ? (
                      <textarea className="form-control ds-input" rows={4} placeholder="Write lesson body here..." value={lesForm.url} onChange={e => setLesForm({ ...lesForm, url: e.target.value })} />
                    ) : (
                      <input type="url" className="form-control ds-input" placeholder="https://..." value={lesForm.url} onChange={e => setLesForm({ ...lesForm, url: e.target.value })} />
                    )}
                    <div className="text-muted small mt-1" style={{ fontSize: "0.65rem" }}>Provide a direct link to the {lesForm.type.toLowerCase()} file.</div>
                  </div>
                )}
                
                {lesForm.type === "QUIZ" && (
                  <div className="mb-4">
                    <label className="form-label small text-muted text-uppercase fw-bold d-flex justify-content-between align-items-center">
                      Quiz Questions
                      <button type="button" className="btn btn-sm btn-outline-light" style={{ fontSize: "0.7rem", padding: "2px 8px" }} onClick={() => setLesForm({ ...lesForm, quizQuestions: [...lesForm.quizQuestions, { question: "", options: ["", ""], answer: 0, explain: "" }] })}>+ Question</button>
                    </label>
                    
                    <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
                      {lesForm.quizQuestions.map((q, qi) => (
                        <div key={qi} className="mb-3 p-3 bg-dark border border-secondary border-opacity-25 rounded-3">
                           <div className="d-flex justify-content-between mb-2 align-items-center">
                             <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Question {qi + 1}</span>
                             <button type="button" className="btn-close btn-close-white" style={{ fontSize: "0.6rem" }} onClick={() => {
                               const newQs = [...lesForm.quizQuestions];
                               newQs.splice(qi, 1);
                               setLesForm({ ...lesForm, quizQuestions: newQs });
                             }}></button>
                           </div>
                           <input type="text" className="form-control ds-input form-control-sm mb-3" placeholder="What is your question?" value={q.question} onChange={e => {
                               const newQs = [...lesForm.quizQuestions];
                               newQs[qi].question = e.target.value;
                               setLesForm({ ...lesForm, quizQuestions: newQs });
                           }} />
                           
                           <div className="mb-3">
                             <label className="form-label small text-muted text-uppercase fw-bold" style={{ fontSize: "0.65rem" }}>Options (Select the correct one)</label>
                             {q.options.map((opt, oi) => (
                               <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                                 <input type="radio" name={`q${qi}_ans`} checked={q.answer === oi} onChange={() => {
                                   const newQs = [...lesForm.quizQuestions];
                                   newQs[qi].answer = oi;
                                   setLesForm({ ...lesForm, quizQuestions: newQs });
                                 }} />
                                 <input type="text" className="form-control ds-input form-control-sm flex-grow-1" placeholder={`Option ${oi + 1}`} value={opt} onChange={e => {
                                   const newQs = [...lesForm.quizQuestions];
                                   newQs[qi].options[oi] = e.target.value;
                                   setLesForm({ ...lesForm, quizQuestions: newQs });
                                 }} />
                                 <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => {
                                   const newQs = [...lesForm.quizQuestions];
                                   newQs[qi].options.splice(oi, 1);
                                   if (newQs[qi].answer >= newQs[qi].options.length) newQs[qi].answer = Math.max(0, newQs[qi].options.length - 1);
                                   setLesForm({ ...lesForm, quizQuestions: newQs });
                                 }}><i className="bi bi-x-circle"></i></button>
                               </div>
                             ))}
                             <button type="button" className="btn btn-sm btn-link text-info p-0 mt-1 text-decoration-none" style={{ fontSize: "0.75rem" }} onClick={() => {
                               const newQs = [...lesForm.quizQuestions];
                               newQs[qi].options.push("");
                               setLesForm({ ...lesForm, quizQuestions: newQs });
                             }}>+ Add Option</button>
                           </div>

                           <input type="text" className="form-control ds-input form-control-sm" placeholder="Explanation (Optional)" value={q.explain || ""} onChange={e => {
                               const newQs = [...lesForm.quizQuestions];
                               newQs[qi].explain = e.target.value;
                               setLesForm({ ...lesForm, quizQuestions: newQs });
                           }} />
                        </div>
                      ))}
                      {lesForm.quizQuestions.length === 0 && <div className="text-muted small">No questions added. Click "+ Question" to start.</div>}
                    </div>
                  </div>
                )}
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="freeToggle" checked={lesForm.isFree} onChange={e => setLesForm({ ...lesForm, isFree: e.target.checked })} />
                  <label className="form-check-label text-white small fw-bold ms-2" htmlFor="freeToggle">Free Preview (Users can watch without buying)</label>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary border-opacity-25">
                <button type="button" className="btn btn-outline-light" onClick={() => setLessonModal(null)}>Cancel</button>
                <button type="button" className="btn btn-primary fw-bold px-4" onClick={handleSaveLesson} disabled={isPending}>{isPending ? "Saving..." : "Save Lesson"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
