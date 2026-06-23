"use client";

import React, { useState, useTransition } from "react";
import { assignAgentToOrderAction, receivePackageAction, forwardPackageAction } from "@/app/actions/warehouse";
import { toast } from "sonner";

export default function WarehouseDashboard({ warehouse, inboundOrders, atHubOrders, localAgents, allWarehouses }: any) {
  const [isPending, startTransition] = useTransition();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ orderId: "", deliveryPersonId: "" });

  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardForm, setForwardForm] = useState({ orderId: "", targetWarehouseId: "" });

  const handleReceive = (orderId: string) => {
    startTransition(async () => {
      const res = await receivePackageAction(orderId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.deliveryPersonId) return toast.error("Select an agent");
    startTransition(async () => {
      const res = await assignAgentToOrderAction(assignForm.orderId, assignForm.deliveryPersonId);
      if (res.success) { toast.success(res.message); setShowAssignModal(false); }
      else toast.error(res.message);
    });
  };

  const handleForward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardForm.targetWarehouseId) return toast.error("Select a destination hub");
    startTransition(async () => {
      const res = await forwardPackageAction(forwardForm.orderId, forwardForm.targetWarehouseId);
      if (res.success) { toast.success(res.message); setShowForwardModal(false); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="container-fluid max-w-7xl mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">{warehouse.name}</h2>
          <div className="text-muted small">
            <i className="bi bi-geo-alt me-1"></i> {warehouse.location} &bull; 
            <span className="ms-1 fw-bold">Pincodes:</span> {warehouse.pincodes?.join(', ') || 'Global'}
          </div>
        </div>
        <div className="d-flex gap-3">
          <div className="bg-white p-3 rounded-4 shadow-sm border text-center">
            <div className="text-muted small fw-bold text-uppercase mb-1">Local Agents</div>
            <div className="fs-4 fw-bold">{localAgents.length}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Inbound Freight */}
        <div className="col-12 col-xl-6">
          <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
            <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-truck me-2 text-danger"></i> Inbound Freight</span>
              <span className="badge bg-danger rounded-pill">{inboundOrders.length}</span>
            </h5>
            <div className="d-flex flex-column gap-3">
              {inboundOrders.map((o: any) => (
                <div key={o.id} className="p-3 border rounded-3 d-flex justify-content-between align-items-center bg-light">
                  <div>
                    <div className="font-monospace fw-bold mb-1">{o.trackingNumber}</div>
                    <div className="small text-muted">From: Origin &bull; Dest: {o.shippingAddress?.postalCode}</div>
                  </div>
                  <button className="btn btn-sm btn-dark rounded-pill fw-bold px-3 shadow-sm" onClick={() => handleReceive(o.id)} disabled={isPending}>
                    <i className="bi bi-upc-scan me-1"></i> Receive / Scan
                  </button>
                </div>
              ))}
              {inboundOrders.length === 0 && <div className="text-muted text-center py-4 small">No inbound freight at this time.</div>}
            </div>
          </div>
        </div>

        {/* Ready for Sortation */}
        <div className="col-12 col-xl-6">
          <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
            <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-box-seam me-2 text-warning"></i> Ready for Sortation</span>
              <span className="badge bg-warning text-dark rounded-pill">{atHubOrders.length}</span>
            </h5>
            <div className="d-flex flex-column gap-3">
              {atHubOrders.map((o: any) => {
                const destPin = o.shippingAddress?.postalCode;
                const isLocal = warehouse.pincodes?.includes(destPin) || !warehouse.pincodes?.length;

                return (
                  <div key={o.id} className="p-3 border rounded-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="font-monospace fw-bold mb-1">{o.trackingNumber}</div>
                      <div className="small text-muted">{o.shippingAddress?.street}, {o.shippingAddress?.city} - <strong>{destPin}</strong></div>
                    </div>
                    {isLocal ? (
                      <button className="btn btn-sm btn-success rounded-pill fw-bold px-3 shadow-sm" onClick={() => { setAssignForm({ orderId: o.id, deliveryPersonId: "" }); setShowAssignModal(true); }}>
                        Assign Local Agent
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline-danger rounded-pill fw-bold px-3 shadow-sm" onClick={() => { setForwardForm({ orderId: o.id, targetWarehouseId: "" }); setShowForwardModal(true); }}>
                        Forward to Hub <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    )}
                  </div>
                );
              })}
              {atHubOrders.length === 0 && <div className="text-muted text-center py-4 small">Sortation queue is empty.</div>}
            </div>
          </div>
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
                  <button type="submit" className="btn btn-success rounded-pill px-4 shadow-sm fw-bold" disabled={isPending}>{isPending ? "Assigning..." : "Assign & Dispatch"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Forward to Next Hub</h5>
                <button type="button" className="btn-close" onClick={() => setShowForwardModal(false)}></button>
              </div>
              <form onSubmit={handleForward}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div className="alert alert-warning small border-0 bg-warning bg-opacity-10 text-dark">
                    This package's destination pincode is outside your local service area. Please select the next regional hub to route this package towards its destination.
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select Destination Hub</label>
                    <select className="form-select" value={forwardForm.targetWarehouseId} onChange={e => setForwardForm({...forwardForm, targetWarehouseId: e.target.value})} required>
                      <option value="">-- Choose Hub --</option>
                      {allWarehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.location}) - Services {w.pincodes?.length || 0} pincodes</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowForwardModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger rounded-pill px-4 shadow-sm fw-bold" disabled={isPending}>{isPending ? "Routing..." : "Load onto Inter-Hub Transit"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
