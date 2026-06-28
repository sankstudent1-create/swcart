"use client";

import { useEffect, useState, useTransition } from "react";
import {
  generateAffiliateLink,
  getAffiliateLink,
  getReferralStats,
} from "@/app/actions/affiliate";

interface ReferralStats {
  link?: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalClicks: number;
  totalEarned: number;
  referredUsers: {
    name: string;
    email: string;
    joinedAt: Date;
    status: string;
    hasOrdered: boolean;
  }[];
}

export default function ReferralLink() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchStats = async () => {
    const data = await getReferralStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleGenerate = () => {
    startTransition(async () => {
      await generateAffiliateLink();
      await fetchStats();
    });
  };

  const copyToClipboard = async () => {
    if (stats?.link) {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareViaWhatsApp = () => {
    if (!stats?.link) return;
    const text = encodeURIComponent(
      `🛍️ Join me on Swcart and get amazing deals! Sign up using my link: ${stats.link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaTelegram = () => {
    if (!stats?.link) return;
    const text = encodeURIComponent(
      `🛍️ Join Swcart using my referral link and start shopping!`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(stats.link)}&text=${text}`,
      "_blank"
    );
  };

  const shareViaEmail = () => {
    if (!stats?.link) return;
    const subject = encodeURIComponent("Join Swcart — My Referral Link");
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to share Swcart with you — it's a great marketplace. Use my referral link to sign up:\n\n${stats.link}\n\nEnjoy!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? "140px" : "80px",
              borderRadius: "16px",
              background:
                "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4 font-jakarta">

      {/* How it works banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          borderRadius: "20px",
          padding: "24px 28px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "rgba(230,57,70,0.2)",
            filter: "blur(40px)",
          }}
        />
        <div className="position-relative">
          <h5 className="fw-bolder mb-1" style={{ fontSize: "1.15rem" }}>
            <i className="bi bi-gift-fill me-2 text-danger" />
            Earn ₹100 per referral!
          </h5>
          <p className="mb-3" style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
            Share your unique link. When a friend signs up and places their
            first order, ₹100 gets credited to your wallet automatically.
          </p>
          <div className="d-flex flex-wrap gap-3">
            {[
              { icon: "bi-share-fill", label: "Share Link", step: "1" },
              { icon: "bi-person-plus-fill", label: "Friend Signs Up", step: "2" },
              { icon: "bi-bag-check-fill", label: "First Order", step: "3" },
              { icon: "bi-wallet2", label: "₹100 Credited", step: "4" },
            ].map((s) => (
              <div
                key={s.step}
                className="d-flex align-items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#e63946",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {s.step}
                </span>
                <i className={`bi ${s.icon} text-warning`} />
                <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="row g-3">
          {[
            {
              label: "Total Invited",
              value: stats.totalReferrals,
              icon: "bi-people-fill",
              color: "#4361ee",
              bg: "rgba(67,97,238,0.1)",
            },
            {
              label: "Converted",
              value: stats.completedReferrals,
              icon: "bi-check-circle-fill",
              color: "#2ecc71",
              bg: "rgba(46,204,113,0.1)",
            },
            {
              label: "Link Clicks",
              value: stats.totalClicks,
              icon: "bi-cursor-fill",
              color: "#f39c12",
              bg: "rgba(243,156,18,0.1)",
            },
            {
              label: "Total Earned",
              value: `₹${stats.totalEarned}`,
              icon: "bi-wallet2",
              color: "#e63946",
              bg: "rgba(230,57,70,0.1)",
            },
          ].map((s) => (
            <div key={s.label} className="col-6 col-md-3">
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: s.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: "1rem" }} />
                </div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#1a1a2e",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: "20px",
          padding: "24px",
        }}
      >
        <h6 className="fw-bold mb-3 text-dark">
          <i className="bi bi-link-45deg me-2 text-danger" />
          Your Referral Link
        </h6>

        {stats?.link ? (
          <>
            <div
              className="d-flex align-items-center gap-2 mb-3"
              style={{
                background: "#f8f9fa",
                border: "1.5px solid #e9ecef",
                borderRadius: "14px",
                padding: "12px 16px",
              }}
            >
              <i className="bi bi-link text-muted" />
              <span
                className="flex-grow-1 text-truncate font-monospace"
                style={{ fontSize: "0.85rem", color: "#333" }}
              >
                {stats.link}
              </span>
              <button
                onClick={copyToClipboard}
                className="btn btn-sm fw-bold px-3"
                style={{
                  background: copied ? "#2ecc71" : "#e63946",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "0.8rem",
                  flexShrink: 0,
                  transition: "background 0.3s",
                }}
              >
                {copied ? (
                  <>
                    <i className="bi bi-check2 me-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <i className="bi bi-clipboard me-1" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Share buttons */}
            <div className="d-flex flex-wrap gap-2">
              <button
                onClick={shareViaWhatsApp}
                className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                style={{
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                }}
              >
                <i className="bi bi-whatsapp" />
                WhatsApp
              </button>
              <button
                onClick={shareViaTelegram}
                className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                style={{
                  background: "#0088cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                }}
              >
                <i className="bi bi-telegram" />
                Telegram
              </button>
              <button
                onClick={shareViaEmail}
                className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                style={{
                  background: "#f0f0f0",
                  color: "#333",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                }}
              >
                <i className="bi bi-envelope-fill" />
                Email
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-3">
            <p className="text-muted small mb-3">
              Generate your unique referral link and start earning!
            </p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="btn fw-bold px-4"
              style={{
                background: "linear-gradient(135deg, #e63946, #c1121f)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "12px 24px",
              }}
            >
              {isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Generating…
                </>
              ) : (
                <>
                  <i className="bi bi-magic me-2" />
                  Generate My Referral Link
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Referred users table */}
      {stats && stats.referredUsers.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <h6 className="fw-bold mb-3 text-dark">
            <i className="bi bi-people-fill me-2 text-danger" />
            People You Referred ({stats.totalReferrals})
          </h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th className="border-0 fw-semibold text-muted small py-3">Name</th>
                  <th className="border-0 fw-semibold text-muted small py-3">Joined</th>
                  <th className="border-0 fw-semibold text-muted small py-3">Ordered?</th>
                  <th className="border-0 fw-semibold text-muted small py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.referredUsers.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#e63946",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{u.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted small">
                      {new Date(u.joinedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {u.hasOrdered ? (
                        <span className="text-success fw-semibold small">
                          <i className="bi bi-check-circle-fill me-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-muted small">
                          <i className="bi bi-hourglass-split me-1" />
                          Not yet
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge rounded-pill px-3 py-2"
                        style={{
                          background:
                            u.status === "COMPLETED"
                              ? "rgba(46,204,113,0.15)"
                              : "rgba(243,156,18,0.15)",
                          color: u.status === "COMPLETED" ? "#1a8a4a" : "#a0600a",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {u.status === "COMPLETED" ? "✅ Rewarded" : "⏳ Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats && stats.link && stats.referredUsers.length === 0 && (
        <div
          className="text-center py-4"
          style={{
            background: "#fff",
            border: "1px dashed #dde",
            borderRadius: "20px",
            color: "#888",
          }}
        >
          <i className="bi bi-people" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
          <div className="mt-2 fw-semibold">No referrals yet</div>
          <div className="small mt-1">Share your link above and start earning!</div>
        </div>
      )}
    </div>
  );
}
