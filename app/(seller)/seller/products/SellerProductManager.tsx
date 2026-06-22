"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSellerProductAction, deleteSellerProductAction } from "@/app/actions/seller";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  categoryId: string;
  category: {
    name: string;
  };
}

interface SellerProductManagerProps {
  products: Product[];
  categories: Category[];
}

export default function SellerProductManager({ products, categories }: SellerProductManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    basePrice: 0,
    categoryId: categories[0]?.id || ""
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      description: "",
      basePrice: 0,
      categoryId: categories[0]?.id || ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      title: p.title,
      description: p.description,
      basePrice: p.basePrice,
      categoryId: p.categoryId
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.categoryId) {
      toast.error("Title and Category are required");
      return;
    }

    startTransition(async () => {
      const res = await saveSellerProductAction(
        editingProduct ? editingProduct.id : null,
        formData
      );
      if (res.success) {
        toast.success(res.message);
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    startTransition(async () => {
      const res = await deleteSellerProductAction(id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 text-white">
        <div>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: "-1px" }}>Manage Products</h2>
          <p className="text-muted mb-0">List and update your products catalog.</p>
        </div>
        <button 
          className="btn btn-danger rounded-pill px-4 fw-bold hover-scale transition-all"
          onClick={handleOpenCreate}
        >
          <i className="bi bi-plus-lg me-2"></i> Add Product
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded-4 border border-secondary border-opacity-25">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-dark text-muted small text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "1px" }}>
              <tr>
                <th className="border-0">Product Info</th>
                <th className="border-0">Category</th>
                <th className="border-0">Price</th>
                <th className="border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="py-3">
                    <div className="fw-bold text-white mb-1">{p.title}</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: "250px" }}>{p.description}</div>
                  </td>
                  <td className="py-3 text-muted small">{p.category.name}</td>
                  <td className="py-3 text-white fw-bold">₹{p.basePrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        className="btn btn-sm btn-outline-light rounded-pill px-3 fw-semibold"
                        onClick={() => handleOpenEdit(p)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-5 small">No products listed. Add one to start selling!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Save Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-gray-900 border border-secondary border-opacity-25 rounded-4 shadow-lg text-white">
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
                <h5 className="modal-title fw-bold text-white">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase fw-bold mb-1">Product Title</label>
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase fw-bold mb-1">Category</label>
                    <select 
                      className="form-select bg-dark border-secondary text-white rounded-3 shadow-sm"
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase fw-bold mb-1">Base Price (INR)</label>
                    <input 
                      type="number" 
                      className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
                      value={formData.basePrice || ""}
                      onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                      required
                      min={0}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase fw-bold mb-1">Description</label>
                    <textarea 
                      className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-light rounded-pill px-4 fw-semibold" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
