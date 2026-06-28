import { prisma } from './lib/db';


async function main() {
  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: true } }
    }
  });
  console.dir(users, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
