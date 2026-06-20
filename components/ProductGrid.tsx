import { getProducts } from "@/lib/queries";
import { placeholderImg } from "@/lib/mockData";
import Link from "next/link";
import ProductGridActions from "./ProductGridActions";

export default async function ProductGrid() {
  const PRODUCTS = await getProducts();
  return (
    <section className="prod-section container">
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <div className="section-title mb-0" id="resultsTitle">All products</div>
          <div className="section-sub mb-0" id="resultsSub">Browse our full catalog</div>
        </div>
        <button className="view-all" id="clearFilter" style={{display: "none"}}>
          Clear filter <i className="bi bi-x-circle"></i>
        </button>
      </div>
      
      <div className="row g-4" id="productGrid">
        {PRODUCTS.map((p) => (
          <div key={p.id} className="col-6 col-md-4 col-lg-3" data-name={p.name.toLowerCase()} data-cat={p.cat}>
            <div className="prod-card">
              {p.tag && <span className="prod-tag">{p.tag}</span>}
              <Link href={`/product?id=${p.id}`} className="prod-link">
                <div className="prod-img">
                  <img src={placeholderImg(p.id, "")} alt={p.name} />
                </div>
                <div className="prod-body">
                  <div className="prod-cat">{p.cat}</div>
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-price">
                    ₹{p.price.toLocaleString('en-IN')} 
                    {p.old && <span className="old">₹{p.old.toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              </Link>
              <ProductGridActions productId={p.id} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="no-results" id="noResults" style={{display: "none"}}>
        No products match your search. Try a different keyword or clear the filter.
      </div>
    </section>
  );
}
