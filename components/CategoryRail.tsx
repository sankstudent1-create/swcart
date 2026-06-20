import { getCategories } from "@/lib/queries";

export default async function CategoryRail() {
  const CATEGORIES = await getCategories();
  return (
    <section className="cat-section container" id="shop">
      <div className="section-title">Shop by category</div>
      <div className="section-sub">Pick a category to filter products below</div>
      <div className="cat-rail" id="catRail">
        {CATEGORIES.map((c, i) => (
          <button key={i} className="cat-item" data-cat={c.name}>
            <div className="cat-circle">
              <img src={c.img} alt={c.name} />
            </div>
            <span>{(c as any).label || c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
