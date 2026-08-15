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
    const { amount, note } = await request.json();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Advance amount must be greater than zero.' }, { status: 400 });
    }

    const advance = await dbStore.requestWalletAdvance(user.id, params.tripId, numAmount, note);
    return NextResponse.json({ advance }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST /api/trips/[tripId]/wallet/advance error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit advance request' }, { status: 400 });
  }
}
