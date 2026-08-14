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
    const { action } = await request.json();
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT.' }, { status: 400 });
    }

    const contribution = await dbStore.processWalletContribution(
      params.tripId,
      params.contributionId,
      user.id,
      action as 'APPROVE' | 'REJECT'
    );

    return NextResponse.json({ contribution });
  } catch (error: any) {
    console.error('[API PATCH /api/trips/[tripId]/wallet/contributions/[contributionId] error]:', error);
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to process contribution' }, { status });
  }
}
