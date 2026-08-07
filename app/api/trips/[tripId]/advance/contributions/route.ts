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
    const { amount, utr, screenshotUrl, note } = await request.json();

    const contribution = await dbStore.submitAdvanceContribution(
      params.tripId,
      user.id,
      parseFloat(amount),
      utr,
      screenshotUrl,
      note
    );

    return NextResponse.json({ contribution });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit advance contribution' }, { status: 400 });
  }
}
