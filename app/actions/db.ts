"use server";

import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteRecordAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  const model = formData.get("model") as string;
  const id = formData.get("id") as string;
  
  if (!model || !id) return { success: false, message: "Missing model or id" };

  try {
    const prismaModel = (prisma as any)[model];
    if (prismaModel && prismaModel.delete) {
      await prismaModel.delete({ where: { id } });
      revalidatePath(`/spr/admin/db/${model.toLowerCase()}`);
      return { success: true, message: "Record deleted successfully" };
    }
  } catch (error: any) {
    console.error(`Failed to delete record ${id} from ${model}`, error);
    return { success: false, message: error.message || "Failed to delete record" };
  }
}

export async function saveRecordAction(modelName: string, id: string | null, fieldsData: Record<string, any>) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return { success: false, message: "Unauthorized" };

  try {
    const prismaModel = (prisma as any)[modelName];
    if (!prismaModel) return { success: false, message: `Model ${modelName} not found` };

    if (id) {
      // Update
      await prismaModel.update({
        where: { id },
        data: fieldsData
      });
      revalidatePath(`/spr/admin/db/${modelName.toLowerCase()}`);
      return { success: true, message: "Record updated successfully" };
    } else {
      // Create
      await prismaModel.create({
        data: fieldsData
      });
      revalidatePath(`/spr/admin/db/${modelName.toLowerCase()}`);
      return { success: true, message: "Record created successfully" };
    }
  } catch (error: any) {
    console.error(`Failed to save record in ${modelName}`, error);
    return { success: false, message: error.message || "Failed to save record" };
  }
}
