import { prisma } from "./db";
import { CATEGORIES, PRODUCTS } from "./mockData";

// Category image map for UI
const CAT_IMAGES: Record<string, string> = {
  Electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80",
  Fashion:     "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=200&q=80",
  Home:        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=200&q=80",
  Grocery:     "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
  Beauty:      "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=200&q=80",
  Sports:      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=200&q=80",
  Toys:        "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=200&q=80",
  Books:       "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=200&q=80",
  Tools:       "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=200&q=80",
};

// Generic fallback image list for products with no images
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
];

function getProductImage(images: string[], id: string): string {
  if (images && images.length > 0 && images[0].startsWith("http")) return images[0];
  // Deterministic fallback based on product ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_IMGS[hash % FALLBACK_IMGS.length];
}

export async function getCategories() {
  try {
    const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
    if (cats.length > 0) {
      return cats.map((c) => ({
        id: c.id,
        name: c.name,
        img: c.image || CAT_IMAGES[c.name] || FALLBACK_IMGS[0],
        label: c.name,
      }));
    }
    return CATEGORIES.map(c => ({ ...c, id: c.name, label: (c as any).label || c.name }));
  } catch (error) {
    console.warn("DB error in getCategories, using mock.", error);
    return CATEGORIES.map(c => ({ ...c, id: c.name, label: (c as any).label || c.name }));
  }
}

export async function getProducts(categoryName?: string) {
  try {
    const prods = await prisma.product.findMany({
      where: categoryName ? { category: { name: categoryName } } : undefined,
      include: {
        category: true,
        variants: {
          include: { inventory: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (prods.length > 0) {
      return prods.map((p) => {
        const discountedPrice = p.discountPercent > 0
          ? Math.round(p.basePrice * (1 - p.discountPercent / 100))
          : null;
        const totalStock = p.variants.reduce(
          (acc, v) => acc + (v.inventory[0]?.quantity || 0), 0
        );
        return {
          id: p.id,
          name: p.title,
          cat: p.category.name,
          price: discountedPrice ?? p.basePrice,
          old: discountedPrice ? p.basePrice : null,
          tag: p.discountPercent > 0 ? `-${p.discountPercent}%` : null,
          image: getProductImage(p.images, p.id),
          images: p.images,
          discountPercent: p.discountPercent,
          inStock: totalStock > 0,
          variantCount: p.variants.length,
        };
      });
    }

    // Fallback to mock when DB is empty
    if (categoryName) return PRODUCTS.filter(p => p.cat === categoryName).map(p => ({
      ...p, image: "", images: [], discountPercent: 0, inStock: true, variantCount: 1
    }));
    return PRODUCTS.map(p => ({
      ...p, image: "", images: [], discountPercent: 0, inStock: true, variantCount: 1
    }));
  } catch (error) {
    console.warn("DB error in getProducts, using mock.", error);
    const list = categoryName ? PRODUCTS.filter(p => p.cat === categoryName) : PRODUCTS;
    return list.map(p => ({
      ...p, image: "", images: [], discountPercent: 0, inStock: true, variantCount: 1
    }));
  }
}

export async function getProductById(id: string) {
  try {
    const prod = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: { inventory: true }
        },
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 10
        },
        seller: true,
        questions: {
          include: {
            user: { select: { name: true } },
            answers: { include: { user: { select: { name: true } } } }
          }
        },
        courseChapters: {
          include: { lessons: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" }
        }
      }
    });

    if (prod) {
      const discountedPrice = prod.discountPercent > 0
        ? Math.round(prod.basePrice * (1 - prod.discountPercent / 100))
        : null;
      const totalStock = prod.variants.reduce(
        (acc, v) => acc + (v.inventory[0]?.quantity || 0), 0
      );
      const avgRating = prod.reviews.length > 0
        ? prod.reviews.reduce((acc, r) => acc + r.rating, 0) / prod.reviews.length
        : 0;

      return {
        id: prod.id,
        name: prod.title,
        cat: prod.category.name,
        productType: prod.productType,
        price: discountedPrice ?? prod.basePrice,
        old: discountedPrice ? prod.basePrice : null,
        tag: prod.discountPercent > 0 ? `-${prod.discountPercent}%` : null,
        description: prod.description,
        image: getProductImage(prod.images, prod.id),
        images: prod.images,
        discountPercent: prod.discountPercent,
        inStock: totalStock > 0,
        totalStock,
        variants: prod.variants.map(v => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: prod.discountPercent > 0 ? v.price * (1 - prod.discountPercent/100) : v.price,
          stock: v.inventory[0]?.quantity || 0
        })),
        reviews: prod.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          mediaUrls: r.mediaUrls || [],
          userName: r.user.name,
          userAvatar: r.user.avatar,
          createdAt: r.createdAt.toISOString()
        })),
        reviewCount: prod.reviews.length,
        avgRating,
        seller: {
          companyName: prod.seller.companyName,
          isVerified: prod.seller.isVerified
        },
        questions: prod.questions.map(q => ({
          id: q.id,
          question: q.question,
          userName: q.user.name,
          createdAt: q.createdAt.toISOString(),
          answers: q.answers.map(a => ({
            answer: a.answer,
            userName: a.user.name,
            createdAt: a.createdAt.toISOString()
          }))
        })),
        courseChapters: prod.courseChapters.map(c => ({
          id: c.id,
          title: c.title,
          lessons: c.lessons.map(l => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            isFree: l.isFree
          }))
        }))
      };
    }
  } catch (error) {
    console.warn("DB error in getProductById, falling back to mock.", error);
  }

  // Fallback to mock data (for legacy mock IDs like p1, p2...)
  const mock = PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
  return {
    ...mock,
    description: "Experience premium quality and exceptional design. This product is engineered to deliver the best performance in its class.",
    image: "",
    images: [],
    discountPercent: 0,
    inStock: true,
    totalStock: 10,
    variants: [],
    reviews: [],
    reviewCount: 0,
    avgRating: 0
  };
}
