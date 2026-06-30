"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { executeMacroAction } from "./actions";

export default function MacroActionsPanel() {
  const [isPending, startTransition] = useTransition();
  const [macroInput, setMacroInput] = useState("");
  const [activeMacro, setActiveMacro] = useState<string | null>(null);

  const macros = [
    {
      id: "WIPE_USER",
      title: "Total Identity Wipe",
      description: "Permanently delete a User, their Seller profile, all their Products, and Orders simultaneously.",
      icon: "bi-person-x-fill",
      color: "#ff3b30",
      inputLabel: "User ID to wipe"
    },
    {
      id: "FORCE_DELIVER",
      title: "Force Complete Order",
      description: "Force an order to 'DELIVERED', update seller tracking history, and trigger payout logic immediately.",
      icon: "bi-box-seam-fill",
      color: "#34c759",
      inputLabel: "Global Order ID"
    },
    {
      id: "ARCHIVE_SELLER",
      title: "Suspend Seller & Products",
      description: "Set a Seller to suspended status and automatically unpublish all of their active products across the platform.",
      icon: "bi-shop-window",
      color: "#ff9500",
      inputLabel: "Seller ID"
    }
  ];

  const handleExecute = (macroId: string) => {
    if (!macroInput.trim()) {
      toast.error("Please provide the required ID.");
      return;
    }

    if (!confirm(`Are you sure you want to execute macro [${macroId}] on ID: ${macroInput}? This action is irreversible.`)) {
      return;
    }

    startTransition(async () => {
      const res = await executeMacroAction(macroId, macroInput);
      if (res.success) {
        toast.success(res.message);
        setMacroInput("");
        setActiveMacro(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="rounded-4 p-4 h-100" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bolder text-white mb-0 d-flex align-items-center">
          <i className="bi bi-terminal-fill text-info me-2"></i> Joint-Table Macros
        </h5>
        <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 px-2 py-1 rounded-pill" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>DANGER ZONE</span>
      </div>

      <div className="d-flex flex-column gap-3">
        {macros.map(m => (
          <div key={m.id} className="p-3 rounded-4" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, background: `${m.color}20`, color: m.color }}>
                  <i className={`bi ${m.icon} fs-4`}></i>
                </div>
                <div>
                  <div className="fw-bold text-white fs-6">{m.title}</div>
                  <div className="text-muted small" style={{ fontSize: "0.8rem", maxWidth: "400px" }}>{m.description}</div>
                </div>
              </div>
              
              {activeMacro === m.id ? (
                <div className="d-flex flex-column gap-2" style={{ minWidth: "250px" }}>
                  <input 
                    type="text" 
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    placeholder={m.inputLabel}
                    value={macroInput}
                    onChange={e => setMacroInput(e.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary w-50" onClick={() => setActiveMacro(null)} disabled={isPending}>Cancel</button>
                    <button className="btn btn-sm text-white w-50 fw-bold" style={{ background: m.color }} onClick={() => handleExecute(m.id)} disabled={isPending}>
                      {isPending ? <span className="spinner-border spinner-border-sm"></span> : "Execute"}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn-sm rounded-pill px-4 fw-semibold text-white" 
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                  onClick={() => { setActiveMacro(m.id); setMacroInput(""); }}
                >
                  Configure
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
