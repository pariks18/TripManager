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

    if (!action || !['APPROVE', 'REJECT', 'CONFIRM', 'REQUEST_ROLLBACK', 'APPROVE_ROLLBACK', 'REJECT_ROLLBACK'].includes(action)) {
      return NextResponse.json({ error: 'Invalid settlement action' }, { status: 400 });
    }

    let targetStatus: 'CONFIRMED' | 'REJECTED' | 'ROLLBACK_REQUESTED' | 'ROLLED_BACK' = 'CONFIRMED';
    if (action === 'REJECT') {
      targetStatus = 'REJECTED';
    } else if (action === 'REQUEST_ROLLBACK') {
      targetStatus = 'ROLLBACK_REQUESTED';
    } else if (action === 'APPROVE_ROLLBACK') {
      targetStatus = 'ROLLED_BACK';
    } else if (action === 'REJECT_ROLLBACK') {
      targetStatus = 'CONFIRMED';
    } else {
      targetStatus = 'CONFIRMED';
    }

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

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; settlementId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await dbStore.deleteSettlement(params.tripId, params.settlementId, user.id);
    if (!success) {
      return NextResponse.json({ error: 'Settlement request not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Settlement request cancelled successfully' });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to cancel settlement request' }, { status });
  }
}
