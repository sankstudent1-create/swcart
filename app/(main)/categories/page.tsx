import Link from "next/link";
import { getCategories } from "@/lib/queries";

const CAT_BG_IMAGES: Record<string, string> = {
  Electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
  Fashion:     "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
  Home:        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80",
  Grocery:     "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  Beauty:      "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=800&q=80",
  Sports:      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
  Toys:        "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80",
  Books:       "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
  Tools:       "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80",
};

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
          {CATEGORIES.map((c, i) => {
            const bgImg = (c as any).image || CAT_BG_IMAGES[c.name] || c.img;
            return (
              <div key={i} className="col-md-6 col-lg-4">
                <Link href={`/?cat=${encodeURIComponent(c.name)}`} className="cat-card">
                  <img
                    src={bgImg}
                    alt={c.name}
                    className="cat-img"
                  />
                  <div className="cat-overlay">
                    <h3>{(c as any).label || c.name}</h3>
                    <span>Shop now <i className="bi bi-arrow-right"></i></span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
