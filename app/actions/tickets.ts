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

export async function createCustomerTicketAction(subject: string, messageBody: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Please log in to submit a ticket." };

  if (!subject.trim() || !messageBody.trim()) {
    return { success: false, message: "Subject and Message are required." };
  }

  try {
    // 1. Create SupportTicket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        status: "OPEN"
      }
    });

    // 2. Create Conversation
    const conversation = await prisma.conversation.create({
      data: {
        supportTicketId: ticket.id
      }
    });

    // 3. Create initial Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body: messageBody
      }
    });

    revalidatePath("/profile");
    return { success: true, message: "Support ticket created successfully!" };
  } catch (error: any) {
    console.error("Failed to create customer ticket", error);
    return { success: false, message: error.message || "Failed to create support ticket." };
  }
}

export async function sendCustomerTicketMessageAction(ticketId: string, body: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  if (!body.trim()) return { success: false, message: "Message body cannot be empty" };

  try {
    // Verify ticket ownership
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.userId !== userId) {
      return { success: false, message: "Ticket not found or unauthorized access" };
    }

    let conversation = await prisma.conversation.findFirst({
      where: { supportTicketId: ticketId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { supportTicketId: ticketId }
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body
      }
    });

    // If status was closed/resolved, reopen to OPEN
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "OPEN", updatedAt: new Date() }
      });
    } else {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      });
    }

    revalidatePath("/profile");
    return { success: true, message: "Message sent successfully" };
  } catch (error: any) {
    console.error("Failed to send customer ticket message", error);
    return { success: false, message: error.message || "Failed to send message" };
  }
}
