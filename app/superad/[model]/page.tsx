import React from "react";
import { checkSuperAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function SuperadModelPage({ params }: { params: Promise<{ model: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/login");

  const { model } = await params;
  
  // Format model name (e.g. "user" -> "user", "customerprofile" -> "customerProfile")
  // Prisma delegates use camelCase.
  const getPrismaKey = (m: string) => {
    const map: Record<string, string> = {
      user: "user",
      role: "role",
      userrole: "userRole",
      customerprofile: "customerProfile",
      address: "address",
      seller: "seller",
      sellerapplication: "sellerApplication",
      category: "category",
      product: "product",
      productvariant: "productVariant",
      inventory: "inventory",
      warehouse: "warehouse",
      vehicle: "vehicle",
      deliveryperson: "deliveryPerson",
      warehousestaff: "warehouseStaff",
      order: "order",
      sellerorder: "sellerOrder",
      orderitem: "orderItem",
      payment: "payment",
      refund: "refund",
      trackinghistory: "trackingHistory",
      review: "review",
      supportticket: "supportTicket",
      message: "message",
      wallet: "wallet",
      auditlog: "auditLog"
    };
    return map[m.toLowerCase()] || m;
  };

  const prismaKey = getPrismaKey(model);

  let data = [];
  let error = null;
  let headers: string[] = [];

  try {
    const delegate = (prisma as any)[prismaKey];
    if (!delegate) throw new Error(`Model ${prismaKey} not found in Prisma Client.`);
    
    data = await delegate.findMany({ take: 50 });
    
    if (data.length > 0) {
      headers = Object.keys(data[0]);
    }
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bolder text-white mb-1 text-capitalize d-flex align-items-center gap-2">
            <i className="bi bi-table text-danger"></i> {model} Data Explorer
          </h2>
          <p className="text-muted small">Viewing latest 50 records for {prismaKey}.</p>
        </div>
        <Link href="/superad" className="btn btn-sm btn-outline-secondary rounded-pill">
          <i className="bi bi-arrow-left"></i> Back to Dashboard
        </Link>
      </div>

      {error ? (
        <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger rounded-4 p-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> Error: {error}
        </div>
      ) : (
        <div className="rounded-4 overflow-hidden border border-secondary border-opacity-25" style={{ background: "rgba(0,0,0,0.2)" }}>
          {data.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <i className="bi bi-inbox fs-1 mb-3 opacity-50 d-block"></i>
              No records found for this table.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0" style={{ background: "transparent" }}>
                <thead>
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="text-muted text-uppercase tracking-wide small border-bottom border-secondary border-opacity-25 bg-dark bg-opacity-50 py-3" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>
                        {h}
                      </th>
                    ))}
                    <th className="border-bottom border-secondary border-opacity-25 bg-dark bg-opacity-50"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row: any, i: number) => (
                    <tr key={i}>
                      {headers.map(h => {
                        let val = row[h];
                        if (val instanceof Date) val = val.toISOString();
                        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                        return (
                          <td key={h} className="border-bottom border-secondary border-opacity-10 align-middle text-truncate" style={{ maxWidth: "200px", fontSize: "0.85rem", color: "#ccc" }}>
                            {String(val ?? 'NULL')}
                          </td>
                        );
                      })}
                      <td className="border-bottom border-secondary border-opacity-10 align-middle text-end">
                        <button className="btn btn-sm btn-outline-secondary rounded-pill" style={{ fontSize: "0.7rem" }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
