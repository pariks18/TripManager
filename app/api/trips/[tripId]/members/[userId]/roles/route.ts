import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';
import { TripRoleType } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string; userId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role } = await request.json();
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const member = await dbStore.assignMemberRole(
      params.tripId,
      user.id,
      params.userId,
      role as TripRoleType
    );

    return NextResponse.json({ member }, { status: 200 });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to assign role' },
      { status }
    );
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
    const { role } = await request.json();
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const member = await dbStore.removeMemberRole(
      params.tripId,
      user.id,
      params.userId,
      role as TripRoleType
    );

    return NextResponse.json({ member }, { status: 200 });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to remove role' },
      { status }
    );
  }
}
