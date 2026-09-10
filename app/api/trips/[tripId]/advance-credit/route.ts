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

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Advance credit amount must be a positive number greater than zero' },
        { status: 400 }
      );
    }

    const record = await dbStore.addAdvanceCredit(
      params.tripId,
      user.id,
      amount,
      note
    );

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to submit Advance Credit request' },
      { status }
    );
  }
}
