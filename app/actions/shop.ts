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
    const orderId = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { variant: { include: { product: true } } } } }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // Group items by sellerId for multi-vendor support
      const sellerGroups: Record<string, typeof cart.items> = {};
      cart.items.forEach(item => {
        const sId = item.variant.product.sellerId;
        if (!sellerGroups[sId]) sellerGroups[sId] = [];
        sellerGroups[sId].push(item);
      });

      const couponCode = formData.get("couponCode") as string;
      let couponId = null;

      let subtotal = cart.items.reduce((acc: number, item: any) => {
        const discount = item.variant.product.discountPercent || 0;
        const price = item.variant.price * (1 - (discount / 100));
        return acc + (price * item.quantity);
      }, 0);

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (coupon && coupon.validUntil >= new Date() && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)) {
          couponId = coupon.id;
          if (coupon.discountType === "PERCENTAGE") {
            subtotal = subtotal * (1 - (coupon.discountVal / 100));
          } else {
            subtotal = Math.max(0, subtotal - coupon.discountVal);
          }
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } }
          });
        }
      }

      const taxAmount = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + taxAmount;

      let customerProfile = await tx.customerProfile.findUnique({ where: { userId } });
      if (!customerProfile) {
        customerProfile = await tx.customerProfile.create({ data: { userId } });
      }

      let hasDigital = false;
      const isDigitalOnly = cart.items.every((item: any) => {
        const pt = item.variant.product.productType;
        if (pt === "DIGITAL" || pt === "EBOOK") hasDigital = true;
        return pt === "DIGITAL" || pt === "EBOOK";
      });
      cart.items.forEach((item: any) => {
        const pt = item.variant.product.productType;
        if (pt === "DIGITAL" || pt === "EBOOK") hasDigital = true;
      });

      let addressId = null;

      if (!isDigitalOnly) {
        const street = formData.get("address") as string || "123 Main St";
        const city = formData.get("city") as string || "City";
        const postalCode = formData.get("zip") as string || "000000";

        const address = await tx.address.create({
          data: {
            customerProfileId: customerProfile.id,
            street,
            city,
            state: "State",
            postalCode,
            country: "IN"
          }
        });
        addressId = address.id;
      }

      const useWallet = formData.get("useWallet") === "true";
      let walletPayAmount = 0;
      let walletId = null;

      if (useWallet) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (wallet && wallet.balance > 0) {
          walletPayAmount = Math.min(wallet.balance, totalAmount);
          walletId = wallet.id;
          
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: walletPayAmount } }
          });
        }
      }

      const remainingAmount = totalAmount - walletPayAmount;
      
      // DIGITAL GOODS SECURITY FIX:
      // If the cart contains ANY digital goods, the remaining amount must be 0 (fully paid via wallet)
      // because we cannot allow COD (Cash on Delivery) for instant digital access.
      if (hasDigital && remainingAmount > 0) {
        throw new Error("Digital products must be fully paid upfront. Please add funds to your wallet.");
      }

      const paymentData = [];
      if (walletPayAmount > 0) {
        paymentData.push({
          method: "WALLET",
          amount: walletPayAmount,
          status: "COMPLETED"
        });
      }
      if (remainingAmount > 0) {
        paymentData.push({
          method: "COD",
          amount: remainingAmount,
          status: "PENDING"
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          shippingAddressId: addressId,
          totalAmount,
          taxAmount,
          status: isDigitalOnly ? "DELIVERED" : "PROCESSING",
          couponId,
          payments: {
            create: paymentData
          },
          sellerOrders: {
            create: Object.entries(sellerGroups).map(([sId, items]) => ({
              sellerId: sId,
              status: isDigitalOnly ? "DELIVERED" : "PROCESSING",
              items: {
                create: items.map(item => {
                  const discount = item.variant.product.discountPercent || 0;
                  const price = item.variant.price * (1 - (discount / 100));
                  return {
                    variantId: item.variantId,
                    quantity: item.quantity,
                    priceAtBuy: price
                  };
                })
              }
            }))
          }
        }
      });

      if (walletPayAmount > 0 && walletId) {
        await tx.walletTransaction.create({
          data: {
            walletId,
            amount: -walletPayAmount,
            type: "DEBIT",
            reason: `Payment for Order #${order.id.slice(-8).toUpperCase()}`
          }
        });
      }

      // Check for referrals and award bonus on first order
      const referral = await tx.referral.findUnique({
        where: { referredId: userId }
      });
      if (referral && referral.status === "PENDING") {
        await tx.referral.update({
          where: { id: referral.id },
          data: { status: "COMPLETED", rewardPaid: true }
        });

        let referrerWallet = await tx.wallet.findUnique({
          where: { userId: referral.referrerId }
        });
        if (!referrerWallet) {
          referrerWallet = await tx.wallet.create({
            data: { userId: referral.referrerId, balance: 0 }
          });
        }

        await tx.wallet.update({
          where: { id: referrerWallet.id },
          data: { balance: { increment: 100 } }
        });

        await tx.walletTransaction.create({
          data: {
            walletId: referrerWallet.id,
            amount: 100,
            type: "CREDIT",
            reason: "Referral Bonus for inviting new customer"
          }
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // Auto-enroll in digital courses
      const digitalProductIds = new Set<string>();
      cart.items.forEach((item: any) => {
        const pt = item.variant.product.productType;
        if (pt === "DIGITAL" || pt === "EBOOK") {
          digitalProductIds.add(item.variant.product.id);
        }
      });

      for (const pId of Array.from(digitalProductIds)) {
        const existingEnrollment = await tx.userCourseEnrollment.findUnique({
          where: { userId_productId: { userId, productId: pId } }
        });
        if (!existingEnrollment) {
          await tx.userCourseEnrollment.create({
            data: { userId, productId: pId }
          });
        }
      }

      return order.id;
    });

    revalidatePath("/cart");
    revalidatePath("/profile");

    return { success: true, orderId };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Failed to place order" };
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

export async function addToCartAction(productId: string, quantity: number = 1, requestedVariantId?: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, message: "Please log in to add to cart" };
  }

  try {
    let variantId = requestedVariantId;
    if (!variantId) {
      variantId = await ensureProductVariant(productId);
    } else {
      const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!v || v.productId !== productId) {
        return { success: false, message: "Invalid variant selected." };
      }
    }

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

