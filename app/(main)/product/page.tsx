import Link from "next/link";
import { getProductById } from "@/lib/queries";
import { placeholderImg } from "@/lib/mockData";
import ProductActions from "@/components/ProductActions";

export default async function ProductPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams.id || "p1";
  const p = await getProductById(id);
  const imgUrl = placeholderImg(p.id, p.name);

  return (
    <main>
      <div className="container">
        <div className="breadcrumb-nav">
          <Link href="/">Home</Link> &nbsp;/&nbsp; <span>{p.cat}</span> &nbsp;/&nbsp; <span style={{color:"var(--ink)"}}>{p.name}</span>
        </div>
      </div>

      <section className="container product-layout">
        <div className="row">
          <div className="col-lg-6">
            <div className="product-gallery">
              <div className="gallery-thumbs">
                <img className="thumb-img active" src={imgUrl} />
                <img className="thumb-img" src={imgUrl} />
              </div>
              <div className="main-img-wrap">
                <img src={imgUrl} alt={p.name} />
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="product-info">
              <div className="p-cat">{p.cat}</div>
              <h1 className="p-title">{p.name}</h1>
              
              <div className="p-rating">
                <div>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-half"></i>
                </div>
                <span>4.8 (124 reviews)</span>
              </div>
              
              <div className="p-price-box">
                <div className="p-price">
                  <span>₹{p.price.toLocaleString('en-IN')}</span>
                  {p.old && <span className="old">₹{p.old.toLocaleString('en-IN')}</span>}
                  {p.tag && <span className="p-tag">{p.tag}</span>}
                </div>
                <p className="mb-0 mt-2" style={{fontSize:".85rem", color:"#666", fontWeight:500}}>Inclusive of all taxes. Free shipping applied.</p>
              </div>

              <p className="p-desc">
                Experience premium quality and exceptional design. This product is engineered to deliver the best performance in its class, perfectly balancing aesthetics with everyday utility. Treat yourself to an upgrade.
              </p>

              <ProductActions productId={p.id} />

              <div className="features-grid">
                <div className="f-item">
                  <div className="f-icon"><i className="bi bi-truck"></i></div>
                  <div className="f-text">Fast Delivery<br /><span style={{fontSize:".75rem", color:"#9a8f86", fontWeight:400}}>Within 2-3 business days</span></div>
                </div>
                <div className="f-item">
                  <div className="f-icon"><i className="bi bi-arrow-return-left"></i></div>
                  <div className="f-text">Easy Returns<br /><span style={{fontSize:".75rem", color:"#9a8f86", fontWeight:400}}>7 days hassle-free</span></div>
                </div>
                <div className="f-item">
                  <div className="f-icon"><i className="bi bi-shield-check"></i></div>
                  <div className="f-text">1 Year Warranty<br /><span style={{fontSize:".75rem", color:"#9a8f86", fontWeight:400}}>Guaranteed protection</span></div>
                </div>
                <div className="f-item">
                  <div className="f-icon"><i className="bi bi-lock"></i></div>
                  <div className="f-text">Secure Checkout<br /><span style={{fontSize:".75rem", color:"#9a8f86", fontWeight:400}}>256-bit encryption</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
