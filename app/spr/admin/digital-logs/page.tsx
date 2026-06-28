import { prisma } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { Search, ShieldAlert, MonitorPlay, FileText } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Digital Access Logs — Admin" };

export default async function AdminDigitalLogsPage() {
  const logs = await prisma.digitalAccessLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="container-fluid py-4" style={{ fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1" style={{ color: "#1a1a2e" }}>Access Logs</h2>
          <p className="text-muted mb-0">Forensic audit trail of all secure content access (eBooks & Videos).</p>
        </div>
      </div>

      {/* Security alert metric */}
      <div className="row mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 bg-danger text-white">
            <div className="card-body p-4 d-flex align-items-center">
              <ShieldAlert size={48} className="opacity-50 me-3" />
              <div>
                <h6 className="fw-bold mb-1 opacity-75 text-uppercase" style={{ letterSpacing: "1px" }}>Suspicious Activity</h6>
                <h3 className="fw-black mb-0">0</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Time</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>User</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Action</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Product ID</th>
                <th className="text-uppercase text-muted" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Metadata (IP / UA)</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.85rem" }}>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No access logs found yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const meta = log.metadata as any || {};
                  
                  return (
                    <tr key={log.id}>
                      <td className="text-nowrap text-muted fw-semibold">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </td>
                      <td>
                        <div className="fw-bold" style={{ color: "#1a1a2e" }}>{log.user.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{log.user.email}</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-2 bg-${log.action === 'VIDEO_PLAY' ? 'primary' : log.action === 'PAGE_VIEW' ? 'danger' : 'secondary'}`}>
                          {log.action === 'VIDEO_PLAY' && <MonitorPlay size={12} className="me-1" />}
                          {log.action === 'PAGE_VIEW' && <FileText size={12} className="me-1" />}
                          {log.action}
                        </span>
                      </td>
                      <td className="text-muted font-monospace" style={{ fontSize: "0.7rem" }}>
                        <Link href={`/product/${log.productId}`} target="_blank" className="text-decoration-none text-danger">
                          {log.productId}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem" }}>
                          <span className="fw-bold text-dark">IP:</span> {meta.ip || "Unknown"}
                          <br />
                          <span className="fw-bold text-dark">Item:</span> {meta.page ? `Page ${meta.page}` : meta.lessonId ? `Lesson ${meta.lessonId}` : "N/A"}
                          <br />
                          <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: "250px" }} title={meta.ua}>
                            {meta.ua || "Unknown"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
