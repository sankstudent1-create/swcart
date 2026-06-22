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
