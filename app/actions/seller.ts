"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "./auth";
import { revalidatePath } from "next/cache";

export async function submitSellerApplicationAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, message: "Please log in to apply." };
  }

  const companyName = formData.get("companyName") as string;
  const gstNumber = formData.get("gstNumber") as string || null;
  const bankAccount = formData.get("bankAccount") as string || "";
  const bankIfsc = formData.get("bankIfsc") as string || "";

  if (!companyName) {
    return { success: false, message: "Company name is required." };
  }

  try {
    // 1. Check if already a seller
    const existingSeller = await prisma.seller.findUnique({ where: { userId } });
    if (existingSeller) {
      return { success: false, message: "You are already registered as a seller." };
    }

    // 2. Check if a pending application exists
    const pendingApp = await prisma.sellerApplication.findUnique({ where: { userId } });
    if (pendingApp && pendingApp.status === "PENDING") {
      return { success: false, message: "You already have a pending seller application." };
    }

    // 3. Fetch global settings for auto-approval status
    const settings = await prisma.siteSetting.findUnique({ where: { id: "GLOBAL" } });
    const isAutoApprove = settings?.autoApproveSellers ?? true;

    const bankDetails = { bankAccount, bankIfsc };

    if (isAutoApprove) {
      // Create role, seller profile, and application record as APPROVED immediately
      const role = await prisma.role.upsert({
        where: { name: "SELLER" },
        update: {},
        create: { name: "SELLER", description: "Product Seller / Vendor" }
      });

      // Insert UserRole
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        update: {},
        create: { userId, roleId: role.id }
      });

      // Create Seller record
      await prisma.seller.create({
        data: {
          userId,
          companyName,
          gstNumber,
          bankDetails,
          isVerified: true
        }
      });

      // Create application record as APPROVED
      await prisma.sellerApplication.upsert({
        where: { userId },
        update: {
          companyName,
          gstNumber,
          bankDetails,
          status: "APPROVED"
        },
        create: {
          userId,
          companyName,
          gstNumber,
          bankDetails,
          status: "APPROVED"
        }
      });

      revalidatePath("/sell");
      revalidatePath("/profile");
      return { success: true, message: "Your seller registration has been auto-approved! Welcome to Swcart." };
    } else {
      // Save application as PENDING for admin review
      await prisma.sellerApplication.upsert({
        where: { userId },
        update: {
          companyName,
          gstNumber,
          bankDetails,
          status: "PENDING"
        },
        create: {
          userId,
          companyName,
          gstNumber,
          bankDetails,
          status: "PENDING"
        }
      });

      revalidatePath("/sell");
      return { success: true, message: "Your application has been submitted successfully and is pending admin review." };
    }
  } catch (error: any) {
    console.error("submitSellerApplicationAction error:", error);
    return { success: false, message: "An error occurred during submission. Please try again." };
  }
}

export async function getSellerProfileAction() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return await prisma.seller.findUnique({ where: { userId } });
}

export async function updateSellerSettingsAction(companyName: string, gstNumber: string | null, bankDetails: any) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  if (!companyName.trim()) return { success: false, message: "Company name is required." };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        companyName,
        gstNumber,
        bankDetails
      }
    });

    revalidatePath("/seller/settings");
    return { success: true, message: "Seller settings updated successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update settings" };
  }
}

