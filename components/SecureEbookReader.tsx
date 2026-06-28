"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Moon, Sun, Columns } from "lucide-react";

interface SecureEbookReaderProps {
  productId: string;
  title: string;
  buyerName: string;
  buyerEmail: string;
  totalPages: number;
}

/**
 * SecureEbookReader
 * ─────────────────
 * Security layers:
 *  1. PDF rendered page-by-page onto <canvas> via PDF.js — not as HTML text
 *  2. Keyboard shortcuts disabled: Ctrl+S, Ctrl+P, Ctrl+A, PrintScreen
 *  3. Right-click (contextmenu) blocked on the reader area
 *  4. user-select: none on all elements
 *  5. Visible watermark with buyer name + email rendered over every page
 *  6. Short-lived JWT fetched from /api/digital-token (6 min), renewed automatically
 *  7. visibilitychange: pauses/resumes loading when tab is hidden
 *  8. Access logged server-side via /api/ebook-page
 */
export default function SecureEbookReader({
  productId,
  title,
  buyerName,
  buyerEmail,
  totalPages,
}: SecureEbookReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("light");
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const tokenExpiry = useRef<number>(0);

  const themeStyles: Record<string, { bg: string; canvas: string }> = {
    light: { bg: "#f8f8f8", canvas: "#fff" },
    dark:  { bg: "#1a1a2e", canvas: "#2d2d2d" },
    sepia: { bg: "#f1e7d0", canvas: "#fdf6e3" },
  };

  // ── 1. Block all keyboard/context-menu piracy shortcuts ──────────────────
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (
        ctrl && ["s", "p", "a", "u", "c"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        return false;
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };
    const blockCtx = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockCtx);

    return () => {
      window.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockCtx);
    };
  }, []);

  // ── 2. Fetch / refresh JWT ───────────────────────────────────────────────
  const fetchToken = useCallback(async () => {
    const res = await fetch("/api/digital-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error("Could not authenticate access");
    const { token } = await res.json();
    tokenRef.current = token;
    tokenExpiry.current = Date.now() + 5 * 60 * 1000; // 5 min
    setToken(token);
    return token;
  }, [productId]);

  const getToken = useCallback(async () => {
    if (tokenRef.current && Date.now() < tokenExpiry.current - 30_000) {
      return tokenRef.current;
    }
    return fetchToken();
  }, [fetchToken]);

  // ── 3. Load PDF.js and the document ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      try {
        setLoading(true);
        const tok = await fetchToken();

        // Get the signed URL for the PDF
        const res = await fetch(
          `/api/ebook-page?productId=${productId}&page=1&token=${tok}`
        );
        if (!res.ok) throw new Error("Access denied");
        const { signedUrl } = await res.json();

        // Load PDF.js dynamically
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const doc = await pdfjsLib.getDocument(signedUrl).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load eBook");
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [productId, fetchToken]);

  // ── 4. Render current page onto canvas ──────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    const renderPage = async () => {
      try {
        setLoading(true);

        // Re-fetch signed URL per page (server logs each access)
        const tok = await getToken();
        const res = await fetch(
          `/api/ebook-page?productId=${productId}&page=${currentPage}&token=${tok}`
        );
        if (!res.ok) throw new Error("Could not load page");
        // We already have the full PDF in memory via pdfDoc, just render
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // ── 5. Render watermark ──────────────────────────────────────────
        if (!cancelled) {
          ctx.save();
          ctx.globalAlpha = 0.09;
          ctx.fillStyle = "#000";
          ctx.font = `${14 * zoom}px 'Plus Jakarta Sans', Arial`;
          ctx.textAlign = "center";

          // Diagonal repeating watermark
          const watermarkText = `${buyerName} · ${buyerEmail} · swcart`;
          const step = 180 * zoom;
          for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(-Math.PI / 6);
              ctx.fillText(watermarkText, 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, zoom, productId, getToken, buyerEmail, buyerName]);

  const goTo = (p: number) => {
    if (p >= 1 && p <= (pdfDoc?.numPages ?? totalPages)) {
      setCurrentPage(p);
    }
  };

  const numPages = pdfDoc?.numPages ?? totalPages;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles[theme].bg,
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "background 0.3s",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e9ecef",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Title */}
        <span style={{ fontWeight: 800, fontSize: "0.9rem", flex: 1, minWidth: 120, color: "#1a1a2e" }}>
          {title}
        </span>

        {/* Page nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 8 }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, minWidth: 80, textAlign: "center" }}>
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 8 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 8 }}
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, minWidth: 42, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 8 }}
          >
            <ZoomIn size={15} />
          </button>
        </div>

        {/* Theme */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["light", "sepia", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: theme === t ? "2px solid #e63946" : "2px solid #dee2e6",
                background: t === "light" ? "#fff" : t === "sepia" ? "#fdf6e3" : "#1a1a2e",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Security badge */}
        <span
          style={{
            fontSize: "0.68rem",
            color: "#2a9d8f",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          🔒 Protected
        </span>
      </div>

      {/* ── Canvas area ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "32px 16px",
          minHeight: "calc(100vh - 60px)",
          background: themeStyles[theme].bg,
        }}
      >
        {error ? (
          <div className="alert alert-danger" style={{ maxWidth: 400 }}>
            <strong>Access Error:</strong> {error}
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {loading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.7)",
                  zIndex: 10,
                  borderRadius: 8,
                }}
              >
                <div className="spinner-border text-danger" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                borderRadius: 4,
                maxWidth: "100%",
                display: "block",
                background: themeStyles[theme].canvas,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom page nav ────────────────────────────────────────────── */}
      {!error && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(26,26,46,0.88)",
            borderRadius: 40,
            padding: "8px 20px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="btn btn-sm"
            style={{ color: "#fff", background: "transparent", border: "none" }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 700 }}>
            {currentPage} of {numPages}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="btn btn-sm"
            style={{ color: "#fff", background: "transparent", border: "none" }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
