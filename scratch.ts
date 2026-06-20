import { Prisma } from '@prisma/client';

console.log(Object.keys(Prisma.dmmf));
console.log(Prisma.dmmf.datamodel.models.map(m => m.name).join(", "));