export async function saveSellerProductAction(
  productId: string | null,
  data: {
    title: string;
    description: string;
    basePrice: number;
    discountPercent: number;
    categoryId: string;
    images: string[];
    isPublished: boolean;
    brand?: string;
    tags?: string[];
    weightGrams?: number;
    dimLength?: number;
    dimWidth?: number;
    dimHeight?: number;
    returnPolicy?: string;
    warrantyInfo?: string;
    metaTitle?: string;
    metaDescription?: string;
    variants: {
      id?: string;
      sku: string;
      size?: string;
      color?: string;
      price: number;
      quantity: number;
    }[];
  }
) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    // Ensure default warehouse exists
    const warehouse = await prisma.warehouse.upsert({
      where: { id: "default-warehouse" },
      update: {},
      create: {
        id: "default-warehouse",
        name: "Main Seller Warehouse",
        location: "Default Storehouse"
      }
    });

    let activeProductId = productId;

    if (productId) {
      // Update product
      const existing = await prisma.product.findUnique({ where: { id: productId } });
      if (!existing || existing.sellerId !== seller.id) {
        return { success: false, message: "Product not found or unauthorized access" };
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          title: data.title,
          description: data.description,
          basePrice: data.basePrice,
          discountPercent: data.discountPercent,
          categoryId: data.categoryId,
          images: data.images,
          isPublished: data.isPublished,
          brand: data.brand || null,
          tags: data.tags || [],
          weightGrams: data.weightGrams || null,
          dimLength: data.dimLength || null,
          dimWidth: data.dimWidth || null,
          dimHeight: data.dimHeight || null,
          returnPolicy: data.returnPolicy || null,
          warrantyInfo: data.warrantyInfo || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        }
      });
    } else {
      // Create product
      const newProduct = await prisma.product.create({
        data: {
          sellerId: seller.id,
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          basePrice: data.basePrice,
          discountPercent: data.discountPercent,
          images: data.images,
          isPublished: data.isPublished,
          brand: data.brand || null,
          tags: data.tags || [],
          weightGrams: data.weightGrams || null,
          dimLength: data.dimLength || null,
          dimWidth: data.dimWidth || null,
          dimHeight: data.dimHeight || null,
          returnPolicy: data.returnPolicy || null,
          warrantyInfo: data.warrantyInfo || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        }
      });
      activeProductId = newProduct.id;
    }

    // Handle variants and inventory
    if (activeProductId && data.variants && data.variants.length > 0) {
      const updatedVariantIds: string[] = [];

      for (const v of data.variants) {
        let variant;
        if (v.id) {
          // Update existing variant
          variant = await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku,
              size: v.size || null,
              color: v.color || null,
              price: v.price
            }
          });
        } else {
          // Check if SKU exists
          const existingVariant = await prisma.productVariant.findUnique({
            where: { sku: v.sku }
          });
          if (existingVariant) {
            // Re-assign or update existing
            variant = await prisma.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                productId: activeProductId,
                size: v.size || null,
                color: v.color || null,
                price: v.price
              }
            });
          } else {
            // Create new
            variant = await prisma.productVariant.create({
              data: {
                productId: activeProductId,
                sku: v.sku,
                size: v.size || null,
                color: v.color || null,
                price: v.price
              }
            });
          }
        }
        updatedVariantIds.push(variant.id);

        // Upsert inventory for this variant
        await prisma.inventory.upsert({
          where: {
            variantId_warehouseId: {
              variantId: variant.id,
              warehouseId: warehouse.id
            }
          },
          update: {
            quantity: v.quantity || 0
          },
          create: {
            variantId: variant.id,
            warehouseId: warehouse.id,
            quantity: v.quantity || 0
          }
        });
      }

      // Clean up variants of this product that are no longer in the updated list
      const allProductVariants = await prisma.productVariant.findMany({
        where: { productId: activeProductId }
      });
      for (const pv of allProductVariants) {
        if (!updatedVariantIds.includes(pv.id)) {
          try {
            await prisma.productVariant.delete({ where: { id: pv.id } });
          } catch (e) {
            console.warn("Could not delete variant because it is referenced in orders:", pv.id);
          }
        }
      }
    }

    revalidatePath("/seller/products");
    return { 
      success: true, 
      message: productId ? "Product updated successfully" : "Product created successfully" 
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save product" };
  }
}

export async function deleteSellerProductAction(productId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing || existing.sellerId !== seller.id) {
      return { success: false, message: "Product not found or unauthorized" };
    }

    // Delete relation records if any, then product
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/seller/products");
    return { success: true, message: "Product deleted successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete product" };
  }
}

export async function updateSellerOrderStatusAction(orderId: string, status: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    // Basic verification: update order status directly
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath("/seller/orders");
    return { success: true, message: "Order status updated successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update order" };
  }
}

export async function updateSellerOrderLogisticsAction(
  orderId: string,
  data: {
    status: string;
    shippingProvider: string | null;
    trackingNumber: string | null;
  }
) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
        shippingProvider: data.shippingProvider,
        trackingNumber: data.trackingNumber
      }
    });

    // Create a tracking milestone
    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: data.status,
        location: data.shippingProvider ? `Dispatched via ${data.shippingProvider}` : "Order Updated by Vendor",
        timestamp: new Date()
      }
    });

    revalidatePath("/seller/orders");
    revalidatePath(`/track-order`);
    return { success: true, message: "Order logistics updated successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update order logistics" };
  }
}
