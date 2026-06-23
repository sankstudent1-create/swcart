"use client";

import React from "react";

export default function PrintTrackingBtn({ order }: { order: any }) {
  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    
    w.document.write(`
      <html>
        <head>
          <title>Tracking Report - ${order.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #E8472A; padding-bottom: 15px; margin-bottom: 30px; }
            .brand { display: flex; align-items: center; gap: 10px; font-size: 26px; font-weight: 800; color: #111; }
            .brand img { width: 36px; height: 36px; border-radius: 8px; }
            .brand span { color: #E8472A; }
            h2 { margin: 0; font-size: 20px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f8f9fa; padding: 20px; border-radius: 12px; }
            .info-box p { margin: 0 0 8px 0; font-size: 14px; color: #666; }
            .info-box strong { color: #111; display: block; font-size: 16px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 16px; border-bottom: 1px solid #eee; text-align: left; }
            th { background: #f1f3f5; color: #495057; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
            td { font-size: 15px; }
            .status { font-weight: 700; color: #111; }
            .latest .status { color: #E8472A; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="https://tools.swinfosystems.online/icon-192.png" />
              <div>Sw<span>cart</span></div>
            </div>
            <h2>Tracking Report</h2>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <p>Order ID: <strong>${order.id}</strong></p>
              <p>Courier: <strong>${order.shippingProvider || 'Internal Logistics'}</strong></p>
            </div>
            <div class="info-box">
              <p>Report Generated: <strong>${new Date().toLocaleString()}</strong></p>
              <p>Current Status: <strong style="color: #E8472A">${order.status}</strong></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Location / Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${order.trackingHistory?.map((h: any, idx: number) => `
                <tr class="${idx === 0 ? 'latest' : ''}">
                  <td style="color: #666; font-size: 14px;">${new Date(h.timestamp).toLocaleString()}</td>
                  <td class="status">${h.status}</td>
                  <td style="color: #666">${h.location || '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="text-align:center; padding: 40px; color:#999;">No tracking events recorded yet.</td></tr>'}
            </tbody>
          </table>
          
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
            This is a system generated tracking report. For issues, contact Swcart Support.
          </div>
          
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <button onClick={handlePrint} className="btn btn-outline-danger btn-sm rounded-pill fw-bold font-jakarta mt-3 w-100 d-flex justify-content-center align-items-center gap-2 shadow-sm transition-all" style={{ padding: "10px" }}>
      <i className="bi bi-printer fs-5"></i> Print Tracking Report
    </button>
  );
}
