import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUserId } from '@/app/actions/auth';

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ cartCount: 0, wishCount: 0 }, { status: 200 });
  }
  const [cart, wish] = await Promise.all([
    prisma.cart.findUnique({ where: { userId }, include: { items: true } }),
    prisma.wishlist.findUnique({ where: { userId }, include: { items: true } }),
  ]);
  const cartCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const wishCount = wish?.items.length || 0;
  return NextResponse.json({ cartCount, wishCount });
}
