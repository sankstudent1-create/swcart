"use client";

import React, { useState, useTransition } from "react";
import { submitReviewAction } from "@/app/actions/shop";
import { toast } from "sonner";

export default function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");

  const addImageUrl = () => {
    if (currentUrl.trim()) {
      setImageUrls([...imageUrls, currentUrl.trim()]);
      setCurrentUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a valid rating.");
      return;
    }

    startTransition(async () => {
      const res = await submitReviewAction(productId, rating, comment, imageUrls);
      if (res.success) {
        toast.success(res.message);
        setComment("");
        setRating(5);
        setImageUrls([]);
        onSubmitted?.();
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
          <label className="text-muted small fw-bold mb-1 d-block">YOUR REVIEW</label>
          <textarea
            className="form-control rounded-3"
            rows={4}
            placeholder="What did you think of this product? Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ resize: "none", backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
          ></textarea>
        </div>

        {/* Attachment URLs */}
        <div className="mb-3">
          <label className="text-muted small fw-bold mb-1 d-block">ATTACH IMAGES (URLs)</label>
          <div className="input-group mb-2">
            <input 
              type="url" 
              className="form-control" 
              placeholder="https://example.com/image.jpg"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
            />
            <button 
              type="button" 
              className="btn btn-outline-dark"
              onClick={addImageUrl}
            >
              Add Image
            </button>
          </div>
          
          {imageUrls.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="position-relative border rounded-3 overflow-hidden" style={{ width: "60px", height: "60px" }}>
                  <img src={url} alt="Attach" className="w-100 h-100" style={{ objectFit: "cover" }} />
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                    style={{ width: "18px", height: "18px", fontSize: "0.6rem" }}
                    onClick={() => removeImageUrl(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
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
