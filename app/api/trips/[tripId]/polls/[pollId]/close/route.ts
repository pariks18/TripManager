import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: { tripId: string; pollId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { isClosed } = await request.json().catch(() => ({ isClosed: true }));

    await dbStore.closePoll(
      params.tripId,
      user.id,
      params.pollId,
      isClosed !== undefined ? isClosed : true
    );

    return NextResponse.json({ success: true, message: `Poll ${isClosed ? 'closed' : 'reopened'}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update poll status' }, { status: 400 });
  }
}
