"use server";

import { prisma } from "@/lib/db";
import { checkSuperAdmin } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export async function executeMacroAction(macroId: string, targetId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized. God Mode restricted." };

  try {
    switch (macroId) {
      case "WIPE_USER":
        // Delete User and let Prisma Cascade handle Orders, Cart, Wishlist, etc.
        // Wait, not all relations have Cascade. 
        // We will perform a targeted hard delete in a transaction.
        await prisma.$transaction(async (tx) => {
          // Delete Seller if exists
          const seller = await tx.seller.findUnique({ where: { userId: targetId } });
          if (seller) {
            await tx.product.deleteMany({ where: { sellerId: seller.id } });
            await tx.sellerOrder.deleteMany({ where: { sellerId: seller.id } });
            await tx.seller.delete({ where: { id: seller.id } });
          }

          // Delete Orders
          await tx.order.deleteMany({ where: { userId: targetId } });
          
          // Delete other relations explicitly if needed
          await tx.cart.deleteMany({ where: { userId: targetId } });
          await tx.wishlist.deleteMany({ where: { userId: targetId } });
          await tx.customerProfile.deleteMany({ where: { userId: targetId } });
          await tx.userRole.deleteMany({ where: { userId: targetId } });

          // Finally delete the user
          await tx.user.delete({ where: { id: targetId } });
        });
        
        revalidatePath("/superad");
        return { success: true, message: `User ${targetId} and all associated records have been wiped.` };

      case "FORCE_DELIVER":
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({ where: { id: targetId }, include: { sellerOrders: true } });
          if (!order) throw new Error("Order not found.");

          await tx.order.update({
            where: { id: targetId },
            data: { status: "DELIVERED" }
          });

          await tx.sellerOrder.updateMany({
            where: { orderId: targetId },
            data: { status: "DELIVERED" }
          });

          await tx.trackingHistory.create({
            data: {
              orderId: targetId,
              status: "Delivered",
              location: "Force updated by SuperAdmin",
              timestamp: new Date()
            }
          });
        });

        revalidatePath("/superad");
        return { success: true, message: `Order ${targetId} has been forcibly marked as DELIVERED.` };

      case "ARCHIVE_SELLER":
        await prisma.$transaction(async (tx) => {
          const seller = await tx.seller.findUnique({ where: { id: targetId } });
          if (!seller) throw new Error("Seller not found.");

          await tx.seller.update({
            where: { id: targetId },
            data: { kycStatus: "REJECTED", isVerified: false, deletedAt: new Date() }
          });

          await tx.product.updateMany({
            where: { sellerId: targetId },
            data: { isPublished: false, deletedAt: new Date() }
          });
        });

        revalidatePath("/superad");
        return { success: true, message: `Seller ${targetId} has been archived and products unpublished.` };

      default:
        return { success: false, message: "Unknown Macro ID." };
    }
  } catch (error: any) {
    console.error("Macro Error:", error);
    return { success: false, message: error.message || "An error occurred executing the macro." };
  }
}
