"use server";

import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId: string, status: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath("/spr/admin/orders");
    revalidatePath("/spr/admin");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update order status" };
  }
}

export async function updateSettingsAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const defaultGst = parseFloat(formData.get("defaultGst") as string) || 18;
    const deliveryFee = parseFloat(formData.get("deliveryFee") as string) || 50;
    const freeShippingThresh = parseFloat(formData.get("freeShippingThresh") as string) || 499;
    const contactEmail = formData.get("contactEmail") as string || "support@swcart.com";
    const autoApproveSellers = formData.get("autoApproveSellers") === "true";

    await prisma.siteSetting.upsert({
      where: { id: "GLOBAL" },
      update: { defaultGst, deliveryFee, freeShippingThresh, contactEmail, autoApproveSellers },
      create: { id: "GLOBAL", defaultGst, deliveryFee, freeShippingThresh, contactEmail, autoApproveSellers }
    });

    revalidatePath("/spr/admin/settings");
    return { success: true, message: "Settings updated successfully" };
  } catch (error) {
    console.error("updateSettingsAction error:", error);
    return { success: false, message: "Failed to update settings" };
  }
}

// ==========================================
// SELLER APPLICATION MANAGEMENT
// ==========================================
export async function handleSellerApplicationAction(applicationId: string, action: 'APPROVE' | 'REJECT') {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const app = await prisma.sellerApplication.findUnique({
      where: { id: applicationId }
    });

    if (!app) {
      return { success: false, message: "Application not found." };
    }

    if (action === "APPROVE") {
      const role = await prisma.role.upsert({
        where: { name: "SELLER" },
        update: {},
        create: { name: "SELLER", description: "Product Seller / Vendor" }
      });

      // Grant SELLER role
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: app.userId, roleId: role.id } },
        update: {},
        create: { userId: app.userId, roleId: role.id }
      });

      // Create Seller record
      await prisma.seller.upsert({
        where: { userId: app.userId },
        update: {
          companyName: app.companyName,
          gstNumber: app.gstNumber,
          bankDetails: app.bankDetails ?? undefined,
          isVerified: true
        },
        create: {
          userId: app.userId,
          companyName: app.companyName,
          gstNumber: app.gstNumber,
          bankDetails: app.bankDetails ?? undefined,
          isVerified: true
        }
      });

      // Update status to APPROVED
      await prisma.sellerApplication.update({
        where: { id: applicationId },
        data: { status: "APPROVED" }
      });
    } else {
      // Reject application
      await prisma.sellerApplication.update({
        where: { id: applicationId },
        data: { status: "REJECTED" }
      });
    }

    revalidatePath("/spr/admin/sellers");
    return { success: true, message: `Application ${action === "APPROVE" ? "approved" : "rejected"} successfully.` };
  } catch (error: any) {
    console.error("handleSellerApplicationAction error:", error);
    return { success: false, message: "Failed to handle seller application." };
  }
}

// ==========================================
// USER ROLE MANAGEMENT
// ==========================================
export async function updateUserRoleAction(targetUserId: string, roleName: string, action: 'ADD' | 'REMOVE') {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });

    if (action === "ADD") {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: targetUserId, roleId: role.id } },
        update: {},
        create: { userId: targetUserId, roleId: role.id }
      });

      // If making a Seller, ensure the seller profile is instantiated
      if (roleName === "SELLER") {
        await prisma.seller.upsert({
          where: { userId: targetUserId },
          update: { isVerified: true },
          create: {
            userId: targetUserId,
            companyName: "Default Store",
            isVerified: true
          }
        });
      }
    } else {
      await prisma.userRole.delete({
        where: { userId_roleId: { userId: targetUserId, roleId: role.id } }
      });
    }

    revalidatePath(`/spr/admin/users/${targetUserId}`);
    revalidatePath("/spr/admin/users");
    return { success: true, message: `Role ${roleName} ${action === "ADD" ? "granted" : "revoked"} successfully.` };
  } catch (error: any) {
    console.error("updateUserRoleAction error:", error);
    return { success: false, message: "Failed to update user role." };
  }
}

// ==========================================
// COUPON MANAGEMENT
// ==========================================
export async function createCouponAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const code = (formData.get("code") as string).toUpperCase().trim();
    const discountType = formData.get("discountType") as string;
    const discountVal = parseFloat(formData.get("discountVal") as string);
    const minSpend = formData.get("minSpend") ? parseFloat(formData.get("minSpend") as string) : null;
    const maxDiscount = formData.get("maxDiscount") ? parseFloat(formData.get("maxDiscount") as string) : null;
    const validUntil = new Date(formData.get("validUntil") as string);
    const usageLimit = formData.get("usageLimit") ? parseInt(formData.get("usageLimit") as string) : null;

    if (!code || !discountType || isNaN(discountVal)) {
      return { success: false, message: "Required fields are missing." };
    }

    await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountVal,
        minSpend,
        maxDiscount,
        validUntil,
        usageLimit
      }
    });

    revalidatePath("/spr/admin/coupons");
    return { success: true, message: "Coupon created successfully." };
  } catch (error: any) {
    console.error("createCouponAction error:", error);
    if (error.code === "P2002") {
      return { success: false, message: "A coupon with this code already exists." };
    }
    return { success: false, message: "Failed to create coupon." };
  }
}

export async function deleteCouponAction(couponId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.coupon.delete({ where: { id: couponId } });
    revalidatePath("/spr/admin/coupons");
    return { success: true, message: "Coupon deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete coupon." };
  }
}

// ==========================================
// OFFERS MANAGEMENT
// ==========================================
export async function createOfferAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || null;
    const bannerImage = formData.get("bannerImage") as string || null;
    const validFrom = new Date(formData.get("validFrom") as string);
    const validUntil = new Date(formData.get("validUntil") as string);
    const isActive = formData.get("isActive") === "true";

    if (!title || isNaN(validFrom.getTime()) || isNaN(validUntil.getTime())) {
      return { success: false, message: "Required fields are missing." };
    }

    await prisma.offer.create({
      data: {
        title,
        description,
        bannerImage,
        validFrom,
        validUntil,
        isActive
      }
    });

    revalidatePath("/spr/admin/offers");
    return { success: true, message: "Offer created successfully." };
  } catch (error) {
    console.error("createOfferAction error:", error);
    return { success: false, message: "Failed to create offer." };
  }
}

export async function deleteOfferAction(offerId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.offer.delete({ where: { id: offerId } });
    revalidatePath("/spr/admin/offers");
    return { success: true, message: "Offer deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete offer." };
  }
}
