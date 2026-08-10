import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; contributionId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, reason } = await request.json();

    if (!action || !['APPROVE', 'REJECT', 'DELETE', 'VOID'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      await dbStore.approveAdvanceContribution(params.contributionId, user.id);
    } else if (action === 'DELETE' || action === 'VOID') {
      await dbStore.deleteAdvanceContribution(params.contributionId, user.id, reason);
    } else {
      await dbStore.rejectAdvanceContribution(params.contributionId, user.id, reason);
    }

    return NextResponse.json({ success: true, message: `Advance contribution ${action.toLowerCase()}d` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update advance contribution' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; contributionId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbStore.deleteAdvanceContribution(params.contributionId, user.id);
    return NextResponse.json({ success: true, message: 'Advance contribution deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete advance contribution' }, { status: 400 });
  }
}
