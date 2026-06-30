"use client";

import React, { useState } from "react";
import { executeMacroAction } from "../actions";
import { toast } from "sonner";

export default function LogisticsCommand({ initialWarehouses, initialVehicles, initialAgents }: any) {
  const [activeTab, setActiveTab] = useState("hubs");

  return (
    <div className="rounded-4 overflow-hidden border border-secondary border-opacity-25 bg-dark bg-opacity-50">
      <div className="d-flex border-bottom border-secondary border-opacity-25 bg-black bg-opacity-25">
        <button 
          className={`btn btn-link text-decoration-none rounded-0 px-4 py-3 fw-bold ${activeTab === 'hubs' ? 'text-white border-bottom border-warning border-3' : 'text-muted'}`}
          onClick={() => setActiveTab('hubs')}
        >
          Warehouses & Hubs
        </button>
        <button 
          className={`btn btn-link text-decoration-none rounded-0 px-4 py-3 fw-bold ${activeTab === 'fleet' ? 'text-white border-bottom border-warning border-3' : 'text-muted'}`}
          onClick={() => setActiveTab('fleet')}
        >
          Delivery Fleet
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'hubs' && (
          <div className="row g-4">
            {initialWarehouses.map((w: any) => (
              <div key={w.id} className="col-md-6">
                <div className="p-4 rounded-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold text-white mb-1"><i className="bi bi-building text-warning me-2"></i>{w.name}</h5>
                      <div className="text-muted small"><i className="bi bi-geo-alt-fill me-1"></i> {w.location}</div>
                    </div>
                    <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25">
                      {w.pincodes.length} Service Areas
                    </span>
                  </div>
                  
                  <div className="d-flex gap-4 mt-4 text-muted small">
                    <div>
                      <div className="fw-bolder text-white fs-4 lh-1">{w._count.inventory}</div>
                      <div className="text-uppercase tracking-wide mt-1" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>Inventory Items</div>
                    </div>
                    <div>
                      <div className="fw-bolder text-white fs-4 lh-1">{w.staff?.length || 0}</div>
                      <div className="text-uppercase tracking-wide mt-1" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>Managers</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {initialWarehouses.length === 0 && <div className="text-muted text-center py-5">No warehouses found.</div>}
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
              <thead>
                <tr>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3 ps-2" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Agent</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Assigned Hub</th>
                  <th className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {initialAgents.map((a: any) => (
                  <tr key={a.userId}>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle ps-2">
                      <div className="fw-bold text-white">{a.user?.name}</div>
                      <div className="text-muted small">{a.user?.phone || 'No phone'}</div>
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      {a.warehouse ? (
                        <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25">{a.warehouse.name}</span>
                      ) : (
                        <span className="text-muted small">Unassigned</span>
                      )}
                    </td>
                    <td className="border-bottom border-secondary border-opacity-10 align-middle">
                      {a.vehicle ? (
                        <div>
                          <div className="fw-semibold text-white small">{a.vehicle.licensePlate}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>{a.vehicle.type} (Cap: {a.vehicle.capacity})</div>
                        </div>
                      ) : (
                        <span className="text-muted small">No vehicle</span>
                      )}
                    </td>
                  </tr>
                ))}
                {initialAgents.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-5 text-muted">No delivery agents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
