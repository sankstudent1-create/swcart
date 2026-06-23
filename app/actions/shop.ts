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
      include: { items: { include: { variant: { include: { product: true } } } } }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, message: "Cart is empty" };
    }

    const couponCode = formData.get("couponCode") as string;
    let couponId = null;

    let subtotal = cart.items.reduce((acc: number, item: any) => {
      const discount = item.variant.product.discountPercent || 0;
      const price = item.variant.price * (1 - (discount / 100));
      return acc + (price * item.quantity);
    }, 0);

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.validUntil >= new Date() && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)) {
        couponId = coupon.id;
        if (coupon.discountType === "PERCENTAGE") {
          subtotal = subtotal * (1 - (coupon.discountVal / 100));
        } else {
          subtotal = Math.max(0, subtotal - coupon.discountVal);
        }
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    }

    const taxAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + taxAmount;

    let customerProfile = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!customerProfile) {
      customerProfile = await prisma.customerProfile.create({ data: { userId } });
    }

    const street = formData.get("address") as string || "123 Main St";
    const city = formData.get("city") as string || "City";
    const postalCode = formData.get("zip") as string || "000000";

    const address = await prisma.address.create({
      data: {
        customerProfileId: customerProfile.id,
        street,
        city,
        state: "State",
        postalCode,
        country: "IN"
      }
    });

    const order = await prisma.order.create({
      data: {
        userId,
        shippingAddressId: address.id,
        totalAmount,
        taxAmount,
        status: "PROCESSING",
        couponId,
        items: {
          create: cart.items.map(item => {
            const discount = item.variant.product.discountPercent || 0;
            const price = item.variant.price * (1 - (discount / 100));
            return {
              variantId: item.variantId,
              quantity: item.quantity,
              priceAtBuy: price
            };
          })
        },
        payments: {
          create: [{
            method: "COD",
            amount: totalAmount,
            status: "PENDING"
          }]
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

export async function validateCouponAction(code: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { success: false, message: "Invalid coupon code" };
  if (coupon.validUntil < new Date()) return { success: false, message: "Coupon has expired" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { success: false, message: "Coupon usage limit reached" };
  
  return { success: true, coupon };
}
