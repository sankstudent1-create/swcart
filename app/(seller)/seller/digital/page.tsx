import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SellerDigitalManager from "./SellerDigitalManager";

export default async function SellerDigitalPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) redirect("/sell");

  // Fetch all digital products for this seller
  const products = await prisma.product.findMany({
    where: {
      sellerId: seller.id,
      productType: { in: ["DIGITAL", "SERVICE"] }
    },
    include: {
      digitalAssets: true,
      courseChapters: {
        include: {
          lessons: {
            orderBy: { order: "asc" }
          }
        },
        orderBy: { order: "asc" }
      },
      _count: {
        select: { courseEnrollments: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Consumer analytics: enrollments with user + lesson progress
  const enrollments = await prisma.userCourseEnrollment.findMany({
    where: {
      product: { sellerId: seller.id }
    },
    include: {
      user: { select: { name: true, email: true, avatar: true } },
      product: {
        select: {
          id: true,
          title: true,
          courseChapters: {
            include: { lessons: { select: { id: true } } }
          }
        }
      }
    },
    orderBy: { enrolledAt: "desc" },
    take: 200
  });

  // Per-user lesson progress for each enrollment
  const allUserIds = [...new Set(enrollments.map(e => e.userId))];
  const allProductIds = [...new Set(enrollments.map(e => e.productId))];

  const progressRecords = await prisma.userLessonProgress.findMany({
    where: {
      userId: { in: allUserIds },
      lesson: {
        chapter: {
          productId: { in: allProductIds }
        }
      }
    },
    include: {
      lesson: {
        include: { chapter: { select: { productId: true } } }
      }
    }
  });

  return (
    <SellerDigitalManager
      products={JSON.parse(JSON.stringify(products))}
      enrollments={JSON.parse(JSON.stringify(enrollments))}
      progressRecords={JSON.parse(JSON.stringify(progressRecords))}
      sellerId={seller.id}
      sellerName={seller.companyName}
    />
  );
}
