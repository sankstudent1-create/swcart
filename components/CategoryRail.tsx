import Link from "next/link";
import { getCategories } from "@/lib/queries";

interface CategoryRailProps {
  activeCat?: string;
}

export default async function CategoryRail({ activeCat }: CategoryRailProps) {
  const CATEGORIES = await getCategories();

  return (
    <section className="cat-section container" id="shop">
      <div className="section-title">Shop by category</div>
      <div className="section-sub">Pick a category to filter products below</div>
      <div className="cat-rail" id="catRail">
        {/* All Products pill */}
        <Link
          href="/"
          className={`cat-item text-decoration-none ${!activeCat ? "active" : ""}`}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div className="cat-circle" style={!activeCat ? { borderColor: "var(--orange)", background: "var(--cream)" } : {}}>
            <span style={{ fontSize: "1.8rem" }}>🛍️</span>
          </div>
          <span>All</span>
        </Link>

        {CATEGORIES.map((c, i) => {
          const isActive = activeCat === c.name;
          return (
            <Link
              key={i}
              href={`/?cat=${encodeURIComponent(c.name)}`}
              className={`cat-item text-decoration-none ${isActive ? "active" : ""}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div className="cat-circle" style={isActive ? { borderColor: "var(--orange)", background: "var(--cream)" } : {}}>
                <img src={c.img} alt={c.name} />
              </div>
              <span>{(c as any).label || c.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
