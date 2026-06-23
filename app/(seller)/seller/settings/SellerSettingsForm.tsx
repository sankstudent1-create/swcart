"use client";

import React, { useState, useTransition } from "react";
import { updateSellerSettingsAction } from "@/app/actions/seller";
import { toast } from "sonner";

interface SellerProfile {
  id: string;
  companyName: string;
  gstNumber: string | null;
  bankDetails: any;
  isVerified: boolean;
}

interface SellerSettingsFormProps {
  seller: SellerProfile;
}

export default function SellerSettingsForm({ seller }: SellerSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const [companyName, setCompanyName] = useState(seller.companyName);
  const [gstNumber, setGstNumber] = useState(seller.gstNumber || "");
  const [panNumber, setPanNumber] = useState("");
  const [bankAccount, setBankAccount] = useState(seller.bankDetails?.bankAccount || "");
  const [bankIfsc, setBankIfsc] = useState(seller.bankDetails?.bankIfsc || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    startTransition(async () => {
      const res = await updateSellerSettingsAction(
        companyName,
        gstNumber || null,
        { bankAccount, bankIfsc }
      );
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <div className="mb-4 text-white">
        <h2 className="fw-bold mb-1 font-family-poppins" style={{ letterSpacing: "-1px" }}>Store Profile</h2>
        <p className="text-muted mb-0">Manage your business registrations, KYC, and bank accounts.</p>
      </div>

      <div className="bg-gray-800 p-4 p-md-5 rounded-4 border border-secondary border-opacity-25 text-white">
        {/* KYC Verification Status Banner */}
        <div className={`p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between ${seller.isVerified ? 'bg-success bg-opacity-10 border border-success border-opacity-25' : 'bg-warning bg-opacity-10 border border-warning border-opacity-25'}`}>
          <div>
            <div className="fw-bold fs-6">KYC Status</div>
            <div className="text-muted small">
              {seller.isVerified 
                ? "Your identity, GSTIN, and bank account details have been successfully verified." 
                : "Awaiting administrator approval. Upload your business certificates below."}
            </div>
          </div>
          <span className={`badge px-3 py-2 rounded-pill fw-bold ${seller.isVerified ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
            {seller.isVerified ? 'VERIFIED' : 'PENDING'}
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label text-muted small text-uppercase fw-bold mb-1">Company Registered Name</label>
            <input 
              type="text" 
              className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label text-muted small text-uppercase fw-bold mb-1">GSTIN Number (Optional)</label>
              <input 
                type="text" 
                className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value)}
                placeholder="e.g. 27AAAAA1111A1Z1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted small text-uppercase fw-bold mb-1">PAN Card Number</label>
              <input 
                type="text" 
                className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
                value={panNumber}
                onChange={e => setPanNumber(e.target.value)}
                placeholder="e.g. ABCDE1234F"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small text-uppercase fw-bold mb-1">Upload Registration Certificate (GST/PAN copy)</label>
            <input 
              type="file" 
              className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
              accept=".pdf,.png,.jpg,.jpeg"
            />
            <div className="form-text text-muted small mt-1">Accepted formats: PDF, PNG, JPEG. Max file size: 5MB.</div>
          </div>

          <hr className="my-4 border-secondary border-opacity-50" />
          <h5 className="fw-bold mb-3 text-white">Settlement Account</h5>

          <div className="mb-3">
            <label className="form-label text-muted small text-uppercase fw-bold mb-1">Bank Account Number</label>
            <input 
              type="text" 
              className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              placeholder="Enter bank account number"
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small text-uppercase fw-bold mb-1">IFSC Code</label>
            <input 
              type="text" 
              className="form-control bg-dark border-secondary text-white rounded-3 shadow-sm"
              value={bankIfsc}
              onChange={e => setBankIfsc(e.target.value)}
              placeholder="e.g. IFSC0001234"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-danger text-white rounded-pill px-5 py-2 fw-bold shadow-sm mt-2"
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
