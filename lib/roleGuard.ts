import { supabaseAdmin } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

/** Retrieve the logged‑in user ID from the session cookie */
async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('swcart_session')?.value;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

/** Generic role guard – throws if the current user does not have the requested role */
export async function requireRole(role: string): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new Error('Unauthenticated');
  const { data, error } = await supabaseAdmin
    .from('UserRole')
    .select('role')
    .eq('userId', userId);
  if (error) throw new Error('Failed to fetch roles');
  const roles = data as { role: string }[];
  if (!roles.some(r => r.role === role)) throw new Error('Access denied');
  return userId;
}

/** Convenience helpers */
export async function requireSeller(): Promise<string> {
  const userId = await requireRole('SELLER');
  // fetch the Seller record to obtain its ID (used for scoping queries)
  const { data, error } = await supabaseAdmin
    .from('Seller')
    .select('id')
    .eq('userId', userId)
    .single();
  if (error) throw new Error('Seller profile not found');
  return data.id as string;
}

export async function requireSuperAdmin(): Promise<string> {
  const userId = await requireRole('SUPER_ADMIN');
  return userId;
}
