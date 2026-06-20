import Link from "next/link";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WishlistItemCard from "@/components/WishlistItemCard";

export default async function WishlistPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        },
        orderBy: { id: "desc" }
      }
    }
  });

  const items = wishlist?.items || [];

  return (
    <div className="container py-5" style={{ minHeight: "60vh" }}>
      <h1 className="mb-4 fw-bold">Your Wishlist</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
          <i className="bi bi-heart text-muted" style={{fontSize: "4rem"}}></i>
          <h3 className="mt-3 fw-semibold">Your wishlist is empty</h3>
          <p className="text-muted">Save items you like to your wishlist to buy them later.</p>
          <Link href="/" className="btn btn-primary px-4 py-2 mt-2 rounded-pill" style={{background: "var(--ink)", border: "none"}}>
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {items.map(item => (
            <WishlistItemCard key={item.id} item={item as any} />
          ))}
        </div>
      )}
    </div>
  );
}
