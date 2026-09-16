import { prisma } from "@/lib/db";
import Link from "next/link";
import React from "react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/Seller2/MotionWrapper";

export default async function Seller2Products() {
  const seller = await prisma.seller.findFirst();
  
  if (!seller) {
    return <div className="text-center p-5">No seller found.</div>;
  }

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <StaggerContainer>
      <StaggerItem className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="s2-page-title mb-1 s2-gradient-text">Inventory Hub</h1>
          <p className="text-muted s2-font">Manage your products, variants, and stock dynamically.</p>
        </div>
        <Link href="/seller2/products/add" className="s2-btn s2-btn-primary rounded-pill px-4 shadow">
          <i className="bi bi-plus-lg"></i> Add New Product
        </Link>
      </StaggerItem>

      <StaggerItem className="s2-card-bento p-0 overflow-hidden">
        {/* Advanced Toolbar */}
        <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
          <div className="d-flex gap-3 flex-grow-1" style={{ maxWidth: "500px" }}>
            <div className="position-relative flex-grow-1">
              <i className="bi bi-search position-absolute text-muted" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}></i>
              <input type="text" className="form-control rounded-pill border-0 shadow-sm ps-5" placeholder="Search by SKU, Name..." />
            </div>
            <select className="form-select w-auto rounded-pill border-0 shadow-sm text-muted fw-bold">
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
            </select>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-light rounded-circle shadow-sm" style={{ width: 40, height: 40 }}><i className="bi bi-filter"></i></button>
            <button className="btn btn-light rounded-circle shadow-sm" style={{ width: 40, height: 40 }}><i className="bi bi-arrow-clockwise"></i></button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase border-bottom border-light">
              <tr>
                <th className="ps-4 py-3" style={{ width: "40px" }}><input type="checkbox" className="form-check-input" /></th>
                <th className="py-3">Product</th>
                <th className="py-3">Category</th>
                <th className="py-3">Status</th>
                <th className="py-3">Price</th>
                <th className="py-3">Variants</th>
                <th className="text-end pe-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="s2-table-row border-bottom border-light">
                    <td className="ps-4"><input type="checkbox" className="form-check-input" /></td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-white rounded d-flex align-items-center justify-content-center shadow-sm" style={{width: 54, height: 54, padding: "2px"}}>
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.title} className="w-100 h-100 object-fit-cover rounded" />
                          ) : (
                            <i className="bi bi-image text-muted fs-4"></i>
                          )}
                        </div>
                        <div>
                          <div className="fw-bolder text-dark s2-font mb-1">{p.title}</div>
                          <div className="text-muted small font-monospace">SKU: {p.id.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2 border">{p.category?.name || "Uncategorized"}</span>
                    </td>
                    <td>
                      {p.isPublished ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2 shadow-sm"><i className="bi bi-check-circle me-1"></i> Active</span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-3 py-2 shadow-sm"><i className="bi bi-clock me-1"></i> Draft</span>
                      )}
                    </td>
                    <td className="fw-bolder text-dark fs-5">₹{p.basePrice}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2 text-muted fw-bold">
                        <i className="bi bi-layers"></i> {p.variants.length}
                      </div>
                    </td>
                    <td className="text-end pe-4 position-relative">
                      {/* Hover Action Menu */}
                      <div className="s2-row-actions position-absolute top-50 translate-middle-y end-0 pe-4 bg-white bg-opacity-75 backdrop-blur rounded-start p-2 shadow-sm d-flex gap-2">
                        <button className="btn btn-sm btn-primary rounded-circle shadow-sm" style={{width: 32, height:32}}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-light text-muted rounded-circle shadow-sm" style={{width: 32, height:32}}><i className="bi bi-files"></i></button>
                        <button className="btn btn-sm btn-danger rounded-circle shadow-sm" style={{width: 32, height:32}}><i className="bi bi-trash"></i></button>
                      </div>
                      {/* Default state icon */}
                      <i className="bi bi-three-dots text-muted"></i>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: 80, height: 80 }}>
                      <i className="bi bi-box-seam fs-1 text-primary opacity-50"></i>
                    </div>
                    <h5 className="fw-bolder text-dark">Your inventory is empty</h5>
                    <p className="text-muted mb-0">Start by adding your first product to the catalog.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
