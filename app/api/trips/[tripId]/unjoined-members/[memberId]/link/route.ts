import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string; memberId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { registeredUserId, registeredUserEmail } = body;

    let targetUserId = registeredUserId;

    if (!targetUserId && registeredUserEmail) {
      const foundUser = await dbStore.findUserByEmail(registeredUserEmail.trim());
      if (!foundUser) {
        return NextResponse.json({ error: 'No registered user found with that email.' }, { status: 404 });
      }
      targetUserId = foundUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Registered user ID or email is required to link account.' }, { status: 400 });
    }

    const member = await dbStore.linkUnjoinedMember(
      params.tripId,
      user.id,
      params.memberId,
      targetUserId
    );

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to link unjoined member to user account' },
      { status }
    );
  }
}
