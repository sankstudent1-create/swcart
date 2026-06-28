import { redirect } from "next/navigation";
import { getSessionUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import SecureEbookReader from "@/components/SecureEbookReader";

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { title: true },
  });
  return {
    title: product ? `Reading: ${product.title} — swcart` : "eBook Reader — swcart",
    robots: "noindex,nofollow", // Don't index reader pages
  };
}

export default async function ReadPage({ params }: Props) {
  const { productId } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect(`/login?next=/read/${productId}`);

  // Verify ownership
  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const paidOrder = enrollment
    ? null
    : await prisma.order.findFirst({
        where: {
          userId,
          status: { in: ["PAID", "PROCESSING", "DELIVERED", "COMPLETED"] },
          sellerOrders: { some: { items: { some: { variant: { product: { id: productId } } } } } },
        },
      });

  if (!enrollment && !paidOrder) {
    redirect("/library?error=not_purchased");
  }

  // Load product + ebook asset
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { digitalAssets: { take: 1 } },
  });

  if (!product || !product.digitalAssets[0]) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-muted">This eBook has no content yet.</h4>
      </div>
    );
  }

  // Load user name + email for watermark
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return (
    <SecureEbookReader
      productId={productId}
      title={product.title}
      buyerName={user?.name ?? "Reader"}
      buyerEmail={user?.email ?? ""}
      totalPages={1} // PDF.js discovers real page count after load
    />
  );
}
