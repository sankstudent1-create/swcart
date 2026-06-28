"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize,
  SkipForward, SkipBack, Settings, RefreshCw
} from "lucide-react";

interface SecureVideoPlayerProps {
  lessonId: string;
  productId: string;
  buyerEmail: string;
  onProgress?: (watchedSecs: number, completed: boolean) => void;
}

/**
 * SecureVideoPlayer
 * ──────────────────
 * Security layers:
 *  1. HLS-ready — plays Supabase-stored video via short-lived (90s) signed URLs
 *  2. Right-click disabled on video
 *  3. Custom controls only — no native download button (controlsList="nodownload")
 *  4. Visible user watermark overlaid on the video
 *  5. Auto-refreshes signed URL 20s before expiry
 *  6. Reports watch progress every 10s to /api/lesson-progress
 *  7. visibility API — pauses when tab is hidden
 */
export default function SecureVideoPlayer({
  lessonId,
  productId,
  buyerEmail,
  onProgress,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const signedUrlExpiry = useRef<number>(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const reportedCompleted = useRef(false);

  // ── Fetch signed URL ──────────────────────────────────────────────────
  const fetchSignedUrl = useCallback(async () => {
    const res = await fetch("/api/video-signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (!res.ok) throw new Error("Access denied");
    const { signedUrl, expiresIn } = await res.json();
    signedUrlExpiry.current = Date.now() + expiresIn * 1000;
    return signedUrl as string;
  }, [lessonId]);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSignedUrl()
      .then((url) => { if (!cancelled) { setSrc(url); setLoading(false); } })
      .catch((e) => { if (!cancelled) setError(e.message); });

    return () => { cancelled = true; };
  }, [lessonId, fetchSignedUrl]);

  // ── Auto-refresh signed URL before expiry ─────────────────────────────
  useEffect(() => {
    const check = setInterval(async () => {
      if (signedUrlExpiry.current - Date.now() < 20_000) {
        try {
          const url = await fetchSignedUrl();
          // Smoothly swap src without reloading position
          const v = videoRef.current;
          if (v) {
            const t = v.currentTime;
            const wasPlaying = !v.paused;
            v.src = url;
            v.currentTime = t;
            if (wasPlaying) v.play();
            setSrc(url);
          }
        } catch { /* non-fatal */ }
      }
    }, 15_000);
    return () => clearInterval(check);
  }, [fetchSignedUrl]);

  // ── Pause when tab hidden ─────────────────────────────────────────────
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && videoRef.current) videoRef.current.pause();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ── Disable right-click ───────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const block = (e: MouseEvent) => e.preventDefault();
    v.addEventListener("contextmenu", block);
    return () => v.removeEventListener("contextmenu", block);
  }, [src]);

  // ── Progress reporting (every 10s) ────────────────────────────────────
  useEffect(() => {
    progressInterval.current = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      const secs = Math.round(v.currentTime);
      const dur = Math.round(v.duration || 0);
      const completed = !reportedCompleted.current && dur > 0 && secs / dur >= 0.9;

      if (completed) reportedCompleted.current = true;

      fetch("/api/lesson-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, watchedSecs: secs, completed }),
      }).catch(() => {});

      onProgress?.(secs, completed);
    }, 10_000);

    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [lessonId, onProgress]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const changeSpeed = (s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
    setShowSettings(false);
  };

  const fullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2">
        <RefreshCw size={18} />
        <span>Video unavailable: {error}</span>
        <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => {
          setError(null);
          fetchSignedUrl().then(setSrc).catch((e) => setError(e.message));
        }}>
          Retry
        </button>
      </div>
    );
  }

  const isYouTube = src?.includes("youtube.com") || src?.includes("youtu.be");
  const getYouTubeEmbed = (url: string) => {
    let id = "";
    if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1]?.split("?")[0];
    else if (url.includes("v=")) id = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`;
  };

  const isVimeo = src?.includes("vimeo.com");
  const getVimeoEmbed = (url: string) => {
    const id = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0];
    return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`;
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", background: "#000", borderRadius: 12, overflow: "hidden" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video */}
      {loading ? (
        <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
          <div className="spinner-border text-danger" />
        </div>
      ) : isYouTube && src ? (
        <iframe
          src={getYouTubeEmbed(src)}
          style={{ width: "100%", height: 420, display: "block", border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : isVimeo && src ? (
        <iframe
          src={getVimeoEmbed(src)}
          style={{ width: "100%", height: 420, display: "block", border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={src ?? undefined}
          style={{ width: "100%", display: "block", maxHeight: 480 }}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          playsInline
          onTimeUpdate={(e) => setCurTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={toggle}
        />
      )}

      {/* Watermark overlay */}
      {!loading && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 44,
            pointerEvents: "none",
            overflow: "hidden",
            userSelect: "none",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                top: `${15 + i * 14}%`,
                left: `${5 + (i % 3) * 30}%`,
                color: "rgba(255,255,255,0.12)",
                fontSize: "0.72rem",
                fontWeight: 700,
                transform: "rotate(-20deg)",
                whiteSpace: "nowrap",
                fontFamily: "'Plus Jakarta Sans',system-ui",
              }}
            >
              {buyerEmail} · swcart
            </span>
          ))}
        </div>
      )}

      {/* Controls bar (only for native video) */}
      {!loading && !isYouTube && !isVimeo && (
        <div
          style={{
            background: "linear-gradient(transparent,rgba(0,0,0,0.85))",
            padding: "8px 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={seek}
            style={{
              height: 4, background: "rgba(255,255,255,0.25)",
              borderRadius: 4, cursor: "pointer", position: "relative",
            }}
          >
            <div
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                height: "100%", background: "#e63946", borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>

          {/* Control buttons row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={toggle} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}>
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
              style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
              style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}
            >
              <SkipForward size={18} />
            </button>

            {/* Volume */}
            <button
              onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
              style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Time */}
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.78rem", marginLeft: 4 }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Speed */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{ color: "#fff", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}
              >
                {speed}x
              </button>
              {showSettings && (
                <div
                  style={{
                    position: "absolute", bottom: 30, right: 0,
                    background: "rgba(0,0,0,0.9)", borderRadius: 10,
                    padding: "6px 0", minWidth: 80, zIndex: 10,
                  }}
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      style={{
                        display: "block", width: "100%", padding: "5px 14px",
                        background: speed === s ? "rgba(230,57,70,0.3)" : "none",
                        color: "#fff", border: "none", cursor: "pointer",
                        fontSize: "0.8rem", textAlign: "left",
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={fullscreen} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}>
              <Maximize size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
