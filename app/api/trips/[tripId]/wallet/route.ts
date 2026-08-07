import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await dbStore.getTripWalletSummary(params.tripId);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch trip wallet summary' }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, amount, category, participantUserIds, receiptUrl, notes } = await request.json();

    if (!title || !amount || amount <= 0 || !participantUserIds || !participantUserIds.length) {
      return NextResponse.json({ error: 'Invalid wallet transaction payload' }, { status: 400 });
    }

    const transaction = await dbStore.spendFromTripWallet(
      params.tripId,
      user.id,
      title,
      parseFloat(amount),
      category || 'Miscellaneous',
      participantUserIds,
      receiptUrl,
      notes
    );

    return NextResponse.json({ transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record wallet transaction' }, { status: 400 });
  }
}
