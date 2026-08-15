import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wallet = await dbStore.getOrCreateUserWallet(user.id, params.tripId);
    return NextResponse.json({ wallet, message: 'Personal wallet balance is maintained per user.' });
  } catch (error: any) {
    console.error('[API POST /api/trips/[tripId]/wallet/refund error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch personal wallet' }, { status: 400 });
  }
}
