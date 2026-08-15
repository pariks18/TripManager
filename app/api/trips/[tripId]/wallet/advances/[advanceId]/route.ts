import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; advanceId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT.' }, { status: 400 });
    }

    const advance = await dbStore.processWalletAdvance(
      params.advanceId,
      user.id,
      action as 'APPROVE' | 'REJECT'
    );

    return NextResponse.json({ advance });
  } catch (error: any) {
    console.error('[API PATCH /api/trips/[tripId]/wallet/advances/[advanceId] error]:', error);
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to process advance' }, { status });
  }
}
