import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateCategoryForm from "@/components/admin/CreateCategoryForm";
import { resolveImageUrl } from "@/lib/utils";

export default async function CategoryIntelligence() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const categories = await prisma.category.findMany({
    include: {
      products: { include: { seller: true } }
    }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Category Intelligence</h2>
          <p className="text-muted mb-0">Overview of all active market categories.</p>
        </div>
        <CreateCategoryForm />
      </div>

      <div className="row g-4">
        {categories.map(cat => {
          const uniqueSellers = new Set(cat.products.map(p => p.sellerId)).size;
          return (
            <div key={cat.id} className="col-md-6 col-lg-4">
              <Link href={`/spr/admin/categories/${cat.id}`} className="text-decoration-none">
                <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 hover-lift transition-all position-relative overflow-hidden">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    {cat.image ? (
                      <img src={resolveImageUrl(cat.image)} alt={cat.name} className="rounded-3 shadow-sm border" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                    ) : (
                      <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}>
                        <i className="bi bi-tag-fill"></i>
                      </div>
                    )}
                    <div>
                      <h5 className="fw-bold text-dark mb-1">{cat.name}</h5>
                    </div>
                  </div>
                  
                  <div className="d-flex gap-4 mt-auto pt-4 border-top border-light position-relative z-1">
                    <div>
                      <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Products</div>
                      <div className="fw-bold fs-5 text-dark">{cat.products.length}</div>
                    </div>
                    <div>
                      <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>Active Sellers</div>
                      <div className="fw-bold fs-5 text-dark">{uniqueSellers}</div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="col-12 text-center py-5">
            <h5 className="text-muted">No categories found.</h5>
          </div>
        )}
      </div>
      <style>{`
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
