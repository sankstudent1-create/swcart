"use server";

import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addAddressAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  const street = formData.get("street") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const postalCode = formData.get("postalCode") as string;
  const country = formData.get("country") as string || "India";

  if (!street || !city || !state || !postalCode) {
    return { success: false, message: "Missing required fields" };
  }

  try {
    const profile = await prisma.customerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    const existingCount = await prisma.address.count({
      where: { customerProfileId: profile.id }
    });

    await prisma.address.create({
      data: {
        customerProfileId: profile.id,
        street,
        city,
        state,
        postalCode,
        country,
        isDefault: existingCount === 0
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to add address" };
  }
}

export async function deleteAddressAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return;

  const addressId = formData.get("addressId") as string;
  if (!addressId) return;

  try {
    // Basic authorization check
    const address = await prisma.address.findUnique({
      where: { id: addressId },
      include: { customerProfile: true }
    });

    if (address?.customerProfile.userId === userId) {
      await prisma.address.delete({ where: { id: addressId } });
      revalidatePath("/profile");
    }
  } catch (error) {
    console.error(error);
  }
}

export async function setDefaultAddressAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) return;

  const addressId = formData.get("addressId") as string;
  if (!addressId) return;

  try {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
      include: { customerProfile: true }
    });

    if (address?.customerProfile.userId === userId) {
      const profileId = address.customerProfileId;
      
      // Update all to not default
      await prisma.address.updateMany({
        where: { customerProfileId: profileId },
        data: { isDefault: false },
      });
      
      // Update selected to default
      await prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
      
      revalidatePath("/profile");
    }
  } catch (error) {
    console.error(error);
  }
}

export async function updateProfileAvatarAction(avatarUrl: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    });
    revalidatePath("/profile");
    return { success: true, message: "Profile picture updated successfully." };
  } catch (error) {
    console.error("updateProfileAvatarAction error:", error);
    return { success: false, message: "Failed to update profile picture." };
  }
}

