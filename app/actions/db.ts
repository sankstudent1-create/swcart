"use server";

import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteRecordAction(formData: FormData) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) return;

  const model = formData.get("model") as string;
  const id = formData.get("id") as string;
  
  if (!model || !id) return;

  try {
    const prismaModel = (prisma as any)[model];
    if (prismaModel && prismaModel.delete) {
      await prismaModel.delete({ where: { id } });
      revalidatePath(`/spr/admin/db/${model.toLowerCase()}`);
    }
  } catch (error) {
    console.error(`Failed to delete record ${id} from ${model}`, error);
  }
}
