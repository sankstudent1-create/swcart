import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProductById } from "@/lib/queries";
import ProductDetailClient from "./ProductDetailClient";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProductById(id);

  if (!p) notFound();

  // Serialize dates
  const product = JSON.parse(JSON.stringify(p));

  return <ProductDetailClient product={product} />;
}
