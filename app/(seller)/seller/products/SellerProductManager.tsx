"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSellerProductAction, deleteSellerProductAction } from "@/app/actions/seller";
import { toast } from "sonner";

interface Category { id: string; name: string; }
interface Inventory { quantity: number; }
interface ProductVariant { id: string; sku: string; size: string | null; color: string | null; price: number; inventory: Inventory[]; }
interface Product {
  id: string; title: string; description: string; basePrice: number; discountPercent: number;
  categoryId: string; images: string[]; isPublished: boolean; brand?: string | null;
  tags?: string[]; weightGrams?: number | null; dimLength?: number | null; dimWidth?: number | null;
  dimHeight?: number | null; returnPolicy?: string | null; warrantyInfo?: string | null;
  metaTitle?: string | null; metaDescription?: string | null;
  category: { name: string }; variants: ProductVariant[];
}
interface SellerProductManagerProps { products: Product[]; categories: Category[]; }

type TabKey = "general" | "pricing" | "variants" | "details";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80";

export default function SellerProductManager({ products, categories }: SellerProductManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const emptyForm = {
    title: "", description: "", basePrice: 0, discountPercent: 0,
    categoryId: categories[0]?.id || "", images: [""], isPublished: true,
    brand: "", tags: "", weightGrams: "", dimLength: "", dimWidth: "", dimHeight: "",
    returnPolicy: "7 days hassle-free returns", warrantyInfo: "1 year manufacturer warranty",
    metaTitle: "", metaDescription: "",
  };
  const [form, setForm] = useState({ ...emptyForm });
  const [variants, setVariants] = useState<{ id?: string; sku: string; size: string; color: string; price: number; quantity: number; }[]>([]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleOpenCreate = () => {
    setEditingProduct(null); setForm({ ...emptyForm }); setActiveTab("general");
    setVariants([{ sku: "SKU-001", size: "Default", color: "Default", price: 0, quantity: 10 }]);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      title: p.title, description: p.description, basePrice: p.basePrice,
      discountPercent: p.discountPercent || 0, categoryId: p.categoryId,
      images: p.images?.length > 0 ? [...p.images] : [""],
      isPublished: p.isPublished ?? true,
      brand: p.brand || "", tags: (p.tags || []).join(", "),
      weightGrams: String(p.weightGrams || ""), dimLength: String(p.dimLength || ""),
      dimWidth: String(p.dimWidth || ""), dimHeight: String(p.dimHeight || ""),
      returnPolicy: p.returnPolicy || "7 days hassle-free returns",
      warrantyInfo: p.warrantyInfo || "1 year manufacturer warranty",
      metaTitle: p.metaTitle || "", metaDescription: p.metaDescription || "",
    });
    setVariants(p.variants.length > 0
      ? p.variants.map(v => ({ id: v.id, sku: v.sku, size: v.size || "", color: v.color || "", price: v.price, quantity: v.inventory[0]?.quantity || 0 }))
      : [{ sku: "SKU-001", size: "Default", color: "Default", price: p.basePrice, quantity: 10 }]
    );
    setActiveTab("general"); setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    for (const v of variants) {
      if (!v.sku.trim()) { toast.error("Each variant needs a SKU code"); return; }
    }
    const cleanImages = form.images.filter(img => img.trim() !== "");
    const tagsArr = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

    startTransition(async () => {
      const payload = {
        title: form.title, description: form.description,
        basePrice: Number(form.basePrice), discountPercent: Number(form.discountPercent),
        categoryId: form.categoryId, images: cleanImages, isPublished: form.isPublished,
        brand: form.brand || undefined, tags: tagsArr,
        weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
        dimLength: form.dimLength ? Number(form.dimLength) : undefined,
        dimWidth: form.dimWidth ? Number(form.dimWidth) : undefined,
        dimHeight: form.dimHeight ? Number(form.dimHeight) : undefined,
        returnPolicy: form.returnPolicy || undefined,
        warrantyInfo: form.warrantyInfo || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        variants: variants.map(v => ({ id: v.id, sku: v.sku, size: v.size || undefined, color: v.color || undefined, price: Number(v.price), quantity: Number(v.quantity) })),
      };
      const res = await saveSellerProductAction(editingProduct ? editingProduct.id : null, payload);
      if (res.success) { toast.success(res.message); setShowModal(false); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    startTransition(async () => {
      const res = await deleteSellerProductAction(id);
      if (res.success) { toast.success(res.message); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "general", label: "General", icon: "bi-info-circle" },
    { key: "pricing", label: "Pricing & Media", icon: "bi-currency-rupee" },
    { key: "variants", label: "Variants & Stock", icon: "bi-layers" },
    { key: "details", label: "Details & SEO", icon: "bi-search" },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 text-white">
        <div>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: "-1px" }}>Manage Products</h2>
          <p className="text-muted mb-0">Full product catalog management — images, discounts, variants, inventory, SEO.</p>
        </div>
        <button className="btn btn-danger rounded-pill px-4 fw-bold" onClick={handleOpenCreate}>
          <i className="bi bi-plus-lg me-2"></i> Add Product
        </button>
      </div>

      <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="text-muted small text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "1px" }}>
              <tr>
                <th className="border-0">Product</th>
                <th className="border-0">Category</th>
                <th className="border-0">Price</th>
                <th className="border-0">Stock / Variants</th>
                <th className="border-0">Status</th>
                <th className="border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {products.map((p) => {
                const totalStock = p.variants.reduce((a, v) => a + (v.inventory[0]?.quantity || 0), 0);
                const salePrice = p.discountPercent > 0 ? Math.round(p.basePrice * (1 - p.discountPercent / 100)) : null;
                const thumb = p.images?.[0]?.startsWith("http") ? p.images[0] : FALLBACK_IMG;
                return (
                  <tr key={p.id}>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 overflow-hidden border border-secondary border-opacity-25" style={{ width: 48, height: 48, flexShrink: 0, background: "#111" }}>
                          <img src={thumb} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: ".9rem" }}>{p.title}</div>
                          {p.brand && <div className="text-muted" style={{ fontSize: ".75rem" }}>{p.brand}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted small">{p.category.name}</td>
                    <td className="py-3">
                      {salePrice ? (
                        <div>
                          <span className="text-white fw-bold">₹{salePrice.toLocaleString("en-IN")}</span>
                          <span className="text-muted text-decoration-line-through ms-2 small">₹{p.basePrice.toLocaleString("en-IN")}</span>
                          <span className="badge bg-danger bg-opacity-20 text-danger ms-1" style={{ fontSize: ".65rem" }}>{p.discountPercent}% OFF</span>
                        </div>
                      ) : (
                        <span className="text-white fw-bold">₹{p.basePrice.toLocaleString("en-IN")}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="text-white small">{p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}</div>
                      <div className={`small fw-bold ${totalStock > 0 ? "text-success" : "text-danger"}`}>{totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}</div>
                    </td>
                    <td className="py-3">
                      <span className={`badge rounded-pill px-2 ${p.isPublished ? "bg-success bg-opacity-20 text-success" : "bg-secondary bg-opacity-20 text-muted"}`} style={{ fontSize: ".7rem" }}>
                        {p.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => handleOpenEdit(p)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDelete(p.id)} disabled={isPending}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-5 small">No products yet. Click "Add Product" to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark border border-secondary border-opacity-25 rounded-4 shadow-lg text-white">
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-box-seam text-danger"></i>
                  {editingProduct ? `Editing: ${editingProduct.title}` : "Add New Product"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              {/* Tab Nav */}
              <div className="px-4 pt-3 border-bottom border-secondary border-opacity-10" style={{ background: "rgba(0,0,0,0.2)" }}>
                <ul className="nav nav-tabs border-0 gap-1">
                  {tabs.map(t => (
                    <li key={t.key} className="nav-item">
                      <button
                        type="button"
                        className={`nav-link border-0 px-3 py-2 rounded-top fw-semibold small ${activeTab === t.key ? "bg-danger text-white" : "text-muted bg-transparent"}`}
                        onClick={() => setActiveTab(t.key)}
                      >
                        <i className={`bi ${t.icon} me-1`}></i>{t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4" style={{ maxHeight: "58vh", overflowY: "auto" }}>

                  {/* ── TAB: GENERAL ── */}
                  {activeTab === "general" && (
                    <div className="d-flex flex-column gap-3">
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Product Title *</label>
                          <input type="text" className="form-control rounded-3" placeholder="e.g. Premium Cotton T-Shirt" value={form.title} onChange={e => set("title", e.target.value)} required />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Brand</label>
                          <input type="text" className="form-control rounded-3" placeholder="e.g. Nike" value={form.brand} onChange={e => set("brand", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label text-muted small text-uppercase fw-bold mb-1">Category *</label>
                        <select className="form-select rounded-3" value={form.categoryId} onChange={e => set("categoryId", e.target.value)} required>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-muted small text-uppercase fw-bold mb-1">Description *</label>
                        <textarea className="form-control rounded-3" rows={4} placeholder="Detailed product description..." value={form.description} onChange={e => set("description", e.target.value)} required />
                      </div>
                      <div>
                        <label className="form-label text-muted small text-uppercase fw-bold mb-1">Tags (comma-separated)</label>
                        <input type="text" className="form-control rounded-3" placeholder="cotton, summer, casual" value={form.tags} onChange={e => set("tags", e.target.value)} />
                      </div>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => set("isPublished", e.target.checked)} />
                          <label className="form-check-label text-muted small" htmlFor="isPublished">
                            {form.isPublished ? "Published (visible to customers)" : "Draft (hidden from storefront)"}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: PRICING & MEDIA ── */}
                  {activeTab === "pricing" && (
                    <div className="d-flex flex-column gap-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Base Price (₹) *</label>
                          <input type="number" className="form-control rounded-3" min={0} value={form.basePrice || ""} onChange={e => set("basePrice", e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Discount %</label>
                          <input type="number" className="form-control rounded-3" min={0} max={100} placeholder="0" value={form.discountPercent || ""} onChange={e => set("discountPercent", e.target.value)} />
                        </div>
                      </div>
                      {Number(form.discountPercent) > 0 && (
                        <div className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-2 small text-success">
                          <i className="bi bi-tag-fill me-1"></i>
                          Sale price: ₹{Math.round(Number(form.basePrice) * (1 - Number(form.discountPercent) / 100)).toLocaleString("en-IN")}
                          &nbsp;(saving ₹{Math.round(Number(form.basePrice) * Number(form.discountPercent) / 100).toLocaleString("en-IN")})
                        </div>
                      )}
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-0">Product Image URLs</label>
                          <button type="button" className="btn btn-sm btn-outline-danger rounded-pill px-3 py-0" style={{ fontSize: ".75rem" }} onClick={() => set("images", [...form.images, ""])}>+ Add Image</button>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {form.images.map((img, idx) => (
                            <div key={idx} className="d-flex gap-2 align-items-start">
                              <div className="rounded-3 overflow-hidden border border-secondary" style={{ width: 48, height: 48, flexShrink: 0, background: "#111" }}>
                                {img.startsWith("http") && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.target as HTMLImageElement).style.display = "none"} />}
                              </div>
                              <input type="url" className="form-control rounded-3 flex-grow-1" placeholder="https://..." value={img}
                                onChange={e => { const imgs = [...form.images]; imgs[idx] = e.target.value; set("images", imgs); }} />
                              <button type="button" className="btn btn-outline-danger rounded-3 px-2" disabled={form.images.length === 1}
                                onClick={() => set("images", form.images.filter((_, i) => i !== idx))}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: VARIANTS & STOCK ── */}
                  {activeTab === "variants" && (
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="fw-bold mb-0 text-white">Variant Inventory</h6>
                          <p className="text-muted small mb-0">Define SKU, size, color, price, and stock count for each variant.</p>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-danger rounded-pill px-3"
                          onClick={() => setVariants(vs => [...vs, { sku: `SKU-${vs.length + 1}`, size: "", color: "", price: Number(form.basePrice) || 0, quantity: 10 }])}>
                          + Add Variant
                        </button>
                      </div>
                      {variants.map((v, idx) => (
                        <div key={idx} className="rounded-4 border border-secondary border-opacity-25 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="row g-2 align-items-end">
                            <div className="col-6 col-md-3">
                              <label className="text-muted" style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".5px" }}>SKU *</label>
                              <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" value={v.sku} onChange={e => setVariants(vs => { const a = [...vs]; a[idx] = { ...a[idx], sku: e.target.value }; return a; })} required />
                            </div>
                            <div className="col-6 col-md-2">
                              <label className="text-muted" style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Size</label>
                              <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" placeholder="M, L, XL" value={v.size} onChange={e => setVariants(vs => { const a = [...vs]; a[idx] = { ...a[idx], size: e.target.value }; return a; })} />
                            </div>
                            <div className="col-6 col-md-2">
                              <label className="text-muted" style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Color</label>
                              <input type="text" className="form-control form-control-sm bg-dark border-secondary text-white" placeholder="Red, Blue" value={v.color} onChange={e => setVariants(vs => { const a = [...vs]; a[idx] = { ...a[idx], color: e.target.value }; return a; })} />
                            </div>
                            <div className="col-6 col-md-2">
                              <label className="text-muted" style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Price ₹ *</label>
                              <input type="number" className="form-control form-control-sm bg-dark border-secondary text-white" min={0} value={v.price} onChange={e => setVariants(vs => { const a = [...vs]; a[idx] = { ...a[idx], price: Number(e.target.value) }; return a; })} required />
                            </div>
                            <div className="col-6 col-md-2">
                              <label className="text-muted" style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Stock</label>
                              <input type="number" className="form-control form-control-sm bg-dark border-secondary text-white" min={0} value={v.quantity} onChange={e => setVariants(vs => { const a = [...vs]; a[idx] = { ...a[idx], quantity: Number(e.target.value) }; return a; })} />
                            </div>
                            <div className="col-6 col-md-1 text-end">
                              <button type="button" className="btn btn-sm btn-outline-danger px-2 border-0"
                                onClick={() => { if (variants.length === 1) { toast.error("At least 1 variant required"); return; } setVariants(vs => vs.filter((_, i) => i !== idx)); }}>
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── TAB: DETAILS & SEO ── */}
                  {activeTab === "details" && (
                    <div className="d-flex flex-column gap-3">
                      <h6 className="fw-bold text-white mb-0">Shipping & Packaging</h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Weight (grams)</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white rounded-3" placeholder="e.g. 500" min={0} value={form.weightGrams} onChange={e => set("weightGrams", e.target.value)} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Length (cm)</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white rounded-3" placeholder="L" min={0} step={0.1} value={form.dimLength} onChange={e => set("dimLength", e.target.value)} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Width (cm)</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white rounded-3" placeholder="W" min={0} step={0.1} value={form.dimWidth} onChange={e => set("dimWidth", e.target.value)} />
                        </div>
                      </div>

                      <hr className="border-secondary" />
                      <h6 className="fw-bold text-white mb-0">Policies</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Return Policy</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white rounded-3" placeholder="e.g. 7-day hassle-free returns" value={form.returnPolicy} onChange={e => set("returnPolicy", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small text-uppercase fw-bold mb-1">Warranty Info</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white rounded-3" placeholder="e.g. 1 year manufacturer warranty" value={form.warrantyInfo} onChange={e => set("warrantyInfo", e.target.value)} />
                        </div>
                      </div>

                      <hr className="border-secondary" />
                      <h6 className="fw-bold text-white mb-0">SEO Metadata</h6>
                      <div>
                        <label className="form-label text-muted small text-uppercase fw-bold mb-1">Meta Title</label>
                        <input type="text" className="form-control bg-dark border-secondary text-white rounded-3" placeholder="Appears in browser tab & Google results" value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} />
                        <div className="text-muted small mt-1">{form.metaTitle.length}/60 characters</div>
                      </div>
                      <div>
                        <label className="form-label text-muted small text-uppercase fw-bold mb-1">Meta Description</label>
                        <textarea className="form-control bg-dark border-secondary text-white rounded-3" rows={2} placeholder="Brief product summary for search engines..." value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} />
                        <div className="text-muted small mt-1">{form.metaDescription.length}/160 characters</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-1">
                    {tabs.map(t => (
                      <button key={t.key} type="button"
                        className={`btn btn-sm rounded-pill px-2 py-0 ${activeTab === t.key ? "btn-danger" : "btn-outline-secondary"}`}
                        style={{ fontSize: ".7rem" }}
                        onClick={() => setActiveTab(t.key)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-light rounded-pill px-4 fw-semibold" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm" disabled={isPending}>
                      {isPending ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : "Save Product"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
