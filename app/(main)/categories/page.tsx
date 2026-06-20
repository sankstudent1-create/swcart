import Link from "next/link";
import { getCategories } from "@/lib/queries";

export default async function CategoriesPage() {
  const CATEGORIES = await getCategories();
  return (
    <main>
      <div className="page-title">
        <h1>Shop by Category</h1>
        <p>Explore our wide range of products across all departments.</p>
      </div>

      <section className="container cat-grid">
        <div className="row g-4" id="catContainer">
          {CATEGORIES.map((c, i) => (
            <div key={i} className="col-md-6 col-lg-4">
              <Link href="/" className="cat-card">
                <img src={c.img} alt={c.name} className="cat-img" />
                <div className="cat-overlay">
                  <h3>{c.name}</h3>
                  <span>Shop now <i className="bi bi-arrow-right"></i></span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
