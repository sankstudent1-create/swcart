"use server";

import { prisma } from "@/lib/db";
import { checkSuperAdmin } from "./auth";
import { revalidatePath } from "next/cache";

// --- COUPONS ---
export async function createCouponAction(data: any) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountVal: Number(data.discountVal),
        minSpend: data.minSpend ? Number(data.minSpend) : null,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      }
    });
    revalidatePath("/spr/admin/coupons");
    return { success: true, message: "Coupon created" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create coupon" };
  }
}

export async function deleteCouponAction(id: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/spr/admin/coupons");
    return { success: true, message: "Coupon deleted" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete coupon" };
  }
}

// --- OFFERS ---
export async function createOfferAction(data: any) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.offer.create({
      data: {
        title: data.title,
        description: data.description || null,
        bannerImage: data.bannerImage || null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        isActive: data.isActive
      }
    });
    revalidatePath("/spr/admin/offers");
    return { success: true, message: "Offer created" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create offer" };
  }
}

export async function toggleOfferAction(id: string, isActive: boolean) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.offer.update({ where: { id }, data: { isActive } });
    revalidatePath("/spr/admin/offers");
    return { success: true, message: "Offer updated" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update offer" };
  }
}

export async function deleteOfferAction(id: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.offer.delete({ where: { id } });
    revalidatePath("/spr/admin/offers");
    return { success: true, message: "Offer deleted" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete offer" };
  }
}

// --- SETTINGS ---
export async function updateSettingsAction(data: any) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.siteSetting.upsert({
      where: { id: "GLOBAL" },
      update: {
        brandName: data.brandName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        defaultGst: Number(data.defaultGst),
        deliveryFee: Number(data.deliveryFee),
        freeShippingThresh: Number(data.freeShippingThresh),
      },
      create: {
        id: "GLOBAL",
        brandName: data.brandName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        defaultGst: Number(data.defaultGst),
        deliveryFee: Number(data.deliveryFee),
        freeShippingThresh: Number(data.freeShippingThresh),
      }
    });
    revalidatePath("/spr/admin/settings");
    return { success: true, message: "Settings updated" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update settings" };
  }
}

// --- SELLERS ---
export async function verifySellerAction(id: string, isVerified: boolean) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.seller.update({ where: { id }, data: { isVerified } });
    revalidatePath("/spr/admin/sellers");
    return { success: true, message: isVerified ? "Seller Verified" : "Seller Unverified" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update seller" };
  }
}

// --- ROLES ---
export async function assignRoleAction(userId: string, roleName: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleName } });
    }
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id }
    });
    revalidatePath("/spr/admin/roles");
    return { success: true, message: "Role assigned" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign role" };
  }
}

export async function removeRoleAction(userId: string, roleId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } });
    revalidatePath("/spr/admin/roles");
    return { success: true, message: "Role removed" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to remove role" };
  }
}
