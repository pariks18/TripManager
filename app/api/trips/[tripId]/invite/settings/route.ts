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
    const body = await request.json();

    if (body.action === 'regenerate') {
      const newToken = await dbStore.regenerateTripInviteToken(params.tripId, user.id);
      return NextResponse.json({
        success: true,
        inviteToken: newToken,
        message: 'Invite link regenerated successfully. Previous links are now invalid.',
      });
    }

    const updatedSettings = await dbStore.updateTripInviteSettings(params.tripId, user.id, {
      approvalMode: body.approvalMode,
      inviteEnabled: body.inviteEnabled,
    });

    return NextResponse.json({
      success: true,
      ...updatedSettings,
      message: 'Invite settings updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update invite settings' },
      { status: 400 }
    );
  }
}
