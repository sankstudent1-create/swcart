// components/ReferralLink.tsx
"use client";

import { useEffect, useState } from "react";
import { generateAffiliateLink, getAffiliateLink } from "@/app/actions/affiliate";

export default function ReferralLink() {
  const [link, setLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch existing link on mount
  useEffect(() => {
    (async () => {
      const res = await getAffiliateLink();
      if (res.link) setLink(res.link);
      setLoading(false);
    })();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await generateAffiliateLink();
    if (res.link) setLink(res.link);
    setLoading(false);
  };

  const copyToClipboard = async () => {
    if (link) await navigator.clipboard.writeText(link);
  };

  return (
    <div className="glass-panel p-4 rounded-3 shadow-sm">
      <h5 className="fw-bold mb-3">Your Referral Link</h5>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : link ? (
        <div className="d-flex align-items-center gap-2">
          <input
            type="text"
            readOnly
            className="form-control flex-grow-1"
            value={link}
          />
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={copyToClipboard}
          >
            Copy
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
        >
          Generate Referral Link
        </button>
      )}
    </div>
  );
}
