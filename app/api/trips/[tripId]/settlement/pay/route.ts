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
    const { fromUserId, toUserId, paymentAmount, note, isHostRecord } = await request.json();

    if (!fromUserId || !toUserId || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid settlement payment payload' }, { status: 400 });
    }

    if (isHostRecord) {
      const record = await dbStore.recordHostPayment(
        params.tripId,
        user.id,
        fromUserId,
        toUserId,
        paymentAmount,
        note
      );
      return NextResponse.json({ record });
    }

    if (fromUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only make settlement payments for your own debts' },
        { status: 403 }
      );
    }

    const record = await dbStore.paySettlement(
      params.tripId,
      user.id,
      fromUserId,
      toUserId,
      paymentAmount,
      note
    );

    return NextResponse.json({ record });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to process settlement payment' }, { status });
  }
}
