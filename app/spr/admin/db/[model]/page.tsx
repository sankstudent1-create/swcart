import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import DbTableManager from "./DbTableManager";

export default async function GenericDbPage({ params, searchParams }: { params: Promise<{ model: string }>, searchParams: Promise<{ page?: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const { model } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const take = 20;
  const skip = (page - 1) * take;

  const modelMeta = Prisma.dmmf.datamodel.models.find(m => m.name.toLowerCase() === model.toLowerCase());
  
  if (!modelMeta) {
    return (
      <div className="text-center py-5">
        <h3 className="text-muted fw-bold">Model Not Found</h3>
        <p>The table "{model}" does not exist in the database schema.</p>
      </div>
    );
  }

  const scalarFields = modelMeta.fields.filter(f => f.kind === "scalar");
  const prismaModelName = modelMeta.name.charAt(0).toLowerCase() + modelMeta.name.slice(1);
  const prismaModel = (prisma as any)[prismaModelName];
  
  if (!prismaModel) {
    return <div className="text-danger">Error: Prisma model {prismaModelName} not accessible.</div>;
  }

  // Detect relation fields pointing to User
  const includeQuery: Record<string, any> = {};
  const userRelations = modelMeta.fields.filter(f => f.kind === "object" && f.type === "User");
  userRelations.forEach(r => {
    includeQuery[r.name] = {
      select: { id: true, name: true, avatar: true, email: true }
    };
  });

  const [records, totalCount, allUsers] = await Promise.all([
    prismaModel.findMany({
      take,
      skip,
      include: Object.keys(includeQuery).length > 0 ? includeQuery : undefined,
      orderBy: scalarFields.some(f => f.name === 'createdAt') ? { createdAt: 'desc' } : undefined
    }).catch(() => []),
    prismaModel.count().catch(() => 0),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: "asc" }
    }).catch(() => [])
  ]);

  const totalPages = Math.ceil(totalCount / take);

  // Map fields format safely for client
  const fields = scalarFields.map(f => {
    // Check if this field corresponds to a User relation
    const rel = modelMeta.fields.find(rf => rf.kind === "object" && rf.type === "User" && rf.relationToFields?.includes(f.name));
    return {
      name: f.name,
      type: f.type,
      isRequired: f.isRequired,
      isId: f.isId,
      isList: f.isList,
      isUserRelation: !!rel
    };
  });

  // Clean objects so they are serializable (converting Date objects to string, etc.)
  const serializedRecords = JSON.parse(JSON.stringify(records));
  const serializedUsers = JSON.parse(JSON.stringify(allUsers));

  return (
    <DbTableManager 
      modelName={modelMeta.name}
      fields={fields}
      initialRecords={serializedRecords}
      totalPages={totalPages}
      currentPage={page}
      allUsers={serializedUsers}
    />
  );
}
