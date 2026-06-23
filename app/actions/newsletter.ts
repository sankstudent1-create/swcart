"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function subscribeNewsletterAction(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true },
        });
        return { success: true, message: "Subscription reactivated successfully!" };
      }
      return { success: true, message: "You are already subscribed to our newsletter." };
    }

    await prisma.newsletterSubscriber.create({
      data: { email },
    });

    return { success: true, message: "Successfully subscribed to the newsletter!" };
  } catch (error: any) {
    console.error("Newsletter error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
