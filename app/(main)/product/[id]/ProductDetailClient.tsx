"use client";

import { useState } from "react";
import Link from "next/link";
import ProductActions from "@/components/ProductActions";
import ReviewForm from "./ReviewForm";

interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  mediaUrls: string[];
  userName: string;
  userAvatar: string | null;
  createdAt: string;
  sellerReply?: string | null;
  replyCreatedAt?: string | null;
}

interface ProductQuestion {
  id: string;
  question: string;
  answers: { answer: string; userName: string; createdAt: string }[];
  userName: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  cat: string;
  price: number;
  old: number | null;
  tag: string | null;
  description: string;
  image: string;
  images: string[];
  discountPercent: number;
  inStock: boolean;
  totalStock: number;
  variants: ProductVariant[];
  reviews: Review[];
  reviewCount: number;
  avgRating: number;
  seller?: { companyName: string; isVerified: boolean };
  questions?: ProductQuestion[];
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

export default function ProductDetailClient({ product: p }: { product: Product }) {
  const allImages = [
    ...(p.images?.filter(img => img?.startsWith("http")) || []),
  ];
  if (allImages.length === 0) allImages.push(p.image || FALLBACK_IMG);

  const [mainImg, setMainImg] = useState(allImages[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    p.variants?.length > 0 ? p.variants[0] : null
  );

  const displayPrice = selectedVariant ? selectedVariant.price : p.price;
  const oldPrice = p.old;
  const stockCount = selectedVariant ? selectedVariant.stock : p.totalStock;
  const inStock = stockCount > 0;

  const uniqueSizes = [...new Set(p.variants.map(v => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(p.variants.map(v => v.color).filter(Boolean))];
  const [selectedSize, setSelectedSize] = useState(uniqueSizes[0] || null);
  const [selectedColor, setSelectedColor] = useState(uniqueColors[0] || null);

  // Derive active variant from size+color selection
  const activeVariant = p.variants.find(v =>
    (uniqueSizes.length === 0 || v.size === selectedSize) &&
    (uniqueColors.length === 0 || v.color === selectedColor)
  ) || selectedVariant;

  const stars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return { full, half, empty: 5 - full - (half ? 1 : 0) };
  };

  const { full, half, empty } = stars(p.avgRating);

  return (
    <main style={{ backgroundColor: "#faf9f8" }}>
      <div className="container py-3">
        <div className="breadcrumb-nav small text-muted">
          <Link href="/" className="text-decoration-none text-muted hover-red transition-all">Home</Link>
          <i className="bi bi-chevron-right mx-2" style={{ fontSize: "0.7rem" }}></i>
          <Link href={`/?cat=${encodeURIComponent(p.cat)}`} className="text-decoration-none text-muted hover-red transition-all">{p.cat}</Link>
          <i className="bi bi-chevron-right mx-2" style={{ fontSize: "0.7rem" }}></i>
          <span className="fw-bold" style={{ color: "var(--ink)" }}>{p.name}</span>
        </div>
      </div>

      <section className="container product-layout">
        <div className="row g-5">
          {/* Gallery */}
          <div className="col-lg-6">
            <div className="product-gallery">
              {allImages.length > 1 && (
                <div className="gallery-thumbs">
                  {allImages.map((img, i) => (
                    <img
                      key={i}
                      className={`thumb-img${mainImg === img ? " active" : ""}`}
                      src={img}
                      alt={`${p.name} ${i + 1}`}
                      onClick={() => setMainImg(img)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>
              )}
              <div className="main-img-wrap">
                <img src={mainImg} alt={p.name} style={{ transition: "all 0.3s ease" }} />
                {p.tag && (
                  <span style={{
                    position: "absolute", top: "16px", left: "16px",
                    background: "var(--red)", color: "#fff",
                    padding: "4px 12px", borderRadius: "20px",
                    fontSize: ".75rem", fontWeight: 700, zIndex: 3
                  }}>{p.tag}</span>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="col-lg-6">
            <div className="product-info">
              <div className="p-cat text-uppercase fw-bold text-danger mb-2" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>{p.cat}</div>
              <h1 className="p-title fw-bolder mb-3" style={{ fontSize: "2.5rem", lineHeight: "1.2", letterSpacing: "-0.5px" }}>{p.name}</h1>

              {/* Rating & Seller Row */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4 pb-3 border-bottom">
                {p.reviewCount > 0 ? (
                  <div className="d-flex align-items-center gap-2">
                    <div className="text-warning d-flex gap-1" style={{ fontSize: "1.1rem" }}>
                      {Array(full).fill(0).map((_, i) => <i key={`f${i}`} className="bi bi-star-fill"></i>)}
                      {half && <i className="bi bi-star-half"></i>}
                      {Array(empty).fill(0).map((_, i) => <i key={`e${i}`} className="bi bi-star"></i>)}
                    </div>
                    <span className="fw-bold">{p.avgRating.toFixed(1)}</span>
                    <a href="#reviews" className="text-muted text-decoration-none hover-red transition-all">({p.reviewCount} reviews)</a>
                  </div>
                ) : (
                  <div className="text-muted small"><i className="bi bi-star me-1"></i> No reviews yet</div>
                )}
                
                <div style={{ width: "1px", height: "20px", background: "#ddd" }}></div>
                
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-shop text-muted"></i>
                  <span className="text-muted small">Sold by:</span>
                  <span className="fw-bold text-dark">{p.seller?.companyName || "Swcart Verified"}</span>
                  {p.seller?.isVerified && <i className="bi bi-patch-check-fill text-primary" title="Verified Seller"></i>}
                </div>
              </div>

              {/* Price box */}
              <div className="p-price-box">
                <div className="p-price">
                  <span>₹{displayPrice.toLocaleString("en-IN")}</span>
                  {oldPrice && <span className="old">₹{oldPrice.toLocaleString("en-IN")}</span>}
                  {p.discountPercent > 0 && (
                    <span className="p-tag">{p.discountPercent}% OFF</span>
                  )}
                </div>
                <p className="mb-0 mt-2" style={{ fontSize: ".85rem", color: "#666", fontWeight: 500 }}>
                  {inStock ? (
                    <span style={{ color: "#2BA84A" }}>
                      <i className="bi bi-check-circle-fill me-1"></i>
                      In Stock {stockCount < 10 ? `(only ${stockCount} left!)` : ""}
                    </span>
                  ) : (
                    <span style={{ color: "#E8472A" }}>
                      <i className="bi bi-x-circle-fill me-1"></i> Out of Stock
                    </span>
                  )}
                </p>
              </div>

              {/* Variant selectors */}
              {uniqueSizes.length > 0 && (
                <div className="mb-3">
                  <div style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>
                    Size: <span style={{ color: "var(--red)" }}>{selectedSize}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {uniqueSizes.map(size => (
                      <button
                        key={size!}
                        onClick={() => setSelectedSize(size!)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "8px",
                          border: `2px solid ${selectedSize === size ? "var(--red)" : "var(--line)"}`,
                          background: selectedSize === size ? "var(--red)" : "#fff",
                          color: selectedSize === size ? "#fff" : "var(--ink)",
                          fontWeight: 600,
                          fontSize: ".85rem",
                          cursor: "pointer",
                          transition: ".2s"
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {uniqueColors.length > 0 && (
                <div className="mb-3">
                  <div style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>
                    Color: <span style={{ color: "var(--red)" }}>{selectedColor}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {uniqueColors.map(color => (
                      <button
                        key={color!}
                        onClick={() => setSelectedColor(color!)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "8px",
                          border: `2px solid ${selectedColor === color ? "var(--red)" : "var(--line)"}`,
                          background: selectedColor === color ? "var(--red)" : "#fff",
                          color: selectedColor === color ? "#fff" : "var(--ink)",
                          fontWeight: 600,
                          fontSize: ".85rem",
                          cursor: "pointer",
                          transition: ".2s"
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="p-desc">{p.description}</p>

              <ProductActions
                productId={p.id}
                variantId={activeVariant?.id}
                disabled={!inStock}
              />

              <div className="features-grid mt-5">
                <div className="f-item">
                  <div className="f-icon bg-danger bg-opacity-10 text-danger"><i className="bi bi-truck"></i></div>
                  <div className="f-text">Fast Delivery<br /><span style={{ fontSize: ".75rem", color: "#9a8f86", fontWeight: 400 }}>Within 2-3 business days</span></div>
                </div>
                <div className="f-item">
                  <div className="f-icon bg-success bg-opacity-10 text-success"><i className="bi bi-arrow-return-left"></i></div>
                  <div className="f-text">Easy Returns<br /><span style={{ fontSize: ".75rem", color: "#9a8f86", fontWeight: 400 }}>7 days hassle-free</span></div>
                </div>
                <div className="f-item">
                  <div className="f-icon bg-primary bg-opacity-10 text-primary"><i className="bi bi-shield-check"></i></div>
                  <div className="f-text">1 Year Warranty<br /><span style={{ fontSize: ".75rem", color: "#9a8f86", fontWeight: 400 }}>Guaranteed protection</span></div>
                </div>
                <div className="f-item">
                  <div className="f-icon bg-warning bg-opacity-10 text-warning"><i className="bi bi-lock"></i></div>
                  <div className="f-text">Secure Checkout<br /><span style={{ fontSize: ".75rem", color: "#9a8f86", fontWeight: 400 }}>256-bit encryption</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        {p.questions && p.questions.length > 0 && (
          <div className="mt-5 pt-5 border-top">
            <h3 className="fw-bolder mb-4">Questions & Answers</h3>
            <div className="row g-4">
              {p.questions.map(q => (
                <div key={q.id} className="col-lg-6">
                  <div className="bg-white border rounded-4 p-4 shadow-sm h-100">
                    <div className="d-flex gap-3 mb-3">
                      <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: 32, height: 32 }}>Q</div>
                      <div>
                        <div className="fw-bold">{q.question}</div>
                        <div className="text-muted small">Asked by {q.userName} on {new Date(q.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {q.answers.map((a, i) => (
                      <div key={i} className="d-flex gap-3 mt-3 pt-3 border-top border-light">
                        <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: 32, height: 32 }}>A</div>
                        <div>
                          <div className="text-dark">{a.answer}</div>
                          <div className="text-muted small mt-1">Answered by {a.userName} on {new Date(a.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-5 pt-5 border-top" id="reviews">
          <h3 className="fw-bold mb-4">Customer Reviews</h3>
          
          <ReviewForm productId={p.id} />

          {p.reviews.length > 0 ? (
            <div className="row g-4 mt-2">
              {p.reviews.map(review => (
                <div key={review.id} className="col-md-6">
                  <div className="border rounded-4 p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      {review.userAvatar ? (
                        <img src={review.userAvatar} alt={review.userName} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", fontWeight: 700 }}>
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-bold">{review.userName}</div>
                        <div style={{ fontSize: ".8rem", color: "#9a8f86" }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2">
                      {Array(review.rating).fill(0).map((_, i) => (
                        <i key={i} className="bi bi-star-fill" style={{ color: "var(--orange)", fontSize: ".9rem" }}></i>
                      ))}
                      {Array(5 - review.rating).fill(0).map((_, i) => (
                        <i key={i} className="bi bi-star" style={{ color: "#ddd", fontSize: ".9rem" }}></i>
                      ))}
                    </div>
                    {review.comment && <p style={{ fontSize: "1rem", color: "#444", margin: "12px 0 0" }}>"{review.comment}"</p>}
                    
                    {/* Rich Media Reviews */}
                    {review.mediaUrls && review.mediaUrls.length > 0 && (
                      <div className="d-flex gap-2 mt-3 overflow-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                        {review.mediaUrls.map((url, i) => (
                          <div key={i} className="flex-shrink-0 border rounded-3 overflow-hidden shadow-sm" style={{ width: "80px", height: "80px", cursor: "pointer" }}>
                            {url.endsWith(".mp4") ? (
                              <div className="position-relative w-100 h-100 bg-dark d-flex align-items-center justify-content-center">
                                <i className="bi bi-play-circle-fill text-white fs-4"></i>
                              </div>
                            ) : (
                              <img src={url} alt="Review attachment" className="w-100 h-100" style={{ objectFit: "cover" }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Seller Reply */}
                    {review.sellerReply && (
                      <div className="mt-3 p-3 rounded-3" style={{ background: "rgba(230, 57, 70, 0.05)", borderLeft: "4px solid var(--red)" }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold" style={{ color: "var(--red)", fontSize: ".85rem" }}>
                            <i className="bi bi-shop me-1"></i> Response from Seller
                          </span>
                          {review.replyCreatedAt && (
                            <span className="text-muted" style={{ fontSize: ".7rem" }}>
                              {new Date(review.replyCreatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="mb-0" style={{ fontSize: ".9rem", color: "#444" }}>
                          {review.sellerReply}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted text-center py-5">No reviews yet. Be the first to review!</div>
          )}
        </div>
      </section>
    </main>
  );
}
