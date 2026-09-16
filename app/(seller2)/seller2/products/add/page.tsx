import { prisma } from "@/lib/db";
import { addProduct } from "@/app/actions/seller2-products";
import Link from "next/link";
import React from "react";
import { redirect } from "next/navigation";
import { StaggerContainer, StaggerItem } from "@/components/Seller2/MotionWrapper";

export default async function AddProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  async function handleSubmit(formData: FormData) {
    "use server";
    await addProduct(formData);
    redirect("/seller2/products");
  }

  return (
    <StaggerContainer>
      <StaggerItem className="d-flex align-items-center gap-3 mb-4">
        <Link href="/seller2/products" className="btn btn-light rounded-circle shadow-sm" style={{ width: 40, height: 40 }}>
          <i className="bi bi-arrow-left"></i>
        </Link>
        <div>
          <h1 className="s2-page-title mb-1">Add New Product</h1>
          <p className="text-muted s2-font mb-0">Create a new listing in your catalog.</p>
        </div>
      </StaggerItem>

      <form action={handleSubmit}>
        <div className="row g-4">
          <StaggerItem className="col-lg-8">
            <div className="s2-card-bento mb-4">
              <h5 className="fw-bolder mb-4">Basic Information</h5>
              <div className="mb-4">
                <label className="form-label fw-bold text-muted small text-uppercase">Product Title</label>
                <input type="text" name="title" className="form-control form-control-lg border-0 bg-light shadow-sm" placeholder="e.g. Wireless Noise-Cancelling Headphones" required />
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold text-muted small text-uppercase">Description</label>
                <textarea name="description" className="form-control border-0 bg-light shadow-sm" rows={5} placeholder="Describe your product..."></textarea>
              </div>
            </div>

            <div className="s2-card-bento">
              <h5 className="fw-bolder mb-4">Pricing & Inventory</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">Base Price (₹)</label>
                  <input type="number" name="basePrice" step="0.01" className="form-control form-control-lg border-0 bg-light shadow-sm" placeholder="0.00" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small text-uppercase">SKU (Stock Keeping Unit)</label>
                  <input type="text" name="sku" className="form-control form-control-lg border-0 bg-light shadow-sm" placeholder="e.g. HDPH-001" required />
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem className="col-lg-4">
            <div className="s2-card-bento mb-4">
              <h5 className="fw-bolder mb-4">Organization</h5>
              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Category</label>
                <select name="categoryId" className="form-select form-select-lg border-0 bg-light shadow-sm" required>
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="s2-card-bento mb-4">
              <h5 className="fw-bolder mb-4">Media</h5>
              <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Image URL (Optional)</label>
                <input type="url" name="imageUrl" className="form-control border-0 bg-light shadow-sm mb-3" placeholder="https://..." />
                <div className="border border-dashed border-2 border-primary border-opacity-25 rounded bg-primary bg-opacity-10 p-4 text-center">
                  <i className="bi bi-cloud-arrow-up display-6 text-primary mb-2 d-block"></i>
                  <div className="fw-bold text-primary">Upload Images</div>
                  <div className="small text-muted">Drag & drop or click (Mock UI)</div>
                </div>
              </div>
            </div>

            <button type="submit" className="s2-btn s2-btn-primary w-100 py-3 shadow fs-5">
              Publish Product
            </button>
          </StaggerItem>
        </div>
      </form>
    </StaggerContainer>
  );
}
