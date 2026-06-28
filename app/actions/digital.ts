"use server";

import { prisma } from "@/lib/db";
import { getSessionUserId } from "./auth";
import { revalidatePath } from "next/cache";

// 1. Save or Update base Digital Product (Title, Price, etc.)
export async function saveDigitalProductAction(
  productId: string | null,
  data: {
    title: string;
    description: string;
    basePrice: number;
    discountPercent: number;
    categoryId: string;
    images: string[];
    isPublished: boolean;
    productType: "DIGITAL" | "SERVICE";
  }
) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    if (productId) {
      // Update
      const existing = await prisma.product.findUnique({ where: { id: productId } });
      if (!existing || existing.sellerId !== seller.id) {
        return { success: false, message: "Product not found or unauthorized access" };
      }
      await prisma.product.update({
        where: { id: productId },
        data: {
          title: data.title,
          description: data.description,
          basePrice: data.basePrice,
          discountPercent: data.discountPercent,
          categoryId: data.categoryId,
          images: data.images,
          isPublished: data.isPublished,
          productType: data.productType,
        },
      });
      revalidatePath(`/seller/digital`);
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Digital product updated", productId };
    } else {
      // Create
      const newProduct = await prisma.product.create({
        data: {
          sellerId: seller.id,
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          basePrice: data.basePrice,
          discountPercent: data.discountPercent,
          images: data.images,
          isPublished: data.isPublished,
          productType: data.productType,
        },
      });
      revalidatePath(`/seller/digital`);
      return { success: true, message: "Digital product created", productId: newProduct.id };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save digital product" };
  }
}

// 2. Save or Update Chapter
export async function saveCourseChapterAction(
  productId: string,
  chapterId: string | null,
  data: { title: string; order: number }
) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return { success: false, message: "Seller profile not found" };

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.sellerId !== seller.id) {
      return { success: false, message: "Unauthorized product access" };
    }

    if (chapterId) {
      await prisma.courseChapter.update({
        where: { id: chapterId },
        data: { title: data.title, order: data.order },
      });
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Chapter updated" };
    } else {
      await prisma.courseChapter.create({
        data: {
          productId,
          title: data.title,
          order: data.order,
        },
      });
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Chapter created" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save chapter" };
  }
}

export async function deleteCourseChapterAction(chapterId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };
  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    const chapter = await prisma.courseChapter.findUnique({ where: { id: chapterId }, include: { product: true } });
    if (!seller || !chapter || chapter.product.sellerId !== seller?.id) return { success: false, message: "Unauthorized" };
    
    await prisma.courseChapter.delete({ where: { id: chapterId } });
    revalidatePath(`/seller/digital/studio`);
    return { success: true, message: "Chapter deleted" };
  } catch (error: any) { return { success: false, message: error.message }; }
}

// 3. Save or Update Lesson
export async function saveCourseLessonAction(
  chapterId: string,
  lessonId: string | null,
  data: {
    title: string;
    order: number;
    type: "VIDEO" | "PDF" | "TEXT";
    isFree: boolean;
    duration?: number;
    videoKey?: string;
    pdfKey?: string;
    textBody?: string;
  }
) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    const chapter = await prisma.courseChapter.findUnique({ where: { id: chapterId }, include: { product: true } });
    if (!seller || !chapter || chapter.product.sellerId !== seller.id) return { success: false, message: "Unauthorized" };

    if (lessonId) {
      await prisma.courseLesson.update({
        where: { id: lessonId },
        data: {
          title: data.title,
          order: data.order,
          type: data.type,
          isFree: data.isFree,
          duration: data.duration || null,
          videoKey: data.videoKey || null,
          pdfKey: data.pdfKey || null,
          textBody: data.textBody || null,
        },
      });
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Lesson updated" };
    } else {
      await prisma.courseLesson.create({
        data: {
          chapterId,
          title: data.title,
          order: data.order,
          type: data.type,
          isFree: data.isFree,
          duration: data.duration || null,
          videoKey: data.videoKey || null,
          pdfKey: data.pdfKey || null,
          textBody: data.textBody || null,
        },
      });
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Lesson created" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save lesson" };
  }
}

export async function deleteCourseLessonAction(lessonId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };
  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    const lesson = await prisma.courseLesson.findUnique({ where: { id: lessonId }, include: { chapter: { include: { product: true } } } });
    if (!seller || !lesson || lesson.chapter.product.sellerId !== seller?.id) return { success: false, message: "Unauthorized" };
    
    await prisma.courseLesson.delete({ where: { id: lessonId } });
    revalidatePath(`/seller/digital/studio`);
    return { success: true, message: "Lesson deleted" };
  } catch (error: any) { return { success: false, message: error.message }; }
}

// 4. Save Standalone Digital Assets (eBooks, Files)
export async function saveDigitalAssetAction(
  productId: string,
  assetId: string | null,
  data: {
    fileUrl: string;
    assetType: "EBOOK" | "COURSE" | "KEY";
  }
) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!seller || !product || product.sellerId !== seller.id) return { success: false, message: "Unauthorized" };

    if (assetId) {
      await prisma.digitalAsset.update({
        where: { id: assetId },
        data: { fileUrl: data.fileUrl, assetType: data.assetType },
      });
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Asset updated" };
    } else {
      await prisma.digitalAsset.create({
        data: {
          productId,
          fileUrl: data.fileUrl,
          assetType: data.assetType,
        },
      });
      revalidatePath(`/seller/digital/studio`);
      return { success: true, message: "Asset added" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save asset" };
  }
}

export async function deleteDigitalAssetAction(assetId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, message: "Unauthorized" };
  try {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    const asset = await prisma.digitalAsset.findUnique({ where: { id: assetId }, include: { product: true } });
    if (!seller || !asset || asset.product.sellerId !== seller?.id) return { success: false, message: "Unauthorized" };
    
    await prisma.digitalAsset.delete({ where: { id: assetId } });
    revalidatePath(`/seller/digital/studio`);
    return { success: true, message: "Asset deleted" };
  } catch (error: any) { return { success: false, message: error.message }; }
}
