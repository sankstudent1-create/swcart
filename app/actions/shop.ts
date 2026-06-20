"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "./auth";
import { revalidatePath } from "next/cache";

export async function updateCartItemAction(itemId: string, quantity: number) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Update failed" };
  }
}

export async function removeCartItemAction(itemId: string) {
  return updateCartItemAction(itemId, 0);
}

export async function removeWishlistItemAction(itemId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    await prisma.wishlistItem.delete({ where: { id: itemId } });
    revalidatePath("/wishlist");
    return { success: true, message: "Removed from wishlist" };
  } catch (error) {
    return { success: false, message: "Removal failed" };
  }
}

export async function placeOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { variant: true } } }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, message: "Cart is empty" };
    }

    const subtotal = cart.items.reduce((acc, item) => acc + (item.variant.price * item.quantity), 0);
    const totalAmount = subtotal + Math.round(subtotal * 0.18);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: "PAID",
        items: {
          create: cart.items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            priceAtBuy: item.variant.price
          }))
        }
      }
    });

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
    
    revalidatePath("/cart");
    revalidatePath("/profile");

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to place order" };
  }
}

async function ensureProductVariant(productId: string) {
  let variant = await prisma.productVariant.findFirst({
    where: { productId }
  });

  if (!variant) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: `${productId}-STD`,
        size: "Standard",
        price: product.basePrice,
      }
    });
  }

  return variant.id;
}

export async function addToCartAction(productId: string, quantity: number = 1) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, message: "Please log in to add to cart" };
  }

  try {
    const variantId = await ensureProductVariant(productId);

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity
        }
      });
    }

    return { success: true, message: "Added to cart successfully!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to add to cart." };
  }
}

export async function addToWishlistAction(productId: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, message: "Please log in to add to wishlist" };
  }

  try {
    const variantId = await ensureProductVariant(productId);

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } }
    });

    if (!existingItem) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          variantId
        }
      });
      return { success: true, message: "Added to wishlist!" };
    } else {
      return { success: true, message: "Item is already in your wishlist." };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to add to wishlist." };
  }
}
