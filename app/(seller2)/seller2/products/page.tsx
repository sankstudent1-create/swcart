import { prisma } from "@/lib/db";
import Link from "next/link";
import React from "react";

export default async function Seller2Products() {
  // Fetch products for the first seller (mock auth)
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
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="s2-page-title mb-1">Products Inventory</h1>
          <p className="text-muted s2-font">Manage your products, variants, and stock.</p>
        </div>
        <Link href="/seller2/products/add" className="s2-btn s2-btn-primary rounded-pill px-4">
          <i className="bi bi-plus-lg"></i> Add New Product
        </Link>
      </div>

      <div className="s2-card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex gap-3">
          <input type="text" className="form-control w-25 rounded-pill border-0 shadow-sm" placeholder="Search products..." />
          <select className="form-select w-auto rounded-pill border-0 shadow-sm">
            <option value="">All Categories</option>
            <option value="active">Electronics</option>
            <option value="draft">Fashion</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4">Product</th>
                <th>Category</th>
                <th>Status</th>
                <th>Price</th>
                <th>Variants</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded d-flex align-items-center justify-content-center border" style={{width: 48, height: 48}}>
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.title} className="w-100 h-100 object-fit-cover rounded" />
                          ) : (
                            <i className="bi bi-image text-muted fs-4"></i>
                          )}
                        </div>
                        <div>
                          <div className="fw-bolder text-dark s2-font">{p.title}</div>
                          <div className="text-muted small">ID: {p.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border">{p.category?.name || "Uncategorized"}</span>
                    </td>
                    <td>
                      {p.isPublished ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2">Published</span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2">Draft</span>
                      )}
                    </td>
                    <td className="fw-bolder">₹{p.basePrice}</td>
                    <td className="text-muted">{p.variants.length} options</td>
                    <td className="text-end pe-4">
                      <div className="btn-group">
                        <button className="btn btn-sm btn-light text-primary"><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-light text-danger"><i className="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <i className="bi bi-box-seam display-4 text-muted opacity-50 mb-3 d-block"></i>
                    <h5 className="fw-bolder">No products found</h5>
                    <p className="text-muted mb-0">Start by adding your first product.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
