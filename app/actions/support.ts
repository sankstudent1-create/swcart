"use server";

import { getSessionUserId, checkSuperAdmin } from "./auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addTicketMessageAction(ticketId: string, body: string) {
  const isSuperAdmin = await checkSuperAdmin();
  const userId = await getSessionUserId();

  if (!isSuperAdmin || !userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if a conversation exists, if not create one
    let conversation = await prisma.conversation.findFirst({
      where: { supportTicketId: ticketId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          supportTicketId: ticketId,
        }
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body,
      }
    });

    // Update ticket to In Progress if it was OPEN
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (ticket && ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" }
      });
    }

    revalidatePath(`/spr/admin/support/${ticketId}`);
    return { success: true, message: "Reply sent successfully!" };
  } catch (error: any) {
    console.error("Support Reply Error:", error);
    return { success: false, error: error.message || "Failed to send reply." };
  }
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status }
    });
    
    revalidatePath(`/spr/admin/support`);
    revalidatePath(`/spr/admin/support/${ticketId}`);
    return { success: true, message: "Status updated successfully!" };
  } catch (error: any) {
    console.error("Support Status Error:", error);
    return { success: false, error: error.message || "Failed to update status." };
  }
}
