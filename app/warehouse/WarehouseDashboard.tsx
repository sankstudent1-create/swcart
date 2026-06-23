"use client";

import React, { useState, useTransition } from "react";
import { assignAgentToOrderAction } from "@/app/actions/warehouse";
import { toast } from "sonner";

export default function WarehouseDashboard({ warehouse, orders, localAgents }: any) {
  const [isPending, startTransition] = useTransition();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ orderId: "", deliveryPersonId: "" });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.deliveryPersonId) return toast.error("Select an agent");
    startTransition(async () => {
      const res = await assignAgentToOrderAction(assignForm.orderId, assignForm.deliveryPersonId);
      if (res.success) { toast.success(res.message); setShowAssignModal(false); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="container-fluid max-w-7xl mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">{warehouse.name}</h2>
          <div className="text-muted small"><i className="bi bi-geo-alt me-1"></i> {warehouse.location}</div>
        </div>
        <div className="d-flex gap-3">
          <div className="bg-white p-3 rounded-4 shadow-sm border text-center">
            <div className="text-muted small fw-bold text-uppercase mb-1">Local Agents</div>
            <div className="fs-4 fw-bold">{localAgents.length}</div>
          </div>
          <div className="bg-white p-3 rounded-4 shadow-sm border text-center">
            <div className="text-muted small fw-bold text-uppercase mb-1">Pending Pkgs</div>
            <div className="fs-4 fw-bold text-danger">{orders.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
        <h5 className="fw-bold mb-4">Inbound Packages Awaiting Dispatch</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light small text-uppercase text-muted">
              <tr>
                <th>Tracking #</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="fw-bold font-monospace">{o.trackingNumber}</td>
                  <td className="small">{o.shippingAddress?.street}, {o.shippingAddress?.city}</td>
                  <td>{o.items.length} items</td>
                  <td><span className="badge bg-warning text-dark">Processing at Hub</span></td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-dark rounded-pill px-3 fw-bold shadow-sm" onClick={() => { setAssignForm({ orderId: o.id, deliveryPersonId: "" }); setShowAssignModal(true); }}>
                      Assign Local Agent <i className="bi bi-person-check ms-1"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-muted">All caught up! No packages waiting.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Assign Local Delivery Agent</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <form onSubmit={handleAssign}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select Agent</label>
                    <select className="form-select" value={assignForm.deliveryPersonId} onChange={e => setAssignForm({...assignForm, deliveryPersonId: e.target.value})} required>
                      <option value="">-- Choose Local Agent --</option>
                      {localAgents.map((a: any) => <option key={a.id} value={a.id}>{a.user.name} ({a.orders.length} active pkgs)</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowAssignModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger rounded-pill px-4 shadow-sm fw-bold" disabled={isPending}>{isPending ? "Assigning..." : "Assign & Dispatch"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
