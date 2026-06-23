"use client";

import React, { useState, useTransition } from "react";
import { submitReviewAction } from "@/app/actions/shop";
import { toast } from "sonner";

export default function ReviewForm({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a valid rating.");
      return;
    }

    startTransition(async () => {
      const res = await submitReviewAction(productId, rating, comment);
      if (res.success) {
        toast.success(res.message);
        setComment("");
        setRating(5);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
      <h4 className="fw-bold mb-3">Write a Review</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3 d-flex align-items-center gap-2">
          <label className="fw-semibold mb-0">Your Rating:</label>
          <div 
            className="d-flex align-items-center" 
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`bi bi-star-fill`}
                style={{
                  color: star <= (hoverRating || rating) ? "var(--orange)" : "#ddd",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  transition: "color 0.2s"
                }}
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => setRating(star)}
              ></i>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <textarea
            className="form-control rounded-3"
            rows={4}
            placeholder="What did you think of this product? Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ resize: "none", backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
          ></textarea>
        </div>

        <button 
          type="submit" 
          className="btn btn-danger rounded-pill fw-bold px-4 shadow-sm"
          disabled={isPending}
        >
          {isPending ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
