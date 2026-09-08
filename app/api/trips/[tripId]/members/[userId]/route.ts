import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function GET(
  request: Request,
  { params }: { params: { tripId: string; userId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await dbStore.checkMemberRemovalStatus(params.tripId, params.userId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check member status' }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string; userId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role } = await request.json();
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid role. Role must be ADMIN or MEMBER.' }, { status: 400 });
    }

    const updatedMember = await dbStore.updateMemberRole(
      params.tripId,
      user.id,
      params.userId,
      role
    );

    return NextResponse.json({
      success: true,
      message: `Member role updated to ${role === 'ADMIN' ? 'Organizer' : 'Member'}`,
      member: updatedMember,
    });
  } catch (error: any) {
    const status = error.message?.startsWith('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update member role' }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tripId: string; userId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, reassignToUserId } = await request.json().catch(() => ({}));
    
    await dbStore.removeTripMember(
      params.tripId,
      user.id,
      params.userId,
      action || 'REMOVE',
      reassignToUserId
    );

    return NextResponse.json({ success: true, message: 'Member successfully removed from trip' });
  } catch (error: any) {
    const status = error.message?.startsWith('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to remove member' }, { status });
  }
}
