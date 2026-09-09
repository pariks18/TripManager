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
    const { name, email, mobile } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Participant name is required' }, { status: 400 });
    }

    const member = await dbStore.addUnjoinedMember(params.tripId, user.id, {
      name: name.trim(),
      email: email ? email.trim() : undefined,
      mobile: mobile ? mobile.trim() : undefined,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to add unjoined participant' },
      { status }
    );
  }
}