export async function addToWishlistAction(productId: string, requestedVariantId?: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, message: "Please log in to add to wishlist" };
  }

  try {
    let variantId = requestedVariantId;
    if (!variantId) {
      variantId = await ensureProductVariant(productId);
    } else {
      const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!v || v.productId !== productId) {
        return { success: false, message: "Invalid variant selected." };
      }
    }

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

export async function requestRefundAction(sellerOrderId: string, reason: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const sellerOrder = await prisma.sellerOrder.findUnique({
      where: { id: sellerOrderId },
      include: { order: true, items: true }
    });

    if (!sellerOrder || sellerOrder.order.userId !== userId) {
      return { success: false, message: "Order not found" };
    }

    if (sellerOrder.status !== "DELIVERED") {
      return { success: false, message: "Only delivered orders can be refunded" };
    }

    const amount = sellerOrder.items.reduce((acc, item) => acc + (item.priceAtBuy * item.quantity), 0);

    await prisma.$transaction([
      prisma.sellerOrder.update({
        where: { id: sellerOrderId },
        data: { status: "RETURN_REQUESTED" }
      }),
      prisma.refund.create({
        data: {
          orderId: sellerOrder.orderId,
          amount,
          reason,
          status: "PENDING"
        }
      })
    ]);

    revalidatePath("/profile");
    return { success: true, message: "Refund requested successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to request refund" };
  }
}

export async function submitReviewAction(productId: string, rating: number, comment: string, mediaUrls: string[] = []) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Please log in to leave a review." };

  try {
    // Verify purchase
    const purchased = await prisma.orderItem.findFirst({
      where: {
        variant: { productId },
        sellerOrder: {
          order: { userId },
          status: "DELIVERED"
        }
      }
    });

    if (!purchased) {
      return { success: false, message: "You can only review products that you have successfully purchased and received." };
    }

    // Check if already reviewed
    const existing = await prisma.review.findFirst({
      where: { userId, productId }
    });

    if (existing) {
      return { success: false, message: "You have already reviewed this product." };
    }

    await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment: comment.trim() || null,
        mediaUrls
      }
    });

    revalidatePath(`/product/${productId}`);
    return { success: true, message: "Review submitted successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to submit review" };
  }
}
