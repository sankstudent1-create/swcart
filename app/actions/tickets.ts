"use server";

import { checkSuperAdmin, getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function sendTicketMessageAction(ticketId: string, body: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "User session not found" };

  if (!body.trim()) return { success: false, message: "Message body cannot be empty" };

  try {
    // 1. Find or create a conversation for this ticket
    let conversation = await prisma.conversation.findFirst({
      where: { supportTicketId: ticketId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { supportTicketId: ticketId }
      });
    }

    // 2. Add message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body
      }
    });

    // 3. Mark ticket as IN_PROGRESS if it was OPEN
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (ticket && ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" }
      });
    } else {
      // Touch the ticket's updatedAt
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      });
    }

    revalidatePath(`/spr/admin/support`);
    revalidatePath(`/spr/admin/support/${ticketId}`);
    return { success: true, message: "Message sent successfully" };
  } catch (error: any) {
    console.error("Failed to send ticket message", error);
    return { success: false, message: error.message || "Failed to send message" };
  }
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status }
    });
    revalidatePath(`/spr/admin/support`);
    revalidatePath(`/spr/admin/support/${ticketId}`);
    return { success: true, message: "Ticket status updated successfully" };
  } catch (error: any) {
    console.error("Failed to update ticket status", error);
    return { success: false, message: error.message || "Failed to update status" };
  }
}
