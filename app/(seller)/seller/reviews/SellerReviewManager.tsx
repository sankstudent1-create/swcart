"use client";

import React, { useState, useTransition } from "react";
import { replyToReviewAction } from "@/app/actions/seller";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SellerReviewManager({ reviews }: { reviews: any[] }) {
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await replyToReviewAction(selectedReview.id, replyText);
      if (res.success) {
        toast.success(res.message);
        setSelectedReview(null);
        setReplyText("");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const openReplyModal = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.sellerReply || "");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-white" style={{ letterSpacing: "-1px" }}>Customer Reviews</h2>
          <p className="text-muted mb-0 small">Manage and reply to customer reviews for your products.</p>
        </div>
        <div className="px-3 py-2 rounded-4 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-white fw-bold fs-5">{reviews.length}</div>
          <div className="text-muted" style={{ fontSize: ".7rem" }}>Total Reviews</div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-star" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
          <p className="mt-3 mb-0">No reviews found for your products yet.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {reviews.map(review => (
            <div key={review.id} className="rounded-4 p-3 p-md-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="row g-3">
                {/* Left: Product & User */}
                <div className="col-md-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    {review.product.images?.[0] ? (
                       <img src={review.product.images[0]} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#333" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-white small fw-bold text-truncate">{review.product.title}</div>
                      <div className="text-muted" style={{ fontSize: ".7rem" }}>PID: {review.product.id.slice(-8)}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-muted" style={{ fontSize: ".75rem" }}>
                    <i className="bi bi-person me-1"></i> {review.user.name}<br/>
                    <i className="bi bi-envelope me-1"></i> {review.user.email}
                  </div>
                </div>

                {/* Middle: Review */}
                <div className="col-md-6 border-start border-end border-secondary border-opacity-25 px-md-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="text-warning d-flex gap-1">
                      {Array(review.rating).fill(0).map((_, i) => <i key={i} className="bi bi-star-fill"></i>)}
                      {Array(5 - review.rating).fill(0).map((_, i) => <i key={i} className="bi bi-star" style={{ color: "rgba(255,255,255,0.1)" }}></i>)}
                    </div>
                    <span className="text-muted" style={{ fontSize: ".7rem" }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white mb-0 small">"{review.comment || "No text provided"}"</p>
                  
                  {review.mediaUrls && review.mediaUrls.length > 0 && (
                    <div className="d-flex gap-2 mt-2">
                      {review.mediaUrls.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="Review Media" style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover" }} />
                      ))}
                    </div>
                  )}

                  {review.sellerReply && (
                    <div className="mt-3 p-2 rounded" style={{ background: "rgba(230,57,70,0.1)", borderLeft: "2px solid var(--red)" }}>
                      <div className="text-danger fw-bold" style={{ fontSize: ".7rem" }}>Your Reply</div>
                      <div className="text-white small">{review.sellerReply}</div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="col-md-3 d-flex flex-column justify-content-center align-items-end">
                  <button 
                    className="btn btn-sm rounded-pill fw-semibold shadow-sm w-100" 
                    style={{ background: review.sellerReply ? "rgba(255,255,255,0.05)" : "var(--red)", color: "white", border: review.sellerReply ? "1px solid rgba(255,255,255,0.1)" : "none" }}
                    onClick={() => openReplyModal(review)}
                  >
                    {review.sellerReply ? <><i className="bi bi-pencil me-1"></i> Edit Reply</> : <><i className="bi bi-reply me-1"></i> Reply</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selectedReview && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}>
              <div className="modal-header border-bottom border-secondary border-opacity-25">
                <h5 className="modal-title fw-bold">Reply to Review</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedReview(null)}></button>
              </div>
              <form onSubmit={handleReplySubmit}>
                <div className="modal-body">
                  <div className="mb-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="d-flex gap-1 mb-2 text-warning">
                      {Array(selectedReview.rating).fill(0).map((_, i) => <i key={i} className="bi bi-star-fill"></i>)}
                    </div>
                    <div className="text-white small">"{selectedReview.comment}"</div>
                  </div>

                  <div className="form-group">
                    <label className="text-muted small fw-bold mb-2">Your Public Reply</label>
                    <textarea 
                      className="form-control text-white" 
                      rows={4} 
                      style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", resize: "none" }}
                      placeholder="Write your response here..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    ></textarea>
                    <small className="text-muted mt-1 d-block" style={{ fontSize: ".7rem" }}>This reply will be publicly visible on the product page.</small>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary border-opacity-25">
                  <button type="button" className="btn btn-secondary rounded-pill fw-bold px-4" onClick={() => setSelectedReview(null)}>Cancel</button>
                  <button type="submit" className="btn btn-danger rounded-pill fw-bold px-4" disabled={isPending}>
                    {isPending ? "Submitting..." : "Submit Reply"}
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
