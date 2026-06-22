import { redirect } from "next/navigation";

// This page exists only to redirect old ?id= links to the new dynamic route /product/[id]
export default async function OldProductPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const id = sp.id;
  if (id) {
    redirect(`/product/${id}`);
  }
  // No ID provided — redirect to homepage
  redirect("/");
}
