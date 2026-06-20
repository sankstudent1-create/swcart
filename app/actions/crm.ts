"use server";

import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function verifySellerAction(sellerId: string, status: boolean) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    await prisma.seller.update({
      where: { id: sellerId },
      data: { isVerified: status }
    });
    revalidatePath(`/spr/admin/sellers/${sellerId}`);
    revalidatePath(`/spr/admin/sellers`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update seller" };
  }
}

export async function createRoleAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { success: false, message: "Name required" };

  try {
    await prisma.role.create({
      data: { name: name.toUpperCase(), description }
    });
    revalidatePath("/spr/admin/roles");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to create role" };
  }
}

export async function deleteRoleAction(roleId: string) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    // Delete UserRole associations first
    await prisma.userRole.deleteMany({ where: { roleId } });
    await prisma.role.delete({ where: { id: roleId } });
    revalidatePath("/spr/admin/roles");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete role" };
  }
}

export async function createCategoryAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const name = formData.get("name") as string;
  if (!name) return { success: false, message: "Name required" };

  try {
    await prisma.category.create({
      data: { name }
    });
    revalidatePath("/spr/admin/categories");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to create category" };
  }
}

export async function updateProductAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const basePrice = parseFloat(formData.get("basePrice") as string);
  const imagesRaw = formData.get("images") as string;
  const categoryId = formData.get("categoryId") as string;
  
  try {
    const images = imagesRaw.split(",").map(i => i.trim()).filter(Boolean);
    
    await prisma.product.update({
      where: { id },
      data: { title, description, basePrice, images, categoryId }
    });
    
    revalidatePath(`/spr/admin/products/${id}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update product" };
  }
}

export async function updateCategoryAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const image = formData.get("image") as string;
  
  try {
    await prisma.category.update({
      where: { id },
      data: { name, image }
    });
    
    revalidatePath(`/spr/admin/categories/${id}`);
    revalidatePath(`/spr/admin/categories`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update category" };
  }
}

export async function updateUserIdentityAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const roleName = formData.get("roleName") as string;

  try {
    await prisma.user.update({
      where: { id },
      data: { name, phone: phone || null }
    });

    if (roleName) {
       const role = await prisma.role.findUnique({ where: { name: roleName }});
       if (role) {
         const existing = await prisma.userRole.findUnique({ where: { userId_roleId: { userId: id, roleId: role.id } } });
         if (existing) {
           await prisma.userRole.delete({ where: { userId_roleId: { userId: id, roleId: role.id } } });
         } else {
           await prisma.userRole.create({ data: { userId: id, roleId: role.id } });
         }
       }
    }
    
    revalidatePath(`/spr/admin/users/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update user" };
  }
}

export async function updateSellerIdentityAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const id = formData.get("id") as string;
  const companyName = formData.get("companyName") as string;
  const gstNumber = formData.get("gstNumber") as string;

  try {
    await prisma.seller.update({
      where: { id },
      data: { companyName, gstNumber: gstNumber || null }
    });
    revalidatePath(`/spr/admin/sellers/${id}`);
    revalidatePath(`/spr/admin/sellers`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update seller" };
  }
}
