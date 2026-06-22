import { prisma } from './db';
import { getSessionUserId } from '@/app/actions/auth';

/** Generic role guard – throws if the current user does not have the requested role */
export async function requireRole(role: string): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('Unauthenticated');

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: { name: role }
    }
  });

  if (!userRole) throw new Error('Access denied');
  return userId;
}

/** Convenience helpers */
export async function requireSeller(): Promise<string> {
  const userId = await requireRole('SELLER');
  
  const seller = await prisma.seller.findUnique({
    where: { userId }
  });
  
  if (!seller) throw new Error('Seller profile not found');
  return seller.id;
}

export async function requireSuperAdmin(): Promise<string> {
  const userId = await requireRole('SUPER_ADMIN');
  return userId;
}

