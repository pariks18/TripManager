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
    const { advanceTargetPerMember, requireAdvanceVerification } = await request.json();

    await dbStore.updateTripAdvanceSettings(
      params.tripId,
      user.id,
      advanceTargetPerMember !== undefined ? advanceTargetPerMember : null,
      requireAdvanceVerification !== undefined ? requireAdvanceVerification : true
    );

    return NextResponse.json({ success: true, message: 'Advance Trip Fund settings updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update advance settings' }, { status: 400 });
  }
}
