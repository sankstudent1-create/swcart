import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import RoleManager from "./RoleManager";

export default async function RolesPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const users = await prisma.user.findMany({
    include: { roles: { include: { role: true } } },
    orderBy: { name: "asc" }
  });

  const allRoles = ["SUPER_ADMIN", "SITE_ADMIN", "OFFICE_ASSISTANT", "SELLER", "CUSTOMER", "DELIVERY"];

  return <RoleManager users={users} allRoles={allRoles} />;
}
