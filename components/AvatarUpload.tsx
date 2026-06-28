"use client";

import { useState, useRef, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName?: string;
  onSuccess?: (url: string) => void;
}

export default function AvatarUpload({ currentAvatar, userName, onSuccess }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = userName?.charAt(0)?.toUpperCase() || "U";

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate type and size
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setError(null);
    setSuccess(false);

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Upload to Supabase storage bucket "avatars"
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `avatar-${Date.now()}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) throw new Error(uploadError.message);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      // Save to DB via server action
      const res = await fetch("/api/update-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save avatar");
      }

      setPreview(publicUrl);
      setSuccess(true);
      onSuccess?.(publicUrl);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      // Reset preview on failure
      setPreview(currentAvatar || null);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: "20px",
        padding: "28px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <h5
        className="fw-bold mb-1"
        style={{ fontSize: "1rem", color: "#1a1a2e" }}
      >
        <i className="bi bi-person-circle me-2 text-danger" />
        Profile Photo
      </h5>
      <p className="text-muted small mb-4" style={{ fontSize: "0.82rem" }}>
        Upload a photo from your device. Max 5 MB · JPG, PNG, WebP supported.
      </p>

      <div className="d-flex align-items-start gap-4 flex-wrap">
        {/* Avatar Preview */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid #e63946",
              background: "#f8f9fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#e63946",
                }}
              >
                {initial}
              </span>
            )}
          </div>

          {/* Loading spinner overlay */}
          {uploading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="spinner-border text-white"
                style={{ width: "24px", height: "24px", borderWidth: "2px" }}
                role="status"
              />
            </div>
          )}

          {/* Success checkmark */}
          {success && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "#2ecc71",
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-check2 text-white" style={{ fontSize: "0.75rem" }} />
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? "#e63946" : error ? "#e63946" : "#dde"}`,
              borderRadius: "14px",
              padding: "20px 24px",
              background: isDragging ? "rgba(230,57,70,0.04)" : "#fafafa",
              cursor: uploading ? "not-allowed" : "pointer",
              textAlign: "center",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px", opacity: 0.6 }}>
              {uploading ? "⏳" : isDragging ? "📂" : "📷"}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#333",
                marginBottom: "4px",
              }}
            >
              {uploading
                ? "Uploading…"
                : isDragging
                ? "Drop your photo here"
                : "Click to upload or drag & drop"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#999" }}>
              JPG, PNG, WebP, GIF — max 5 MB
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleInputChange}
            disabled={uploading}
          />

          {/* Upload button */}
          <button
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
            className="btn w-100 fw-bold mt-3"
            style={{
              background: uploading
                ? "#ccc"
                : "linear-gradient(135deg, #e63946, #c1121f)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "11px",
              fontSize: "0.88rem",
              transition: "all 0.2s",
            }}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Uploading photo…
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload me-2" />
                Choose Photo from Device
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div
              className="d-flex align-items-center gap-2 mt-2"
              style={{
                background: "#fff5f5",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.8rem",
                color: "#dc2626",
              }}
            >
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="d-flex align-items-center gap-2 mt-2"
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.8rem",
                color: "#16a34a",
              }}
            >
              <i className="bi bi-check-circle-fill" />
              Photo updated successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
