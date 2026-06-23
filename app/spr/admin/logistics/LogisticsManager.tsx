"use client";

import React, { useState, useTransition } from "react";
import { createWarehouseAction, deleteWarehouseAction, createVehicleAction, deleteVehicleAction, assignDeliveryAgentAction, dispatchOrderAction, assignWarehouseStaffAction } from "@/app/actions/logistics";
import { toast } from "sonner";

export default function LogisticsManager({ warehouses, vehicles, deliveryAgents, users, orders }: any) {
  const [activeTab, setActiveTab] = useState("DISPATCH");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "" });

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ licensePlate: "", type: "Truck", capacity: 0 });

  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentForm, setAgentForm] = useState({ userId: "", vehicleId: "", warehouseId: "" });

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ orderId: "", assignedWarehouseId: "" });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ userId: "", warehouseId: "" });

  const handleWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createWarehouseAction(warehouseForm);
      if (res.success) { toast.success(res.message); setShowWarehouseModal(false); }
      else toast.error(res.message);
    });
  };

  const handleVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createVehicleAction(vehicleForm);
      if (res.success) { toast.success(res.message); setShowVehicleModal(false); }
      else toast.error(res.message);
    });
  };

  const handleAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentForm.userId) return toast.error("Select a user");
    startTransition(async () => {
      const res = await assignDeliveryAgentAction(agentForm.userId, agentForm.vehicleId || null, agentForm.warehouseId || null);
      if (res.success) { toast.success(res.message); setShowAgentModal(false); }
      else toast.error(res.message);
    });
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.assignedWarehouseId) return toast.error("Select a warehouse");
    startTransition(async () => {
      const res = await dispatchOrderAction(dispatchForm.orderId, dispatchForm.assignedWarehouseId);
      if (res.success) { toast.success(res.message); setShowDispatchModal(false); }
      else toast.error(res.message);
    });
  };

  const handleStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.userId || !staffForm.warehouseId) return toast.error("Select both user and warehouse");
    startTransition(async () => {
      const res = await assignWarehouseStaffAction(staffForm.userId, staffForm.warehouseId);
      if (res.success) { toast.success(res.message); setShowStaffModal(false); }
      else toast.error(res.message);
    });
  };

  const TABS = [
    { id: "DISPATCH", label: "Dispatch Hub", icon: "bi-send" },
    { id: "AGENTS", label: "Delivery Agents", icon: "bi-person-badge" },
    { id: "VEHICLES", label: "Fleet Vehicles", icon: "bi-truck" },
    { id: "WAREHOUSES", label: "Warehouses", icon: "bi-building" }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Logistics & Fleet Command</h2>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`btn rounded-pill px-4 fw-semibold ${activeTab === t.id ? "btn-dark shadow" : "btn-light"}`}
            style={{ border: activeTab !== t.id ? "1px solid #e9ecef" : "none" }}
          >
            <i className={`bi ${t.icon} me-2`}></i>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border-0">
        
        {/* --- DISPATCH HUB --- */}
        {activeTab === "DISPATCH" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Orders Pending Dispatch</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Destination</th>
                    <th>Items</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id}>
                      <td className="fw-bold font-monospace">#{o.id.slice(-8).toUpperCase()}</td>
                      <td>{o.user.name}</td>
                      <td className="small">{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                      <td>{o.items.length} items</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow-sm" onClick={() => { setDispatchForm({ orderId: o.id, assignedWarehouseId: "" }); setShowDispatchModal(true); }}>
                          Dispatch to Hub <i className="bi bi-arrow-right ms-1"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-muted">No pending orders to dispatch.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- AGENTS --- */}
        {activeTab === "AGENTS" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Delivery Agents</h5>
              <button className="btn btn-dark rounded-pill px-3 shadow-sm" onClick={() => setShowAgentModal(true)}>+ Add Agent</button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th>Agent Name</th>
                    <th>Email</th>
                    <th>Assigned Vehicle</th>
                    <th>Stationed Hub</th>
                    <th>Active Deliveries</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryAgents.map((a: any) => (
                    <tr key={a.id}>
                      <td className="fw-bold">{a.user.name}</td>
                      <td>{a.user.email}</td>
                      <td>{a.vehicleId ? <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3">Vehicle #{a.vehicleId.slice(-4)}</span> : <span className="text-muted small">None</span>}</td>
                      <td>{a.warehouse?.name || <span className="text-muted small">Floating</span>}</td>
                      <td><span className="fw-bold">{a.orders.length}</span> packages</td>
                    </tr>
                  ))}
                  {deliveryAgents.length === 0 && <tr><td colSpan={4} className="text-center py-5 text-muted">No agents assigned.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VEHICLES --- */}
        {activeTab === "VEHICLES" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Fleet Vehicles</h5>
              <button className="btn btn-dark rounded-pill px-3 shadow-sm" onClick={() => setShowVehicleModal(true)}>+ Add Vehicle</button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th>License Plate</th>
                    <th>Type</th>
                    <th>Capacity (kg)</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v: any) => (
                    <tr key={v.id}>
                      <td className="fw-bold font-monospace bg-light rounded-2 d-inline-block px-2 py-1 mt-2 border border-secondary border-opacity-25">{v.licensePlate}</td>
                      <td>{v.type}</td>
                      <td>{v.capacity}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => startTransition(async () => { const res = await deleteVehicleAction(v.id); if (res.success) toast.success(res.message); else toast.error(res.message); })}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && <tr><td colSpan={4} className="text-center py-5 text-muted">No vehicles registered.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- WAREHOUSES --- */}
        {activeTab === "WAREHOUSES" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Warehouses & Hubs</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-dark rounded-pill px-3 shadow-sm" onClick={() => setShowStaffModal(true)}>+ Assign Manager</button>
                <button className="btn btn-dark rounded-pill px-3 shadow-sm" onClick={() => setShowWarehouseModal(true)}>+ Add Hub</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th>Hub Name</th>
                    <th>Location</th>
                    <th>Managers</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w: any) => (
                    <tr key={w.id}>
                      <td className="fw-bold">{w.name}</td>
                      <td>{w.location}</td>
                      <td>{w.staff?.map((s: any) => <span key={s.id} className="badge bg-secondary me-1">{s.user.name}</span>) || "-"}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => startTransition(async () => { const res = await deleteWarehouseAction(w.id); if (res.success) toast.success(res.message); else toast.error(res.message); })}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {warehouses.length === 0 && <tr><td colSpan={3} className="text-center py-5 text-muted">No warehouses registered.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}
      {showDispatchModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Dispatch Order</h5>
                <button type="button" className="btn-close" onClick={() => setShowDispatchModal(false)}></button>
              </div>
              <form onSubmit={handleDispatch}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Route to Warehouse</label>
                    <select className="form-select" value={dispatchForm.assignedWarehouseId} onChange={e => setDispatchForm({...dispatchForm, assignedWarehouseId: e.target.value})} required>
                      <option value="">-- Choose Hub --</option>
                      {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.location})</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowDispatchModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger rounded-pill px-4 shadow-sm fw-bold" disabled={isPending}>{isPending ? "Routing..." : "Route to Hub"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAgentModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Assign Delivery Agent</h5>
                <button type="button" className="btn-close" onClick={() => setShowAgentModal(false)}></button>
              </div>
              <form onSubmit={handleAgent}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select User</label>
                    <select className="form-select" value={agentForm.userId} onChange={e => setAgentForm({...agentForm, userId: e.target.value})} required>
                      <option value="">-- Choose User --</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Assign Vehicle</label>
                    <select className="form-select" value={agentForm.vehicleId} onChange={e => setAgentForm({...agentForm, vehicleId: e.target.value})}>
                      <option value="">-- No Vehicle Assigned --</option>
                      {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.type} - {v.licensePlate}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Station at Hub</label>
                    <select className="form-select" value={agentForm.warehouseId} onChange={e => setAgentForm({...agentForm, warehouseId: e.target.value})}>
                      <option value="">-- Floating / Not Stationed --</option>
                      {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowAgentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>Save Agent</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVehicleModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Register Vehicle</h5>
                <button type="button" className="btn-close" onClick={() => setShowVehicleModal(false)}></button>
              </div>
              <form onSubmit={handleVehicle}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">License Plate</label>
                    <input type="text" className="form-control text-uppercase" placeholder="DL 01 AB 1234" value={vehicleForm.licensePlate} onChange={e => setVehicleForm({...vehicleForm, licensePlate: e.target.value})} required />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Type</label>
                      <select className="form-select" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})}>
                        <option value="Truck">Truck</option>
                        <option value="Van">Van</option>
                        <option value="Bike">Bike</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Capacity (kg)</label>
                      <input type="number" className="form-control" value={vehicleForm.capacity} onChange={e => setVehicleForm({...vehicleForm, capacity: Number(e.target.value)})} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowVehicleModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>Save Vehicle</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showWarehouseModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Add Warehouse/Hub</h5>
                <button type="button" className="btn-close" onClick={() => setShowWarehouseModal(false)}></button>
              </div>
              <form onSubmit={handleWarehouse}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Hub Name</label>
                    <input type="text" className="form-control" placeholder="Delhi North Hub" value={warehouseForm.name} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Location / Address</label>
                    <input type="text" className="form-control" value={warehouseForm.location} onChange={e => setWarehouseForm({...warehouseForm, location: e.target.value})} required />
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowWarehouseModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>Save Hub</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Assign Hub Manager</h5>
                <button type="button" className="btn-close" onClick={() => setShowStaffModal(false)}></button>
              </div>
              <form onSubmit={handleStaff}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select User</label>
                    <select className="form-select" value={staffForm.userId} onChange={e => setStaffForm({...staffForm, userId: e.target.value})} required>
                      <option value="">-- Choose User --</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Assign to Hub</label>
                    <select className="form-select" value={staffForm.warehouseId} onChange={e => setStaffForm({...staffForm, warehouseId: e.target.value})} required>
                      <option value="">-- Choose Hub --</option>
                      {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowStaffModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>Save Manager</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
