"use server";

import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Admin quick-action: Force update an order's status from the support panel.
 */
export async function adminForceOrderStatusAction(orderId: string, status: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status } });
    // Add tracking history entry
    await prisma.trackingHistory.create({
      data: { orderId, status: `Admin override → ${status}`, location: "Support Resolution" }
    });
    revalidatePath("/spr/admin/support");
    return { success: true, message: `Order status updated to ${status}` };
  } catch (e: any) {
    return { success: false, message: e.message || "Failed to update order" };
  }
}

/**
 * Admin quick-action: Approve a pending refund.
 */
export async function adminApproveRefundAction(refundId: string, orderId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.refund.update({ where: { id: refundId }, data: { status: "APPROVED" } });
    await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    revalidatePath("/spr/admin/support");
    return { success: true, message: "Refund approved and order cancelled" };
  } catch (e: any) {
    return { success: false, message: e.message || "Failed to approve refund" };
  }
}

/**
 * Admin quick-action: Mark a failed payment as manually verified/success.
 */
export async function adminMarkPaymentSuccessAction(paymentId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "SUCCESS" } });
    revalidatePath("/spr/admin/support");
    return { success: true, message: "Payment marked as SUCCESS" };
  } catch (e: any) {
    return { success: false, message: e.message || "Failed to update payment" };
  }
}

/**
 * Admin quick-action: Force cancel an order.
 */
export async function adminCancelOrderAction(orderId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await prisma.trackingHistory.create({
      data: { orderId, status: "Cancelled by Admin", location: "Support Resolution" }
    });
    revalidatePath("/spr/admin/support");
    return { success: true, message: "Order cancelled by admin" };
  } catch (e: any) {
    return { success: false, message: e.message || "Failed to cancel order" };
  }
}

/**
 * Admin quick-action: Escalate ticket (mark IN_PROGRESS + add an internal note).
 */
export async function adminEscalateTicketAction(ticketId: string, note: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };
  try {
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } });
    revalidatePath("/spr/admin/support");
    return { success: true, message: "Ticket escalated to In Progress" };
  } catch (e: any) {
    return { success: false, message: e.message || "Failed to escalate ticket" };
  }
}
