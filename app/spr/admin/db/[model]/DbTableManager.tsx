"use client";

import React, { useState, useTransition } from "react";
import { deleteRecordAction, saveRecordAction } from "@/app/actions/db";
import { toast } from "sonner";

interface FieldMeta {
  name: string;
  type: string;
  isRequired: boolean;
  isId: boolean;
  isList?: boolean;
  isUserRelation?: boolean;
}

interface DbTableManagerProps {
  modelName: string;
  fields: FieldMeta[];
  initialRecords: any[];
  totalPages: number;
  currentPage: number;
  allUsers: any[];
}

const generateCuid = () => {
  return "c" + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
};

export default function DbTableManager({
  modelName,
  fields,
  initialRecords,
  totalPages,
  currentPage,
  allUsers
}: DbTableManagerProps) {
  const [records, setRecords] = useState(initialRecords);
  const [isPending, startTransition] = useTransition();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null); // null means creating
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleOpenCreate = () => {
    setEditingRecord(null);
    const initialForm: Record<string, any> = {};
    fields.forEach(f => {
      if (f.isId) {
        initialForm[f.name] = generateCuid();
      } else if (!f.isId && f.name !== "createdAt" && f.name !== "updatedAt") {
        if (f.type === "Boolean") initialForm[f.name] = false;
        else initialForm[f.name] = "";
      }
    });
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    const editForm: Record<string, any> = {};
    fields.forEach(f => {
      if (!f.isId && f.name !== "createdAt" && f.name !== "updatedAt") {
        const val = record[f.name];
        editForm[f.name] = f.isList && Array.isArray(val) ? val.join(", ") : (val ?? "");
      }
    });
    setFormData(editForm);
    setShowModal(true);
  };

  const handleInputChange = (name: string, value: any, type: string) => {
    let parsedVal = value;
    if (type === "Boolean") {
      parsedVal = value === "true" || value === true;
    } else if (type === "Int" || type === "Float") {
      parsedVal = value === "" ? "" : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: parsedVal }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Process dates and numbers before saving
      const cleanedData: Record<string, any> = {};
      fields.forEach(f => {
        if (!f.isId && f.name !== "createdAt" && f.name !== "updatedAt") {
          let val = formData[f.name];
          if (f.type === "DateTime" && val) {
            val = new Date(val).toISOString();
          }
          if (f.isList) {
            if (typeof val === "string") {
              val = val.split(',').map(s => s.trim()).filter(Boolean);
            } else if (!val) {
              val = [];
            }
          }
          cleanedData[f.name] = val === "" ? null : val;
        }
      });

      const recordId = editingRecord ? editingRecord.id || editingRecord[fields[0].name] : null;
      const res = await saveRecordAction(modelName, recordId, cleanedData);
      
      if (res.success) {
        toast.success(res.message);
        setShowModal(false);
        // Quick reload page values
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (record: any) => {
    const recordId = record.id || record[fields[0].name];
    if (!confirm(`Are you sure you want to delete this record (${recordId})?`)) return;

    startTransition(async () => {
      const form = new FormData();
      form.append("model", modelName.charAt(0).toLowerCase() + modelName.slice(1));
      form.append("id", recordId);

      const res = await deleteRecordAction(form);
      if (res?.success) {
        toast.success(res.message);
        window.location.reload();
      } else {
        toast.error(res?.message || "Failed to delete record");
      }
    });
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-muted fst-italic">null</span>;
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === 'boolean') {
      return val ? (
        <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1">True</span>
      ) : (
        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1">False</span>
      );
    }
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 30) + '...';
    const str = String(val);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <i className="bi bi-table me-2 text-danger"></i> {modelName}
          </h2>
          <p className="text-muted mb-0">Total records loaded on this page: <strong className="text-dark">{records.length}</strong></p>
        </div>
        <button 
          className="btn text-white rounded-pill px-4 shadow-sm fw-bold hover-scale transition-all" 
          style={{ backgroundColor: "var(--red)" }}
          onClick={handleOpenCreate}
        >
          <i className="bi bi-plus-lg me-2"></i> New Record
        </button>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border-0 position-relative">
        <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          <table className="table table-hover align-middle mb-0 border-light" style={{ whiteSpace: "nowrap" }}>
            <thead className="table-light text-muted small text-uppercase sticky-top z-1" style={{ letterSpacing: "0.5px" }}>
              <tr>
                {fields.map((field, idx) => (
                  <th key={field.name} className={`fw-bold border-0 py-3 ${idx === 0 ? 'rounded-start' : ''}`}>{field.name}</th>
                ))}
                <th className="fw-bold border-0 rounded-end py-3 position-sticky end-0 bg-light text-center shadow-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {records.map((record: any, rowIndex: number) => (
                <tr key={rowIndex} className="hover-bg-light transition-all">
                  {fields.map(field => {
                    // Check if there is an loaded related user object
                    let userObject = null;
                    if (field.name.toLowerCase().endsWith("id")) {
                      const relName = field.name.slice(0, -2);
                      if (record[relName] && record[relName].name) {
                        userObject = record[relName];
                      }
                    } else if (field.isUserRelation && record.user) {
                      userObject = record.user;
                    }

                    return (
                      <td key={field.name} className="py-3 text-dark small" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {userObject ? (
                          <div className="d-flex align-items-center gap-2">
                            <img 
                              src={userObject.avatar || "https://tools.swinfosystems.online/icon-192.png"} 
                              alt="" 
                              className="rounded-circle" 
                              style={{ width: "24px", height: "24px", objectFit: "cover" }} 
                            />
                            <div>
                              <div className="fw-bold text-dark">{userObject.name}</div>
                              <div className="text-muted" style={{ fontSize: "0.7rem" }}>{userObject.email}</div>
                            </div>
                          </div>
                        ) : (
                          renderValue(record[field.name])
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 position-sticky end-0 bg-white text-center shadow-sm">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-light rounded-pill px-3 fw-semibold text-dark border hover-bg-gray transition-all" 
                        title="Edit"
                        onClick={() => handleOpenEdit(record)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold hover-bg-danger transition-all" 
                        title="Delete"
                        onClick={() => handleDelete(record)}
                        disabled={isPending}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 1} className="text-center text-muted py-5 fw-semibold">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <div className="text-muted small fw-semibold">Showing page {currentPage} of {totalPages}</div>
            <div className="d-flex gap-2">
              <a href={`?page=${Math.max(1, currentPage - 1)}`} className={`btn btn-sm rounded-pill px-4 fw-bold ${currentPage <= 1 ? 'btn-light text-muted disabled' : 'btn-dark hover-scale transition-all'}`}>Previous</a>
              <a href={`?page=${Math.min(totalPages, currentPage + 1)}`} className={`btn btn-sm rounded-pill px-4 fw-bold ${currentPage >= totalPages ? 'btn-light text-muted disabled' : 'btn-dark hover-scale transition-all'}`}>Next</a>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Edit/Create Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom border-light px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  {editingRecord ? `Edit ${modelName} Record` : `Create New ${modelName}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body px-4 py-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  <div className="row g-3">
                    {fields.map(f => {
                      if (f.isId) {
                        return (
                          <div className="col-12" key={f.name}>
                            <label className="form-label text-dark small fw-bold mb-1">{f.name} (Unique ID)</label>
                            <div className="input-group shadow-sm">
                              <input 
                                type="text" 
                                className="form-control rounded-start-3 font-monospace" 
                                value={formData[f.name] ?? ""} 
                                onChange={(e) => handleInputChange(f.name, e.target.value, f.type)}
                                disabled={!!editingRecord}
                                required 
                              />
                              {!editingRecord && (
                                <button 
                                  type="button" 
                                  className="btn btn-outline-secondary rounded-end-3" 
                                  onClick={() => handleInputChange(f.name, generateCuid(), f.type)}
                                >
                                  <i className="bi bi-arrow-clockwise me-1"></i> Generate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (f.name === "createdAt" || f.name === "updatedAt") {
                        if (editingRecord) {
                          return (
                            <div className="col-12" key={f.name}>
                              <label className="form-label text-muted small text-uppercase fw-bold mb-1">{f.name} (Auto)</label>
                              <input type="text" className="form-control rounded-3 bg-light text-muted font-monospace border-0" value={editingRecord[f.name] ?? ""} disabled />
                            </div>
                          );
                        }
                        return null;
                      }

                      return (
                        <div className="col-md-6" key={f.name}>
                          <label className="form-label text-dark small fw-bold mb-1">
                            {f.name} {f.isRequired && <span className="text-danger">*</span>}
                          </label>
                          {f.isUserRelation ? (
                            <UserSelector 
                              users={allUsers}
                              value={formData[f.name] ?? ""}
                              onChange={(val) => handleInputChange(f.name, val, f.type)}
                              isRequired={f.isRequired}
                            />
                          ) : f.type === "Boolean" ? (
                            <select 
                              className="form-select rounded-3 border-light shadow-sm"
                              value={String(formData[f.name] ?? "false")}
                              onChange={(e) => handleInputChange(f.name, e.target.value, f.type)}
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : f.type === "DateTime" ? (
                            <input 
                              type="datetime-local" 
                              className="form-control rounded-3 border-light shadow-sm"
                              value={formData[f.name] ? new Date(formData[f.name]).toISOString().substring(0, 16) : ""}
                              onChange={(e) => handleInputChange(f.name, e.target.value, f.type)}
                              required={f.isRequired}
                            />
                          ) : f.type === "Int" || f.type === "Float" ? (
                            <input 
                              type="number" 
                              step={f.type === "Float" ? "any" : "1"}
                              className="form-control rounded-3 border-light shadow-sm"
                              value={formData[f.name] ?? ""}
                              onChange={(e) => handleInputChange(f.name, e.target.value, f.type)}
                              required={f.isRequired}
                            />
                          ) : (
                            <textarea 
                              className="form-control rounded-3 border-light shadow-sm"
                              value={formData[f.name] ?? ""}
                              onChange={(e) => handleInputChange(f.name, e.target.value, f.type)}
                              required={f.isRequired}
                              rows={2}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="modal-footer border-top border-light px-4 py-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold border text-dark" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger text-white rounded-pill px-4 fw-bold shadow-sm" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .hover-bg-gray:hover { background-color: #e9ecef !important; }
        .hover-bg-danger:hover { background-color: var(--red) !important; color: white !important; }
        .hover-scale:hover { transform: scale(1.05); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}

interface UserSelectorProps {
  users: any[];
  value: string;
  onChange: (val: string) => void;
  isRequired: boolean;
}

function UserSelector({ users, value, onChange, isRequired }: UserSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedUser = users.find(u => u.id === value);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="position-relative">
      <div 
        className="form-control rounded-3 border shadow-sm d-flex align-items-center justify-content-between cursor-pointer"
        style={{ background: "#fff", minHeight: "38px" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedUser ? (
          <div className="d-flex align-items-center gap-2">
            <img src={selectedUser.avatar || "https://tools.swinfosystems.online/icon-192.png"} alt="" className="rounded-circle" style={{ width: "20px", height: "20px", objectFit: "cover" }} />
            <span className="small fw-bold text-dark">{selectedUser.name} <span className="text-muted fw-normal" style={{ fontSize: "0.75rem" }}>({selectedUser.email})</span></span>
          </div>
        ) : (
          <span className="text-muted small">Select User...</span>
        )}
        <i className="bi bi-chevron-down text-muted small"></i>
      </div>

      {isOpen && (
        <div className="position-absolute w-100 mt-1 bg-white border rounded-3 shadow-lg p-2" style={{ zIndex: 1000, maxHeight: "250px", overflowY: "auto" }}>
          <input 
            type="text" 
            className="form-control form-control-sm mb-2 rounded-2" 
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
          <div className="d-flex flex-column gap-1">
            {filteredUsers.map(u => (
              <div 
                key={u.id}
                className="d-flex align-items-center gap-2 p-2 rounded-2 cursor-pointer hover-bg-light"
                onClick={() => {
                  onChange(u.id);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <img src={u.avatar || "https://tools.swinfosystems.online/icon-192.png"} alt="" className="rounded-circle" style={{ width: "24px", height: "24px", objectFit: "cover" }} />
                <div style={{ fontSize: "0.8rem" }}>
                  <div className="fw-bold text-dark">{u.name}</div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>{u.email}</div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-muted text-center py-2 small">No users found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
