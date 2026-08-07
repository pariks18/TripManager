import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; settlementId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, note } = await request.json();

    if (!action || !['APPROVE', 'REJECT', 'CONFIRM'].includes(action)) {
      return NextResponse.json({ error: 'Invalid settlement action' }, { status: 400 });
    }

    const targetStatus = action === 'REJECT' ? 'REJECTED' : 'CONFIRMED';

    const record = await dbStore.updateSettlementStatus(
      params.tripId,
      params.settlementId,
      user.id,
      targetStatus,
      note
    );

    return NextResponse.json({ record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settlement status' }, { status: 400 });
  }
}
