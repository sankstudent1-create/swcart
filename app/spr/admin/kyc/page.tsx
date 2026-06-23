import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import KycManager from "./KycManager";

export default async function AdminKycPage() {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sellers = await prisma.seller.findMany({
    where: { kycStatus: "PENDING" },
    include: { user: true },
    orderBy: { user: { createdAt: "asc" } }
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">KYC Verification Hub</h2>
          <p className="text-muted mb-0">Review and approve pending seller applications.</p>
        </div>
      </div>
      <KycManager sellers={JSON.parse(JSON.stringify(sellers))} />
    </div>
  );
}
