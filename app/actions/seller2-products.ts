"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  // Mock authentication context - get first seller
  const seller = await prisma.seller.findFirst();
  if (!seller) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const basePrice = parseFloat(formData.get("basePrice") as string);
  const categoryId = formData.get("categoryId") as string;
  const sku = formData.get("sku") as string;
  const imageUrl = formData.get("imageUrl") as string;

  if (!title || !basePrice || !categoryId || !sku) {
    throw new Error("Missing required fields");
  }

  // Create product and its default variant
  await prisma.product.create({
    data: {
      sellerId: seller.id,
      categoryId,
      title,
      description: description || "",
      basePrice,
      images: imageUrl ? [imageUrl] : [],
      isPublished: true,
      variants: {
        create: {
          sku,
          price: basePrice,
        }
      }
    }
  });

  revalidatePath("/seller2/products");
}

export async function deleteProduct(productId: string) {
  const seller = await prisma.seller.findFirst();
  if (!seller) throw new Error("Not authenticated");

  // Verify ownership
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product?.sellerId !== seller.id) {
    throw new Error("Unauthorized");
  }

  await prisma.product.delete({
    where: { id: productId }
  });

  revalidatePath("/seller2/products");
}
