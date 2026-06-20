import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { deleteRecordAction } from "@/app/actions/db";

export default async function GenericDbPage({ params, searchParams }: { params: Promise<{ model: string }>, searchParams: Promise<{ page?: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { model } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const take = 20;
  const skip = (page - 1) * take;

  const modelMeta = Prisma.dmmf.datamodel.models.find(m => m.name.toLowerCase() === model.toLowerCase());
  
  if (!modelMeta) {
    return (
      <div className="text-center py-5">
        <h3 className="text-muted fw-bold">Model Not Found</h3>
        <p>The table "{model}" does not exist in the database schema.</p>
      </div>
    );
  }

  const scalarFields = modelMeta.fields.filter(f => f.kind === "scalar");
  const prismaModelName = modelMeta.name.charAt(0).toLowerCase() + modelMeta.name.slice(1);
  const prismaModel = (prisma as any)[prismaModelName];

  if (!prismaModel) {
    return <div className="text-danger">Error: Prisma model {prismaModelName} not accessible.</div>;
  }

  const [records, totalCount] = await Promise.all([
    prismaModel.findMany({
      take,
      skip,
      orderBy: scalarFields.some(f => f.name === 'createdAt') ? { createdAt: 'desc' } : undefined
    }).catch(() => []),
    prismaModel.count().catch(() => 0)
  ]);

  const totalPages = Math.ceil(totalCount / take);

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-muted fst-italic">null</span>;
    if (typeof val === 'boolean') return val ? <span className="badge bg-success bg-opacity-10 text-success border border-success">True</span> : <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">False</span>;
    if (val instanceof Date) return val.toLocaleString();
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 30) + '...';
    const str = String(val);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <i className="bi bi-table me-2" style={{ color: "var(--red)" }}></i> {modelMeta.name}
          </h2>
          <p className="text-muted mb-0">Total Records: <strong className="text-dark">{totalCount}</strong></p>
        </div>
        <button className="btn text-white rounded-pill px-4 shadow-sm fw-bold hover-scale transition-all" style={{ backgroundColor: "var(--red)" }}>
          <i className="bi bi-plus-lg me-2"></i> New Record
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-4 shadow-sm border-0 position-relative">
        <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          <table className="table table-hover align-middle mb-0 border-light" style={{ whiteSpace: "nowrap" }}>
            <thead className="table-light text-muted small text-uppercase sticky-top z-1" style={{ letterSpacing: "0.5px" }}>
              <tr>
                {scalarFields.map((field, idx) => (
                  <th key={field.name} className={`fw-bold border-0 py-3 ${idx === 0 ? 'rounded-start' : ''}`}>{field.name}</th>
                ))}
                <th className="fw-bold border-0 rounded-end py-3 position-sticky end-0 bg-light text-center shadow-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {records.map((record: any, rowIndex: number) => (
                <tr key={rowIndex} className="hover-bg-light transition-all">
                  {scalarFields.map(field => (
                    <td key={field.name} className="py-3 text-dark small" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {renderValue(record[field.name])}
                    </td>
                  ))}
                  <td className="py-2 position-sticky end-0 bg-white text-center shadow-sm">
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-light rounded-pill px-3 fw-semibold text-dark border hover-bg-gray transition-all" title="Edit"><i className="bi bi-pencil-square"></i></button>
                      <form action={deleteRecordAction} className="m-0">
                        <input type="hidden" name="model" value={prismaModelName} />
                        <input type="hidden" name="id" value={record.id || record[scalarFields[0].name]} />
                        <button type="submit" className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold hover-bg-danger transition-all" title="Delete"><i className="bi bi-trash"></i></button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={scalarFields.length + 1} className="text-center text-muted py-5 fw-semibold">No records found in {modelMeta.name}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <div className="text-muted small fw-semibold">Showing page {page} of {totalPages}</div>
            <div className="d-flex gap-2">
              <a href={`?page=${Math.max(1, page - 1)}`} className={`btn btn-sm rounded-pill px-4 fw-bold ${page <= 1 ? 'btn-light text-muted disabled' : 'btn-dark hover-scale transition-all'}`}>Previous</a>
              <a href={`?page=${Math.min(totalPages, page + 1)}`} className={`btn btn-sm rounded-pill px-4 fw-bold ${page >= totalPages ? 'btn-light text-muted disabled' : 'btn-dark hover-scale transition-all'}`}>Next</a>
            </div>
          </div>
        )}
      </div>
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
