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

export async function saveSellerProductAction(productId: string | null, data: { title: string, description: string, basePrice: number, categoryId: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    if (productId) {
      // Update
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
          categoryId: data.categoryId
        }
      });
      revalidatePath("/seller/products");
      return { success: true, message: "Product updated successfully" };
    } else {
      // Create
      await prisma.product.create({
        data: {
          sellerId: seller.id,
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          basePrice: data.basePrice,
          images: []
        }
      });
      revalidatePath("/seller/products");
      return { success: true, message: "Product created successfully" };
    }
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
