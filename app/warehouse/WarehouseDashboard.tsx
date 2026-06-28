"use client";

import React, { useState, useTransition } from "react";
import { 
  assignAgentToOrderAction, 
  receivePackageAction, 
  forwardPackageAction,
  registerWarehouseAgentAction,
  updateWarehouseAgentAction,
  removeWarehouseAgentAction
} from "@/app/actions/warehouse";
import { toast } from "sonner";

export default function WarehouseDashboard({ 
  warehouse, 
  manager,
  inboundOrders, 
  atHubOrders, 
  outboundOrders, 
  localAgents, 
  allWarehouses, 
  analytics,
  users = [],
  vehicles = [],
  pendingPickups = [],
  trackingLogs = []
}: any) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("logistics");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ orderId: "", deliveryPersonId: "" });

  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardForm, setForwardForm] = useState({ orderId: "", targetWarehouseId: "" });

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ userId: "", vehicleId: "" });

  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [editAgentForm, setEditAgentForm] = useState({ deliveryPersonId: "", vehicleId: "" });

  const [showReportModal, setShowReportModal] = useState(false);

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

  const handleRegisterAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.userId) return toast.error("Please select a user");
    startTransition(async () => {
      const res = await registerWarehouseAgentAction(registerForm.userId, registerForm.vehicleId || null);
      if (res.success) {
        toast.success(res.message);
        setShowRegisterModal(false);
        setRegisterForm({ userId: "", vehicleId: "" });
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleUpdateAgentVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateWarehouseAgentAction(editAgentForm.deliveryPersonId, editAgentForm.vehicleId || null);
      if (res.success) {
        toast.success(res.message);
        setShowEditAgentModal(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleRemoveAgent = (agentId: string) => {
    if (!confirm("Are you sure you want to remove this agent from your hub?")) return;
    startTransition(async () => {
      const res = await removeWarehouseAgentAction(agentId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  // Calculations for report
  const totalLocalShipped = outboundOrders.filter((o: any) => o.status === "SHIPPED").length;
  const totalLocalDelivered = outboundOrders.filter((o: any) => o.status === "DELIVERED").length;
  const totalForwardedDispatched = outboundOrders.filter((o: any) => o.status === "IN_TRANSIT_TO_HUB").length;

  return (
    <div className="container-fluid max-w-7xl mx-auto font-jakarta">
      {/* Header and Tabs */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark">{warehouse.name}</h2>
          <div className="text-muted small">
            <i className="bi bi-geo-alt me-1"></i> {warehouse.location} &bull; 
            <span className="ms-1 fw-bold">Pincodes:</span> {warehouse.pincodes?.join(', ') || 'Global'}
          </div>
        </div>
        
        {/* Navigation Tabs & Actions */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button 
            type="button" 
            className="btn btn-outline-danger rounded-pill fw-bold btn-sm px-3 shadow-sm"
            onClick={() => setShowReportModal(true)}
          >
            <i className="bi bi-file-earmark-bar-graph me-1"></i> Day-End Report
          </button>
          
          <div className="btn-group rounded-pill p-1 bg-light border shadow-sm">
            <button 
              type="button" 
              className={`btn rounded-pill px-4 fw-bold transition-all btn-sm ${activeTab === "logistics" ? "btn-dark shadow-sm text-white" : "btn-light text-muted border-0"}`}
              onClick={() => setActiveTab("logistics")}
            >
              <i className="bi bi-box-seam me-2"></i> Logistics Hub
            </button>
            <button 
              type="button" 
              className={`btn rounded-pill px-4 fw-bold transition-all btn-sm ${activeTab === "agents" ? "btn-dark shadow-sm text-white" : "btn-light text-muted border-0"}`}
              onClick={() => setActiveTab("agents")}
            >
              <i className="bi bi-people me-2"></i> Fleet & Agents
            </button>
          </div>
        </div>
      </div>

      {activeTab === "logistics" ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="bg-white p-3 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center">
                <div className="text-muted small fw-bold text-uppercase mb-1">Local Agents</div>
                <div className="fs-3 fw-bold text-dark">{localAgents.length}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white p-3 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center" style={{ borderBottom: "4px solid var(--bs-danger) !important" }}>
                <div className="text-muted small fw-bold text-uppercase mb-1">Inbound Freight</div>
                <div className="fs-3 fw-bold text-danger">{analytics?.inTransitToHere || 0}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white p-3 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center" style={{ borderBottom: "4px solid var(--bs-warning) !important" }}>
                <div className="text-muted small fw-bold text-uppercase mb-1">Ready for Sort</div>
                <div className="fs-3 fw-bold text-warning">{analytics?.readyForSort || 0}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="bg-white p-3 rounded-4 shadow-sm border text-center h-100 d-flex flex-column justify-content-center" style={{ borderBottom: "4px solid var(--bs-success) !important" }}>
                <div className="text-muted small fw-bold text-uppercase mb-1">Delivered Today</div>
                <div className="fs-3 fw-bold text-success">{analytics?.deliveredToday || 0}</div>
              </div>
            </div>
          </div>

          {/* Operational Grid */}
          <div className="row g-4">
            {/* 1. Inbound Freight */}
            <div className="col-12 col-lg-6 col-xl-3">
              <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-truck me-2 text-danger"></i> Inbound Queue</span>
                  <span className="badge bg-danger rounded-pill">{inboundOrders.length}</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {inboundOrders.map((o: any) => (
                    <div key={o.id} className="p-3 border rounded-3 d-flex flex-column gap-2 bg-light">
                      <div className="d-flex justify-content-between">
                        <div className="font-monospace fw-bold mb-1 text-dark">{o.trackingNumber}</div>
                        <span className="small text-muted">{o.shippingAddress?.postalCode}</span>
                      </div>
                      <div className="small text-muted">
                        <strong>Cust:</strong> {o.user?.name}
                      </div>
                      <button className="btn btn-sm btn-dark rounded-pill fw-bold px-3 shadow-sm mt-2" onClick={() => handleReceive(o.id)} disabled={isPending}>
                        <i className="bi bi-upc-scan me-1"></i> Receive / Scan
                      </button>
                    </div>
                  ))}
                  {inboundOrders.length === 0 && <div className="text-muted text-center py-4 small">No inbound freight at this time.</div>}
                </div>
              </div>
            </div>

            {/* 2. Ready for Sortation */}
            <div className="col-12 col-lg-6 col-xl-3">
              <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-box-seam me-2 text-warning"></i> Sorting Deck</span>
                  <span className="badge bg-warning text-dark rounded-pill">{atHubOrders.length}</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {atHubOrders.map((o: any) => {
                    const destPin = o.shippingAddress?.postalCode;
                    const isLocal = warehouse.pincodes?.includes(destPin) || !warehouse.pincodes?.length;

                    return (
                      <div key={o.id} className="p-3 border rounded-3 d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between">
                          <div className="font-monospace fw-bold text-dark">{o.trackingNumber}</div>
                          <strong className="text-dark">{destPin}</strong>
                        </div>
                        <div className="small text-muted mb-2">
                          <div className="fw-bold text-dark">{o.user?.name}</div>
                          {o.shippingAddress?.street}, {o.shippingAddress?.city}
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

            {/* 3. Pending Seller Pickups */}
            <div className="col-12 col-lg-6 col-xl-3">
              <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-arrow-down-left-square-fill me-2 text-primary"></i> Active Pickups</span>
                  <span className="badge bg-primary rounded-pill">{pendingPickups.length}</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {pendingPickups.map((o: any) => {
                    const seller = o.sellerOrders?.[0]?.seller;
                    return (
                      <div key={o.id} className="p-3 border rounded-3 d-flex flex-column gap-2 bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-warning text-dark font-monospace">PICKUP</span>
                          <span className="small font-monospace text-muted">{o.trackingNumber}</span>
                        </div>
                        <div className="small text-dark">
                          <strong>Seller:</strong> {seller?.companyName || "Vendor"}<br />
                          <strong>Pincode:</strong> {seller?.pickupPincode || "N/A"}<br />
                          <strong>Agent:</strong> {o.deliveryPerson?.user?.name || "Unassigned"}
                        </div>
                        <div className="border-top pt-2 mt-1 bg-white bg-opacity-50 p-2 rounded small text-muted">
                          <strong>Items:</strong> {o.sellerOrders?.[0]?.items?.map((item: any) => `${item.variant?.product?.title} (x${item.quantity})`).join(", ")}
                        </div>
                      </div>
                    );
                  })}
                  {pendingPickups.length === 0 && <div className="text-muted text-center py-4 small">No pending pickups being collected.</div>}
                </div>
              </div>
            </div>

            {/* 4. Outbound & Dispatched */}
            <div className="col-12 col-lg-6 col-xl-3">
              <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-send me-2 text-success"></i> Dispatched</span>
                  <span className="badge bg-success rounded-pill">{outboundOrders?.length || 0}</span>
                </h5>
                <div className="d-flex flex-column gap-3">
                  {outboundOrders?.map((o: any) => (
                    <div key={o.id} className="p-3 border rounded-3 d-flex flex-column gap-2 bg-light">
                      <div className="d-flex justify-content-between">
                        <div className="font-monospace fw-bold text-dark">{o.trackingNumber}</div>
                        <span className={`badge ${o.status === 'DELIVERED' ? 'bg-success' : o.status === 'IN_TRANSIT_TO_HUB' ? 'bg-info text-white' : 'bg-primary'}`}>
                          {o.status === 'IN_TRANSIT_TO_HUB' ? 'FORWARDED' : o.status}
                        </span>
                      </div>
                      <div className="small text-dark">
                        <span className="text-muted">Cust:</span> {o.user?.name} ({o.shippingAddress?.postalCode})
                      </div>
                      
                      {o.status === "IN_TRANSIT_TO_HUB" ? (
                        <div className="small border-top pt-2 mt-1 text-primary fw-bold">
                          <i className="bi bi-arrow-right-circle-fill me-1"></i> Forwarded to next Hub
                        </div>
                      ) : (
                        <div className="small border-top pt-2 mt-1">
                          <span className="text-muted"><i className="bi bi-person-badge"></i> Agent:</span> {o.deliveryPerson?.user?.name || "Unassigned"}
                          <div className="text-muted ms-3"><i className="bi bi-truck"></i> {o.deliveryPerson?.vehicle?.licensePlate || "No Vehicle"}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!outboundOrders || outboundOrders.length === 0) && <div className="text-muted text-center py-4 small">No recent dispatches.</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Hub Activity Timeline Log */}
          <div className="row g-4 mt-3">
            <div className="col-12">
              <div className="bg-white p-4 rounded-4 shadow-sm border">
                <h5 className="fw-bold mb-4 text-dark"><i className="bi bi-clock-history me-2 text-danger"></i> Hub Activity Log (Recent Operations)</h5>
                <div className="d-flex flex-column gap-3" style={{ maxHeight: "350px", overflowY: "auto" }}>
                  {trackingLogs.map((log: any) => (
                    <div key={log.id} className="d-flex align-items-center gap-3 py-2 border-bottom border-light last-border-none">
                      <div className="bg-light rounded-circle p-2 d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                        <i className={`bi fs-5 ${
                          log.status.includes("Arrived") ? "bi-check-circle-fill text-success" :
                          log.status.includes("Forwarded") ? "bi-arrow-right-circle-fill text-primary" :
                          log.status.includes("Pickup") ? "bi-box-seam-fill text-warning" : "bi-info-circle-fill text-muted"
                        }`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="small fw-bold text-dark">{log.status} <span className="text-muted font-monospace small">({log.order?.trackingNumber})</span></div>
                        <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{log.location || "Local Hub"}</div>
                      </div>
                      <div className="text-muted small font-monospace me-2">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{" "}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {trackingLogs.length === 0 && (
                    <div className="text-muted text-center py-4 small">No recent activity logged at this hub.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Fleet & Agent Management View */
        <div className="bg-white p-4 rounded-4 shadow-sm border">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark m-0"><i className="bi bi-people-fill text-dark me-2"></i> Stationed Delivery Crew</h5>
              <div className="text-muted small">Manage vehicles and delivery agents registered directly to this hub.</div>
            </div>
            <button className="btn btn-dark rounded-pill fw-bold btn-sm px-4 shadow-sm" onClick={() => setShowRegisterModal(true)}>
              <i className="bi bi-person-plus-fill me-1"></i> Register Agent
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th className="border-0">Agent Name</th>
                  <th className="border-0">Email / Contact</th>
                  <th className="border-0">Assigned Vehicle</th>
                  <th className="border-0 text-center">Active Workload</th>
                  <th className="border-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {localAgents.map((a: any) => (
                  <tr key={a.id}>
                    <td className="fw-bold text-dark">{a.user.name}</td>
                    <td className="text-muted small">{a.user.email} {a.user.phone && `• ${a.user.phone}`}</td>
                    <td>
                      {a.vehicle ? (
                        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                          {a.vehicle.type} ({a.vehicle.licensePlate})
                        </span>
                      ) : (
                        <span className="text-muted small italic">No vehicle assigned</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill ${a.orders.length > 0 ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {a.orders.length} active pkgs
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-dark rounded-pill px-3" onClick={() => { setEditAgentForm({ deliveryPersonId: a.id, vehicleId: a.vehicleId || "" }); setShowEditAgentModal(true); }}>
                          <i className="bi bi-pencil me-1"></i> Vehicle
                        </button>
                        <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleRemoveAgent(a.id)}>
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {localAgents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted text-center py-5 small">
                      No delivery agents registered at this hub yet. Click "Register Agent" to add crew members.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day-End Performance Report Modal */}
      {showReportModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white p-4">
                <div className="d-flex align-items-center gap-3">
                  <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart Logo" style={{ width: 40 }} />
                  <div>
                    <h5 className="modal-title fw-bold text-white m-0">Hub Day-End Performance Report</h5>
                    <div className="small text-white-50">Operational overview & analytics report</div>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReportModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light" id="printable-hub-report">
                {/* Branding Site Info */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="fw-black text-danger m-0">Sw<span className="text-dark">cart</span></h3>
                    <div className="text-muted small">Premium Logistics Aggregator Network</div>
                  </div>
                  <div className="text-end text-muted small">
                    <div>support@swcart.com</div>
                    <div>Date: {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>

                {/* Hub Data & Manager Data */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="bg-white p-3 rounded-3 border h-100">
                      <div className="text-muted small fw-bold text-uppercase mb-1"><i className="bi bi-building me-1"></i> Warehouse Station</div>
                      <h6 className="fw-bold mb-1 text-dark">{warehouse.name}</h6>
                      <div className="text-muted small">{warehouse.location}</div>
                      <div className="text-muted small mt-2"><strong>Active Pincodes:</strong> {warehouse.pincodes?.join(', ') || 'Global Routing'}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="bg-white p-3 rounded-3 border h-100">
                      <div className="text-muted small fw-bold text-uppercase mb-1"><i className="bi bi-person-badge me-1"></i> Hub Administrator</div>
                      <h6 className="fw-bold mb-1 text-dark">{manager?.name || "Station Manager"}</h6>
                      <div className="text-muted small">{manager?.email || "N/A"}</div>
                      <div className="text-muted small mt-2"><strong>Privileges:</strong> WAREHOUSE_MANAGER</div>
                    </div>
                  </div>
                </div>

                {/* Logistics Performance Summary */}
                <div className="card border-0 rounded-3 shadow-sm p-4 mb-4 bg-white">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-pie-chart me-1"></i> Operations Log & Efficiency Stats</h6>
                  <div className="row text-center g-3">
                    <div className="col-4">
                      <div className="fs-3 fw-bold text-dark">{totalLocalShipped + totalLocalDelivered}</div>
                      <div className="text-muted small">Local Outbounds</div>
                    </div>
                    <div className="col-4">
                      <div className="fs-3 fw-bold text-success">{totalLocalDelivered}</div>
                      <div className="text-muted small">Success Deliveries</div>
                    </div>
                    <div className="col-4">
                      <div className="fs-3 fw-bold text-primary">{totalForwardedDispatched}</div>
                      <div className="text-muted small">Forwards Routed</div>
                    </div>
                  </div>
                </div>

                {/* Fleet Details */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-people me-1"></i> Delivery Agent & Fleet Roster</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Agent Name</th>
                          <th>Vehicle Assignment</th>
                          <th className="text-center">Workload Pkgs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localAgents.map((a: any) => (
                          <tr key={a.id}>
                            <td className="fw-bold text-dark">{a.user.name}</td>
                            <td>{a.vehicle ? `${a.vehicle.type} (${a.vehicle.licensePlate})` : "Unassigned"}</td>
                            <td className="text-center fw-bold text-danger">{a.orders.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Active Inbound Queue in Report */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-box-seam me-1"></i> Inbound Freight Queue</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Tracking #</th>
                          <th>Customer</th>
                          <th>Destination Pin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inboundOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="font-monospace fw-bold">#{o.trackingNumber}</td>
                            <td>{o.user?.name}</td>
                            <td>{o.shippingAddress?.postalCode}</td>
                          </tr>
                        ))}
                        {inboundOrders.length === 0 && (
                          <tr><td colSpan={3} className="text-muted text-center py-2">No inbound packages.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Active Pickups in Report */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-arrow-down-left-square-fill me-1"></i> Active Seller Pickups</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Tracking #</th>
                          <th>Seller Store</th>
                          <th>Pincode</th>
                          <th>Assigned Driver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPickups.map((o: any) => (
                          <tr key={o.id}>
                            <td className="font-monospace fw-bold">#{o.trackingNumber}</td>
                            <td>{o.sellerOrders?.[0]?.seller?.companyName || "Vendor"}</td>
                            <td>{o.sellerOrders?.[0]?.seller?.pickupPincode}</td>
                            <td>{o.deliveryPerson?.user?.name || "Unassigned"}</td>
                          </tr>
                        ))}
                        {pendingPickups.length === 0 && (
                          <tr><td colSpan={4} className="text-muted text-center py-2">No pickups in progress.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sorting Deck in Report */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-gear-fill me-1"></i> Sorting Deck (Ready for Route)</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Tracking #</th>
                          <th>Customer</th>
                          <th>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atHubOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="font-monospace fw-bold">#{o.trackingNumber}</td>
                            <td>{o.user?.name}</td>
                            <td>{o.shippingAddress?.street}, {o.shippingAddress?.city} ({o.shippingAddress?.postalCode})</td>
                          </tr>
                        ))}
                        {atHubOrders.length === 0 && (
                          <tr><td colSpan={3} className="text-muted text-center py-2">No packages on sorting deck.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dispatched & Forwarded List in Report */}
                <div className="bg-white p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark"><i className="bi bi-send me-1"></i> Dispatched & Forwarded Freights</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Tracking #</th>
                          <th>Customer</th>
                          <th>Status</th>
                          <th>Assignment Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outboundOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="font-monospace fw-bold">#{o.trackingNumber}</td>
                            <td>{o.user?.name}</td>
                            <td>
                              <span className={`badge ${o.status === 'DELIVERED' ? 'bg-success' : o.status === 'IN_TRANSIT_TO_HUB' ? 'bg-info text-white' : 'bg-primary'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td>
                              {o.status === "IN_TRANSIT_TO_HUB" ? "Forwarded to next Hub" : `Agent: ${o.deliveryPerson?.user?.name || "Unassigned"}`}
                            </td>
                          </tr>
                        ))}
                        {outboundOrders.length === 0 && (
                          <tr><td colSpan={4} className="text-muted text-center py-2">No dispatches.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footnote */}
                <div className="text-center text-muted small mt-4 pt-4 border-top">
                  Swcart Logistics Manager Control Panel &bull; Generated Securely at Hub
                </div>
              </div>
              <div className="modal-footer border-top-0 p-4 pt-0 bg-light d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowReportModal(false)}>Close</button>
                <button 
                  type="button" 
                  className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    const printContents = document.getElementById("printable-hub-report")?.innerHTML;
                    const originalContents = document.body.innerHTML;
                    if (printContents) {
                      document.body.innerHTML = printContents;
                      window.print();
                      window.location.reload();
                    }
                  }}
                >
                  <i className="bi bi-printer me-2"></i> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Local Delivery Agent Modal */}
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

      {/* Forward package to next hub modal */}
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

      {/* Register Delivery Agent Modal */}
      {showRegisterModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Register Delivery Agent</h5>
                <button type="button" className="btn-close" onClick={() => setShowRegisterModal(false)}></button>
              </div>
              <form onSubmit={handleRegisterAgent}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Select User</label>
                    <select className="form-select" value={registerForm.userId} onChange={e => setRegisterForm({...registerForm, userId: e.target.value})} required>
                      <option value="">-- Select User to Promote --</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Assign Vehicle (Optional)</label>
                    <select className="form-select" value={registerForm.vehicleId} onChange={e => setRegisterForm({...registerForm, vehicleId: e.target.value})}>
                      <option value="">-- No Vehicle Assigned --</option>
                      {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.type} ({v.licensePlate})</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4 shadow-sm fw-bold" disabled={isPending}>{isPending ? "Registering..." : "Register Agent"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Vehicle Modal */}
      {showEditAgentModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="modal-title fw-bold">Update Agent Vehicle</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditAgentModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateAgentVehicle}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-muted small fw-bold text-uppercase">Assign Vehicle</label>
                    <select className="form-select" value={editAgentForm.vehicleId} onChange={e => setEditAgentForm({...editAgentForm, vehicleId: e.target.value})}>
                      <option value="">-- No Vehicle / Unassign --</option>
                      {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.type} ({v.licensePlate})</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowEditAgentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4 shadow-sm fw-bold" disabled={isPending}>{isPending ? "Updating..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
