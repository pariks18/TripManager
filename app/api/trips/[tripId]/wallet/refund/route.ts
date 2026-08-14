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
    const wallet = await dbStore.refundWalletBalance(params.tripId, user.id);
    return NextResponse.json({ wallet, message: 'Remaining wallet balance successfully refunded to contributors.' });
  } catch (error: any) {
    console.error('[API POST /api/trips/[tripId]/wallet/refund error]:', error);
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to refund wallet balance' }, { status });
  }
}
