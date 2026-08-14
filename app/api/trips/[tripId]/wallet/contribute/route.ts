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
      return NextResponse.json({ error: 'Contribution amount must be greater than zero.' }, { status: 400 });
    }

    const contribution = await dbStore.contributeToWallet(params.tripId, user.id, numAmount, note);
    return NextResponse.json({ contribution }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST /api/trips/[tripId]/wallet/contribute error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit wallet contribution' }, { status: 400 });
  }
}
