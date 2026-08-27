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
    const body = await request.json();
    const { action, note, reason, proofUrl, declineReason, hostReason } = body;

    const validActions = [
      'APPROVE',
      'CONFIRM',
      'REJECT',
      'REQUEST_REVERSAL',
      'ACCEPT_REVERSAL',
      'DECLINE_REVERSAL',
      'HOST_APPROVE_REVERSAL',
      'HOST_REJECT_REVERSAL',
      'REQUEST_ROLLBACK',
      'APPROVE_ROLLBACK',
      'REJECT_ROLLBACK',
    ];

    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid settlement action' }, { status: 400 });
    }

    let mappedAction: any = action;
    if (action === 'APPROVE' || action === 'CONFIRM') mappedAction = 'CONFIRMED';
    else if (action === 'REQUEST_ROLLBACK') mappedAction = 'REQUEST_REVERSAL';
    else if (action === 'APPROVE_ROLLBACK') mappedAction = 'HOST_APPROVE_REVERSAL';
    else if (action === 'REJECT_ROLLBACK') mappedAction = 'HOST_REJECT_REVERSAL';

    const record = await dbStore.updateSettlementStatus(
      params.tripId,
      params.settlementId,
      user.id,
      mappedAction,
      {
        note,
        reason,
        proofUrl,
        declineReason,
        hostReason,
      }
    );

    return NextResponse.json({ record });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update settlement status' }, { status });
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
