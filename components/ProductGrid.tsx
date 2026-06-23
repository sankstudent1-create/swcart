import { getProducts } from "@/lib/queries";
import Link from "next/link";
import ProductGridActions from "./ProductGridActions";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80";

interface ProductGridProps {
  cat?: string;
}

export default async function ProductGrid({ cat }: ProductGridProps) {
  const PRODUCTS = await getProducts(cat);

  return (
    <section className="prod-section container">
      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          <div className="section-title mb-0">
            {cat ? `${cat} Products` : "All Products"}
          </div>
          <div className="section-sub mb-0">
            {cat ? `Showing results in ${cat}` : "Browse our full catalog"}
          </div>
        </div>
        {cat && (
          <Link href="/" className="btn btn-outline-secondary rounded-pill px-3 py-1" style={{ fontSize: ".85rem", fontWeight: 600 }}>
            <i className="bi bi-x-circle me-1"></i> Clear filter
          </Link>
        )}
      </div>

      {PRODUCTS.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-search" style={{ fontSize: "3rem", color: "#ccc" }}></i>
          <h5 className="mt-3 text-muted">No products in this category yet</h5>
          <p className="text-muted small">Check back soon or explore other categories.</p>
          <Link href="/" className="btn btn-danger rounded-pill px-4 mt-2">Browse All Products</Link>
        </div>
      ) : (
        <div className="row g-4" id="productGrid">
          {PRODUCTS.map((p) => {
            const imgSrc = (p.image && p.image.startsWith("http")) ? p.image : FALLBACK_IMG;
            return (
              <div key={p.id} className="col-6 col-md-4 col-lg-3" data-name={p.name.toLowerCase()} data-cat={p.cat}>
                <div className="prod-card" style={{ position: "relative" }}>
                  {p.tag && <span className="prod-tag">{p.tag}</span>}
                  <Link href={`/product/${p.id}`} className="prod-link">
                    <div className="prod-img">
                      <img
                        src={imgSrc}
                        alt={p.name}
                      />
                    </div>
                    <div className="prod-body">
                      <div className="prod-cat">{p.cat}</div>
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-price">
                        ₹{p.price.toLocaleString("en-IN")}
                        {p.old && <span className="old">₹{p.old.toLocaleString("en-IN")}</span>}
                      </div>
                    </div>
                  </Link>
                  <ProductGridActions productId={p.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
