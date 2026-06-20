import { prisma } from "./db";
import { CATEGORIES, PRODUCTS } from "./mockData";

export async function getCategories() {
  try {
    const cats = await prisma.category.findMany();
    if (cats.length > 0) {
      // Map Prisma Category back to mock format
      return cats.map((c) => ({
        id: c.id,
        name: c.name,
        // Using a generic image or fetching from a relation if it existed
        img: `https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80`,
      }));
    }
    return CATEGORIES;
  } catch (error) {
    console.warn("Database connection failed, falling back to mock Categories.", error);
    return CATEGORIES;
  }
}

export async function getProducts() {
  try {
    const prods = await prisma.product.findMany({
      include: { category: true }
    });
    if (prods.length > 0) {
      return prods.map((p) => ({
        id: p.id,
        name: p.title,
        cat: p.category.name,
        price: p.basePrice,
        old: null, // Hardcoded or calculated
        tag: null, // Hardcoded or calculated
      }));
    }
    return PRODUCTS;
  } catch (error) {
    console.warn("Database connection failed, falling back to mock Products.", error);
    return PRODUCTS;
  }
}

export async function getProductById(id: string) {
  try {
    const prod = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });
    if (prod) {
      return {
        id: prod.id,
        name: prod.title,
        cat: prod.category.name,
        price: prod.basePrice,
        old: null,
        tag: null,
        description: prod.description
      };
    }
  } catch (error) {
    console.warn("Database connection failed, falling back to mock Product.", error);
  }
  return PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
}
